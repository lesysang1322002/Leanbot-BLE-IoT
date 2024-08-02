var bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var gattCharacteristic;
var bluetoothDeviceDetected;

let Text_Area = document.getElementById("textareaNotification");
let Text_RGBLeds = document.getElementById("textAreaRGB");
let Text_Steppers = document.getElementById("textAreaStepper");

function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
    console.log('Web Bluetooth API is not available in this browser!');
    // log('Web Bluetooth API is not available in this browser!');
    return false
    }
    return true
}
function requestBluetoothDevice() {
    if(isWebBluetoothEnabled){
logstatus('Finding...');
navigator.bluetooth.requestDevice({
    filters: [{
        services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }] 
    })         
.then(device => {
    device.addEventListener('gattserverdisconnected', onDisconnected);
    dev=device;
    logstatus("Connect to " + dev.name);
    console.log('Connecting to', dev);
    return device.gatt.connect();
})
.then(server => {
        console.log('Getting GATT Service...');
        logstatus('Getting Service...');
        return server.getPrimaryService(bleService);
    })
    .then(service => {
        console.log('Getting GATT Characteristic...');
        logstatus('Geting Characteristic...');
        return service.getCharacteristic(bleCharacteristic);
    })
    .then(characteristic => {
        logstatus(dev.name + " - IoT Modules");
        checkMessageWithin5Seconds();
        document.getElementById("buttonText").innerText = "Rescan";
        checkconnected = true;
        gattCharacteristic = characteristic
        gattCharacteristic.addEventListener('characteristicvaluechanged', handleChangedValue);   
        return gattCharacteristic.startNotifications();
})
.catch(error => {
    if (error instanceof DOMException && error.name === 'NotFoundError' && error.message === 'User cancelled the requestDevice() chooser.') {
        console.log("User has canceled the device connection request.");
        logstatus("SCAN to connect");
    } else {
        console.log("Unable to connect to device: " + error);
        logstatus("ERROR");
    }
    });
}}

function disconnect()
{
    logstatus("SCAN to connect");
    console.log("Disconnected from: " + dev.name);
    return dev.gatt.disconnect();
}

function onDisconnected(event) {
    const device = event.target;
    logstatus("SCAN to connect");
    document.getElementById("buttonText").innerText = "Scan";
    console.log(`Device ${device.name} is disconnected.`);
}

function send(data){
    console.log("You -> " + data + "\n");
    gattCharacteristic.writeValue(str2ab(data+"\n"));
}

