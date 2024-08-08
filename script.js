var bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var gattCharacteristic;
var bluetoothDeviceDetected;

let buttons = document.querySelectorAll('.btn-primary-test');

buttons.forEach(button => {
    button.disabled = true;
});

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
        enableButtons();
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
    ResetVariable();
}

function send(data) {
    if (gattCharacteristic) {
        console.log("You -> " + data);
        gattCharacteristic.writeValue(str2ab(data + "\n"));
    } else {
        console.log("GATT Characteristic not found.");
    }
}

function enableButtons() {
    buttons.forEach(button => {
        button.disabled = false;
    });
    const button = document.getElementById('ESP-button');
    button.disabled = true;
}

function disableButtons() {
    buttons.forEach(button => {
        button.disabled = true;
    });
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
        ResetVariable();
    }
}

function ResetVariable(){
    checkFirstValue = true;
    checkmess = false;
    ConectedWifi = false;
    disableButtons();
    clearTimeout(timeoutCheckMessage);
    clearTextArea();
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('active');
    });
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

let checkmess = false;

let string = "";
let stringfromLeanbot = "Test IoT Modules";
let checkFirstValue = true;
let MinSoilMoisture;
let MaxSoilMoisture;
let TextAreaSoilMin = document.getElementById("SoilMin");
let TextAreaSoilMax = document.getElementById("SoilMax");
let TextAreaSoilRange = document.getElementById("SoilRange");


let SSIDfromWeb = "";
let PasswordfromWeb = "";
let SSIDfromLeanbot = "";
let PasswordfromLeanbot = "";
let ConectedWifi = false;

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

function clearTextArea(){
    TextAreaHC_SR501.value = "";
    TextAreaOLED.value = "";
    TextAreaSoilMoisture.value = "";
    TextAreaBME280.value = "";
    TextAreaESP.value = "";
    TextAreaMAX30102.value = "";
    TextAreaBME_Tem.value = "";
    TextAreaBME_Hum.value = "";
    TextAreaBME_Pres.value = "";
    TextAreaBME_Alt.value = "";
    TextAreaSoilMin.value = "";
    TextAreaSoilMax.value = "";
    TextAreaSoilRange.value = "";
    document.getElementById("ssid").value = "";
    document.getElementById("password").value = "";
}

function handleChangedValue(event) {
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);
    // console.log("Nano > " + valueString);
    let n = valueString.length;
    if(valueString[n-1] === '\n'){
        string += valueString;
        console.log("NanN" + string);
        let arrString = string.split(/[ \t\r\n]+/);
        if(arrString[0] != 'Connecting'){
            string = string.replace(/(\r\n|\n|\r)/gm, "");
        }
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
            let SoilMoistureInt = parseInt(arrString[1]);
            if(checkFirstValue){
                checkFirstValue = false;
                MinSoilMoisture = SoilMoistureInt;
                MaxSoilMoisture = SoilMoistureInt;
            }
            if(SoilMoistureInt < MinSoilMoisture){
                MinSoilMoisture = SoilMoistureInt;
            }
            if(SoilMoistureInt > MaxSoilMoisture){
                MaxSoilMoisture = SoilMoistureInt;
            }
            TextAreaSoilMin.value = MinSoilMoisture;
            TextAreaSoilMax.value = MaxSoilMoisture;
            TextAreaSoilRange.value = MaxSoilMoisture - MinSoilMoisture;
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
        if(arrString[0] === 'Connecting'){
            TextAreaESP.value = string;
        }
        if(arrString[0] === 'WiFi'){
            TextAreaESP.value = TextAreaESP.value + string;
            if(arrString[1] === 'Connected'){
                ConectedWifi = true;
            }
        }
        if(arrString[0] === 'MAX30102'){
            TextAreaMAX30102.value = string.substring(9, string.length);
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
    if(gattCharacteristic){
    button.disabled = !(ssid && password);
    }
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
    if(!ConectedWifi){
    TextAreaESP.value = "Connecting ...";
    }
}

function changeImageOled(){
    if(TextAreaOLED.value === "Circle"){
        send("OLED Test2");
    }
    else if(TextAreaOLED.value === "Frame"){
        send("OLED Test1");
    }
}

function TestSoilMoisture(){
    send("SoilMoisture Test");
    checkFirstValue = true;
}

document.addEventListener('DOMContentLoaded', (event) => {
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
