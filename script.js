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
    return false
    }
    return true
}

function requestBluetoothDevice() {
    if(isWebBluetoothEnabled()){
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

async function send(data) {
    if (gattCharacteristic) {
        console.log("You -> " + data);
        let start = 0;
        let dataLength = data.length;
        while (start < dataLength) {
            let subStr = data.substring(start, start + 16);
            try {
                await gattCharacteristic.writeValue(str2ab(subStr));
            } catch (error) {
                console.error("Error writing to characteristic:", error);
                break;
            }
            start += 16;
        }
        try {
            await gattCharacteristic.writeValue(str2ab('\n'));
        } catch (error) {
            console.error("Error writing newline to characteristic:", error);
        }
    } else {
        console.log("GATT Characteristic not found.");
    }
}

function enableButtons() {
    buttons.forEach(button => {
        button.disabled = false;
    });
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
    checkFirstValueBME = true;
    checkmess = false;
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
let timeoutCheckMessage;
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

let TextAreaHC_SR501 = document.getElementById("HC-SR501");
let TextAreaOLED = document.getElementById("OLED");
let TextAreaSoilMoisture = document.getElementById("SoilMoisture");
let TextAreaBME280 = document.getElementById("BME280");
let TextAreaESP = document.getElementById("ESP");
let TextAreaMAX30102 = document.getElementById("MAX30102");

let TextAreaBME_Tem = document.getElementById("BME_Tem");
let TextAreaBME_Hum = document.getElementById("BME_Hum");
let TextAreaBME_Pres = document.getElementById("BME_Pres");
let TextAreaRelAlt = document.getElementById("BME_RelAlt");

let TextAreaUTC_Time = document.getElementById("UTC_Time");
let TextAreaBrowser_Time = document.getElementById("Browser_Timezone");
let TextAreaLocal_Time = document.getElementById("Local_Time");

let checkFirstValueBME = true;
let RelAltRef ;
let countBMEValue;
let sumAlt = 0;

let buttonTestSoil = document.getElementById('Soil-Moisture-button');

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
    TextAreaRelAlt.value = "";
    TextAreaSoilMin.value = "";
    TextAreaSoilMax.value = "";
    TextAreaSoilRange.value = "";
    document.getElementById("ssid").value = "";
    document.getElementById("password").value = "";
    TextAreaUTC_Time.value = "";
    TextAreaBrowser_Time.value = "";
    TextAreaLocal_Time.value = "";
}

function handleChangedValue(event) {
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);
    let n = valueString.length;

    if(valueString[n-1] === '\n'){
        string += valueString;
        console.log("Nano >" + string);
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
        if(arrString[0] === 'OLED' || arrString[0] === 'Observe'){
            if(arrString[2] === 'Error') TextAreaOLED.value = "OLED not detected";
            else if(arrString[1] === 'Init') TextAreaOLED.value = string.substring(5, string.length);
            else TextAreaOLED.value = string;
        }
        if(arrString[0] === 'SoilMoisture'){
            if(arrString[1] === 'Init'){
                if(arrString[2] === 'Error'){
                    TextAreaSoilMoisture.value = "Soil Moisture not detected";
                }
                else TextAreaSoilMoisture.value = string.substring(12, string.length);
            }
            else{
            if(arrString[1] === '1024'){
                TextAreaSoilMoisture.value = "Soil Moisture Sensor not plugged in"; 
                TextAreaSoilMin.value = "";
                TextAreaSoilMax.value = "";
                TextAreaSoilRange.value = "";
            }
            else{
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
            }
        }
        if(arrString[0] === 'BME280'){
            console.log(arrString[2]);
            if(arrString[2] === 'Error'){
                const buttonBME = document.getElementById('BME280-button');
                buttonBME.disabled = true;
                TextAreaBME280.value = "BME280 not detected";    
            }
            else TextAreaBME280.value = string.substring(6, string.length);
            if(arrString[1] === 'Tem'){
                TextAreaBME_Tem.value = parseFloat(arrString[2]).toFixed(1);
                TextAreaBME_Hum.value = parseFloat(arrString[4]).toFixed(1);
                TextAreaBME_Pres.value = arrString[6];
                let ALtRawFloat = parseFloat(arrString[8]);
                if(checkFirstValueBME){
                    countBMEValue++;
                    sumAlt += ALtRawFloat;
                    if(countBMEValue === 10){
                        RelAltRef = sumAlt/10;
                        checkFirstValueBME = false;
                    }
                }
                if(!checkFirstValueBME) TextAreaRelAlt.value = (ALtRawFloat - RelAltRef).toFixed(2);
            }
        }
        if(arrString[0] === 'Connecting'){
            TextAreaESP.value = string;
        }
        if(arrString[0] === 'WiFi'){
            if(arrString[1] === 'UTC'){
            TextAreaUTC_Time.value = arrString[3].replace('T', ' ').replace('Z', '');
            const utcDate = new Date(arrString[3]);  // Chuyển chuỗi UTC thành đối tượng Date
            const parts = utcDate.toString().split(' ');  // Chuyển Date thành chuỗi rồi tách thành các phần

            if (parts[5]) {
                timeZonePart = parts[5].substring(3, 8);
            }
             // Hiển thị múi giờ vào TextAreaBrowser_Timezone
            TextAreaBrowser_Time.value = timeZonePart;

            // Tính giờ địa phương
            const localTime = utcDate.toLocaleString('en-GB', { hour12: false });  // Lấy giờ địa phương với định dạng 'en-GB'
            console.log(localTime);

                // Tách chuỗi localTime thành ngày và giờ
                let [datePart, timePart] = localTime.split(', ');
                
                // Thay dấu '/' bằng dấu '-'
                datePart = datePart.replace(/\//g, '-');
                
                // Đảo ngược vị trí của ngày/tháng/năm thành năm/tháng/ngày
                const [day, month, year] = datePart.split('-');
                const formattedDate = `${year}-${month}-${day}`;
                
                // Tạo chuỗi kết quả cuối cùng
                const formattedLocalTime = `${formattedDate} ${timePart}`;
                
                // Hiển thị giờ địa phương vào TextAreaLocal_Time
                TextAreaLocal_Time.value = formattedLocalTime;  // Kết quả ví dụ: "2024-10-15 09:06:17"
                // TextAreaLocal_Time.value = utcDate;
            }
            else{
                TextAreaESP.value = TextAreaESP.value + string;
            }
        }
        if(arrString[0] === 'MAX30102'){
            console.log(arrString[2]);
            if(arrString[2] === 'Error'){
                const buttonMAX30102 = document.getElementById('MAX30102-button');
                buttonMAX30102.disabled = true;
                TextAreaMAX30102.value = "MAX30102 not detected";
            }
            else{
                TextAreaMAX30102.value = string.substring(9, string.length);
            }
        }  
        string = "";
    }
    else{
        string += valueString;     
    }
}

// Hàm connectWiFi sử dụng async/await để xử lý delay
async function connectWiFi() {
    SSIDfromWeb = document.getElementById('ssid').value;
    PasswordfromWeb = document.getElementById('password').value;
    
    if(SSIDfromWeb === "" || PasswordfromWeb === ""){
        TextAreaESP.value = "Input WiFi SSID and Password to Test WiFi";
    }
    else{
        TextAreaESP.value = "";
        TextAreaUTC_Time.value = "";
        TextAreaBrowser_Time.value = "";
        TextAreaLocal_Time.value = "";
        // Gửi thông tin SSID
        await send("WiFi SSID " + SSIDfromWeb);
        // Gửi thông tin Password
        await send("WiFi Password " + PasswordfromWeb);
        // Gửi lệnh kết nối
        await send("WiFi Connect");
        TextAreaESP.value = "Connecting ...";
    }
}

function TestSoilMoisture(){
    send("SoilMoisture Test");
    checkFirstValue = true;
}

function TestOLED(){
    TextAreaOLED.value = "Observe the OLED screen";
    send("OLED Test");
}

function TestBME280(){
    send("BME280 Test");
    checkFirstValueBME = true;
    countBMEValue = 0;
    sumAlt = 0;
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