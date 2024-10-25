const bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
const bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
let gattCharacteristic;

function isWebBluetoothEnabled() {
    if (! navigator.bluetooth) {
        console.log('Web Bluetooth API is not available in this browser!');
        return false;
    }
    return true;
}

function requestBluetoothDevice() {
    if (isWebBluetoothEnabled()){
        logstatus('Finding...');
        navigator.bluetooth.requestDevice({
        filters: [{ services: ['0000ffe0-0000-1000-8000-00805f9b34fb'] }] 
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
        gattCharacteristic = characteristic;
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

function checkMessageWithin5Seconds() {
    // Thiết lập hàm setTimeout để kết thúc sau 5 giây
    timeoutCheckMessage = setTimeout(function() {
    console.log("5 seconds timeout, message incorrect.");
    // Hiển thị info box
    document.getElementById("infopopup").style.display = "block";
    document.addEventListener("click", function(event) {
        if (! infoBox.contains(event.target)) {
            infoBox.style.display = "none";
        }
    });
    }, 5000);
}

function logstatus(text){
    const navbarTitle = document.getElementById('navbarTitle');
    navbarTitle.textContent = text;
}

function disconnect(){
    logstatus("SCAN to connect");
    console.log("Disconnected from: " + dev.name);
    return dev.gatt.disconnect();
}

function onDisconnected(event) {
    const device = event.target;
    logstatus("SCAN to connect");
    resetVariable();
    document.getElementById("buttonText").innerText = "Scan";
    console.log(`Device ${device.name} is disconnected.`);
}

async function send(data) {
    if (! gattCharacteristic) {
        console.log("GATT Characteristic not found.");
        return;
    }
    console.log("You -> " + data);
    let start = 0;
    const dataLength = data.length;
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
}

function str2ab(str){
    let buf = new ArrayBuffer(str.length);
    let bufView = new Uint8Array(buf);
    for (var i = 0, l = str.length; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

const buttons = document.querySelectorAll('.btn-primary-test');
buttons.forEach(button => {
    button.disabled = true;
});

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

const button = document.getElementById("toggleButton");
function toggleFunction() {
    if (button.innerText == "Scan") {
        requestBluetoothDevice();
        return;
    } 
    disconnect();
    requestBluetoothDevice();
    resetVariable();
}

function resetVariable(){
    SoilMoisture_isFirstRead = true;
    BME280_isFirstRead = true;
    checkMsg = false;
    disableButtons();
    clearTextArea();
    clearTimeout(timeoutCheckMessage);
    document.querySelectorAll('.item').forEach(item => {
        item.classList.remove('active');
    });
}

function clearTextArea() {
    const textAreas = [
        'HCSR501_TextArea', 'OLED_TextArea', 'SoilMoisture_TextArea', 'BME280_TextArea', 'WiFi_TextArea', 
        'MAX30102_TextArea', 'BME280_TextArea_Tem', 'BME280_TextArea_Hum', 'BME280_TextArea_pres', 'BME280_TextArea_RelAlt', 
        'SoilMoisture_TextArea_Min', 'SoilMoisture_TextArea_Max', 'SoilMoisture_TextArea_Range', 'MAX30102_TextArea_Beat', 
        'WiFi_TextArea_PasswordfromWeb', 'WiFi_TextArea_SSIDfromWeb', 'WiFi_TextArea_UTC_Time', 
        'WiFi_TextArea_Browser_Time', 'WiFi_TextArea_Local_Time'
    ];

    // Reset value for each TextArea
    textAreas.forEach(id => {
        if (document.getElementById(id)) {
            document.getElementById(id).value = "";
        }
    });
}

let string = "";
function handleChangedValue(event) {
    const data = event.target.value;
    const dataArray = new Uint8Array(data.buffer);
    const textDecoder = new TextDecoder('utf-8');
    const valueString = textDecoder.decode(dataArray);

    string += valueString;
    if (!valueString.endsWith('\n')) return;

    console.log("Nano > " + string);
    string.split(/[\r\n]+/).forEach(line => {
        handleSerialLine(line);  // Handle each line individually
    });
    string = "";
}

function handleSerialLine(line) {
    if (! line) return;
    console.log("line: " + line);

    checkCodefromLeanbot(line);

    const arrString = line.split(/[ \t]+/);
    switch(arrString[0]) {
        case 'HC-SR501'      : return HCSR501_handle(arrString);
        case 'OLED'          : return OLED_handle(arrString);
        case 'SoilMoisture'  : return SoilMoisture_handle(arrString);
        case 'BME280'        : return BME280_handle(arrString);
        case 'WiFi'          : return WiFi_handle(arrString);
        case 'MAX30102'      : return MAX30102_handle(arrString);
        default              : console.log("Unknown message type");
    }
}

const msgFromLeanbot = "Test IoT Modules";
let checkMsg = false;
let timeoutCheckMessage;

function checkCodefromLeanbot(line) { 
    if (line !== msgFromLeanbot || checkMsg) return;
    clearTimeout(timeoutCheckMessage);
    checkMsg = true;
    console.log("Correct message.");
} 

//********HC-SR501********//
const HCSR501_TextArea = document.getElementById("HC-SR501");
const HCSR501_Square = document.getElementById('squareHCSR501');

function HCSR501_handle(arrString) {
    HCSR501_TextArea.value = arrString[1];
    if (arrString[1] === '1') HCSR501_Square.style.backgroundColor = "red";
    else HCSR501_Square.style.backgroundColor = "white";
}

function HCSR501_button(){
    send("HC-SR501 Test");
}

//********OLED********//
const OLED_TextArea = document.getElementById("OLED");

function OLED_handle(arrString) {
    if (arrString[2] === 'Error') OLED_TextArea.value = "OLED not detected";
    else OLED_TextArea.value = arrString[1] + " " + arrString[2];
}

function OLED_button(){
    send("OLED Test");
    OLED_TextArea.value = "Observe the OLED screen";
}

//********SoilMoisture********//
const SoilMoisture_TextArea = document.getElementById("SoilMoisture");
const SoilMoisture_TextArea_Min = document.getElementById("SoilMin");
const SoilMoisture_TextArea_Max = document.getElementById("SoilMax");
const SoilMoisture_TextArea_Range = document.getElementById("SoilRange");
const SoilMoisture_Progress = document.getElementById("progressSoil");

let SoilMoisture_isFirstRead = true;
let SoilMoisture_IntMin = 1024;
let SoilMoisture_IntMax = 0;

function SoilMoisture_handle(arrString) {
    const moistureValue = parseInt(arrString[1]);

    if (moistureValue === 1024) {
        let msg = SoilMoisture_isFirstRead ? "Soil Moisture not detected" : "Soil Moisture Sensor not plugged in";
        SoilMoisture_TextArea.value = msg;
        SoilMoisture_TextArea_Min.value = "";
        SoilMoisture_TextArea_Max.value = "";
        SoilMoisture_TextArea_Range.value = "";
        return;
    }

    SoilMoisture_TextArea.value = "Init Ok";
    SoilMoisture_IntMin = Math.min(SoilMoisture_IntMin, moistureValue);
    SoilMoisture_IntMax = Math.max(SoilMoisture_IntMax, moistureValue);

    SoilMoisture_TextArea.value = moistureValue;
    SoilMoisture_Progress.value = moistureValue;
    SoilMoisture_TextArea_Min.value = SoilMoisture_IntMin;
    SoilMoisture_TextArea_Max.value = SoilMoisture_IntMax;
    SoilMoisture_TextArea_Range.value = SoilMoisture_IntMax - SoilMoisture_IntMin;
}

function SoilMoisture_button() {
    send("SoilMoisture Test");
    SoilMoisture_IntMin = 1024;
    SoilMoisture_IntMax = 0;
}

//********BME280********//
const BME280_TextArea = document.getElementById("BME280");
const BME280_TextArea_Tem = document.getElementById("BME_Tem");
const BME280_TextArea_Hum = document.getElementById("BME_Hum");
const BME280_TextArea_pres = document.getElementById("BME_Pres");
const BME280_TextArea_RelAlt = document.getElementById("BME_RelAlt");

let BME280_isFirstRead = true;
let BME280_RelAltRef;
let BME280_CountValue;
let BME280_SumAlt = 0;

function BME280_handle(arrString) {
    if(arrString[2] === 'Error'){
        document.getElementById('BME280-button').disabled = true;
        BME280_TextArea.value = "BME280 not detected";    
        return;
    }
    BME280_TextArea.value = arrString.slice(1, 9).join(' ');

    if(arrString[1] !== 'Tem') return;

    BME280_TextArea_Tem.value  = `${parseFloat(arrString[2]).toFixed(1)} °C`;
    BME280_TextArea_Hum.value  = `${parseFloat(arrString[4]).toFixed(1)} %`;
    BME280_TextArea_pres.value = `${arrString[6]} hPa`;
    let BME280_ALtRawFloat = parseFloat(arrString[8]);

    if(BME280_isFirstRead){
        BME280_SumAlt += BME280_ALtRawFloat;
        if(++BME280_CountValue === 10){
            BME280_RelAltRef = BME280_SumAlt / 10;
            BME280_isFirstRead = false;
        }
    }
    else BME280_TextArea_RelAlt.value = `${(BME280_ALtRawFloat - BME280_RelAltRef).toFixed(2)} m`;
}

function BME280_button(){
    send("BME280 Test");
    BME280_isFirstRead = true;
    BME280_CountValue = 0;
    BME280_SumAlt = 0;
}

//********WiFi********//
const WiFi_TextArea = document.getElementById("ESP");
const WiFi_TextArea_SSIDfromWeb = document.getElementById('ssid');
const WiFi_TextArea_PasswordfromWeb = document.getElementById('password');
const WiFi_TextArea_UTC_Time = document.getElementById("UTC_Time");
const WiFi_TextArea_Browser_Time = document.getElementById("Browser_Timezone");
const WiFi_TextArea_Local_Time = document.getElementById("Local_Time");

function WiFi_handle(arrString) {
    if(arrString[1] !== 'UTC'){
        const msgWiFi = string.split(/[\r\n]+/);
        if (msgWiFi[2].startsWith("WiFi")) WiFi_TextArea.value = msgWiFi[0] + "\n" + msgWiFi[1] + "\n" + msgWiFi[2];
        else WiFi_TextArea.value = msgWiFi[0] + "\n" + msgWiFi[1];
        return;
    }

    WiFi_TextArea_UTC_Time.value = arrString[3].replace('T', ' ').replace('Z', '');
    const utcDate = new Date(arrString[3]);  
    const parts = utcDate.toString().split(' ');  
    if (parts[5]) {
        WiFi_TextArea_Browser_Time.value = parts[5].substring(3, 8);
    }

    const localTime = utcDate.toLocaleString('en-GB', { hour12: false });  
    let [datePart, timePart] = localTime.split(', ');
    datePart = datePart.replace(/\//g, '-');
    const [day, month, year] = datePart.split('-');
    const formattedDate = `${year}-${month}-${day}`;
    const formattedLocalTime = `${formattedDate} ${timePart}`;

    WiFi_TextArea_Local_Time.value = formattedLocalTime;
}

async function WiFi_button(){
    if(WiFi_TextArea_SSIDfromWeb.value === "" || WiFi_TextArea_PasswordfromWeb.value === ""){
        WiFi_TextArea.value = "Input WiFi SSID and Password to Test WiFi";
        return;
    }

    await send("WiFi SSID " + WiFi_TextArea_SSIDfromWeb.value);
    await send("WiFi Password " + WiFi_TextArea_PasswordfromWeb.value);
    await send("WiFi Connect");
    WiFi_TextArea.value = "";
    WiFi_TextArea_UTC_Time.value = "";
    WiFi_TextArea_Browser_Time.value = "";
    WiFi_TextArea_Local_Time.value = "";
    WiFi_TextArea.value = "Connecting ...";
}

//********MAX30102********//
const MAX30102_TextArea = document.getElementById("MAX30102");
const MAX30102_TextArea_Beat = document.getElementById("MAX_beat");
const MAX30102_TextArea_BPM = document.getElementById("MAX_bpm");
const MAX30102_Square = document.getElementById('squareFinger');

function MAX30102_handle(arrString) {
    MAX30102_TextArea.value = arrString.slice(1, 5).join(' ');

    if(arrString[1] === 'Init'){
        if(arrString[2] === 'Error'){
            document.getElementById('MAX30102-button').disabled = true;
            MAX30102_TextArea.value = "MAX30102 not detected";
        }
        return;
    }

    if(arrString[1] === 'No') {
        MAX30102_Square.style.backgroundColor = "white";
        MAX30102_TextArea_Beat.value = "";
        MAX30102_TextArea_BPM.value = "";
        return;
    }
    MAX30102_Square.style.backgroundColor = "red";
    MAX30102_TextArea_Beat.value = arrString[2];
    MAX30102_TextArea_BPM.value = arrString[4];
}

function MAX30102_button(){
    send("MAX30102 Test");
}

//****************//

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