function str2ab(str){
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, l = str.length; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

function  logstatus(text){
    const navbarTitle = document.getElementById('navbarTitle');
    navbarTitle.textContent = text;
}

const button = document.getElementById("toggleButton");

function toggleFunction() {
    if (button.innerText == "Scan") {
        requestBluetoothDevice();
    } else {
        disconnect();
        requestBluetoothDevice();
        Rescan();
    }
}

function Rescan(){
    checkconnected = false;
    clearTimeout(timeoutId);
    checkFirstValue = true;
    // checkmessage = false;
}

function checkMessageWithin5Seconds() {
    // Thiết lập hàm setTimeout để kết thúc sau 5 giây
        timeoutCheckMessage = setTimeout(function() {
        console.log("5 seconds timeout, message incorrect.");
        let infoBox = document.getElementById("infopopup");
        // Hiển thị info box
        infoBox.style.display = "block";
        document.addEventListener("click", function(event) {
            if (!infoBox.contains(event.target)) {
                infoBox.style.display = "none";
            }
        });
    }, 5000);
}

let checkconnected = false;
let checkmess = false;

let string = "";
let stringfromLeanbot = "Test IoT Modules";

let SSIDfromWeb = "";
let PasswordfromWeb = "";
let SSIDfromLeanbot = "";
let PasswordfromLeanbot = "";

let TextAreaHC_SR501 = document.getElementById("HC-SR501");
let TextAreaOLED = document.getElementById("OLED");
let TextAreaSoilMoisture = document.getElementById("Soil Moisture");
let TextAreaBME280 = document.getElementById("BME280");
let TextAreaESP = document.getElementById("ESP");
let TextAreaMAX30102 = document.getElementById("MAX30102");

let TextAreaBME_Tem = document.getElementById("BME_Tem");
let TextAreaBME_Hum = document.getElementById("BME_Hum");
let TextAreaBME_Pres = document.getElementById("BME_Pres");
let TextAreaBME_Alt = document.getElementById("BME_Alt");

function handleChangedValue(event) {
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);
    let n = valueString.length;
    if(valueString[n-1] === '\n'){
        string += valueString;
        console.log(string);
        string = string.replace(/(\r\n|\n|\r)/gm, "");
        let arrString = string.split(/[ \t\r\n]+/);

        if (string == stringfromLeanbot && !checkmess) {
            clearTimeout(timeoutCheckMessage);
            checkmess = true;
            console.log("Correct message.");
        }

        if(arrString[0] === 'HC-SR501'){
            TextAreaHC_SR501.value = arrString[1];
        }
        if(arrString[0] === 'OLED'){
            TextAreaOLED.value = arrString[1];
        }
        if(arrString[0] === 'SoilMoisture'){
            TextAreaSoilMoisture.value = arrString[1];
        }
        if(arrString[0] === 'BME280'){
            TextAreaBME280.value = string.substring(6, string.length);
            if(arrString[1] === 'Tem'){
                TextAreaBME_Tem.value = arrString[2];
                TextAreaBME_Hum.value = arrString[4];
                TextAreaBME_Pres.value = arrString[6];
                TextAreaBME_Alt.value = arrString[8];
            }
        }
        if(arrString[0] === 'ESP'){
            TextAreaESP.value = string;
        }
        if(arrString[0] === 'MAX30102'){
            TextAreaMAX30102.value = string.substring(9, string.length);
        }
        if(arrString[0] === 'SSID'){
            SSIDfromLeanbot = arrString[1];
            console.log(SSIDfromLeanbot);
        }
        if(arrString[0] === 'Password'){
            PasswordfromLeanbot = arrString[1];
            console.log(PasswordfromLeanbot);
            if(SSIDfromLeanbot == SSIDfromWeb && PasswordfromLeanbot == PasswordfromWeb){
                TextAreaESP.value = "Connect to WiFi successfully!";
            }
        }
        string = "";
    }
    else{
        string += valueString;     
    }
}

function checkInputs() {
    const ssid = document.getElementById('ssid').value.trim();
    const password = document.getElementById('password').value.trim();
    const button = document.getElementById('ESP-button');

    // Kích hoạt nút Test chỉ khi cả SSID và Password đều được nhập
    button.disabled = !(ssid && password);
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Hàm connectWiFi sử dụng async/await để xử lý delay
async function connectWiFi() {
    SSIDfromWeb = document.getElementById('ssid').value;
    PasswordfromWeb = document.getElementById('password').value;

    // Gửi thông tin SSID
    send("WiFi SSID " + SSIDfromWeb);
    await delay(100); // Chờ 100ms

    // Gửi thông tin Password
    send("WiFi Password " + PasswordfromWeb);
    await delay(100); // Chờ 100ms

    // Gửi lệnh kết nối
    send("WiFi Connect");
    await delay(100); // Chờ 100ms
}

function changeImageOled(){
    if(TextAreaOLED.value === "Circle"){
        send("OLED Test2");
    }
    else{
        send("OLED Test1");
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    const buttons = document.querySelectorAll('.btn-primary-test');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            // Xóa lớp 'active' khỏi tất cả các mục
            document.querySelectorAll('.item').forEach(item => {
                item.classList.remove('active');
            });

            // Thêm lớp 'active' vào mục chứa nút được nhấn
            button.closest('.item').classList.add('active');
        });
    });
});

document.addEventListener('DOMContentLoaded', function () {
    var infoButton = document.getElementById('infoButton');
    var infoContent = document.getElementById('infoContent');
  
    infoButton.addEventListener('click', function (event) {
        event.stopPropagation(); // Ngăn chặn sự kiện click lan sang các phần tử cha
        if (infoContent.style.display === 'block') {
            infoContent.style.display = 'none';
        } else {
            infoContent.style.display = 'block';
        }
    });
  
    document.addEventListener('click', function () {
        infoContent.style.display = 'none';
    });
});

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    const contents = document.querySelectorAll('.content');
    
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    contents.forEach(content => {
        content.classList.remove('active');
    });
    
    document.getElementById(tabId).classList.add('active');
    document.getElementById('tab' + tabId.slice(-1)).classList.add('active');
}

var tabs = document.querySelectorAll('.tab');

// Add event listener to each tab
tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(function(tab) {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        this.classList.add('active');
    });
});
