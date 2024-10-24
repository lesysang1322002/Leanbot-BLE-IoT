var bleService = '0000ffe0-0000-1000-8000-00805f9b34fb';
var bleCharacteristic = '0000ffe1-0000-1000-8000-00805f9b34fb';
var gattCharacteristic;
var bluetoothDeviceDetected;

function isWebBluetoothEnabled() {
    if (!navigator.bluetooth) {
    console.log('Web Bluetooth API is not available in this browser!');
    return false;
    }
    return true;
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

function disconnect(){
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
    if (! gattCharacteristic) {
        console.log("GATT Characteristic not found.");
        return;
    }
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
}

function str2ab(str){
    var buf = new ArrayBuffer(str.length);
    var bufView = new Uint8Array(buf);
    for (var i = 0, l = str.length; i < l; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

let buttons = document.querySelectorAll('.btn-primary-test');
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
    isFirstSoilMoistureRead = true;
    isFirstBMERead = true;
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

function clearTextArea() {
    let textAreas = [
        'TextAreaHC_SR501', 'TextAreaOLED', 'TextAreaSoilMoisture', 'TextAreaBME280', 'TextAreaESP', 
        'TextAreaMAX30102', 'TextAreaBME_Tem', 'TextAreaBME_Hum', 'TextAreaBME_Pres', 'TextAreaRelAlt', 
        'TextAreaSoilMin', 'TextAreaSoilMax', 'TextAreaSoilRange', 'TextAreaBeat', 
        'TextAreaPasswordfromWeb', 'TextAreaSSIDfromWeb', 'TextAreaUTC_Time', 
        'TextAreaBrowser_Time', 'TextAreaLocal_Time'
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
    let data = event.target.value;
    let dataArray = new Uint8Array(data.buffer);
    let textDecoder = new TextDecoder('utf-8');
    let valueString = textDecoder.decode(dataArray);

    string += valueString;
    if ( ! valueString.endsWith( '\n' )) return;
   
    console.log("Nano > " + string);
    string.split(/[\r\n]+/).forEach(line => {
        handleSerialLine(line);       // Handle each line individually
    });
    string = "";
}

function handleSerialLine(line) {
    if (! line) return;
    console.log("line: " + line);

    checkCodefromLeanbot(line);

    let arrString = line.split(/[ \t]+/);
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

let msgFromLeanbot = "Test IoT Modules";
let checkmess = false;
let timeoutCheckMessage;

function checkCodefromLeanbot(line){ {
    if (line !== msgFromLeanbot || checkmess) return;
    clearTimeout(timeoutCheckMessage);
    checkmess = true;
    console.log("Correct message.");
} } 

//********HC-SR501********//
let TextAreaHC_SR501 = document.getElementById("HC-SR501");
let square = document.getElementById('squareHCSR501');

function HCSR501_handle(arrString) {
    TextAreaHC_SR501.value = arrString[1];
    if (arrString[1] === '1') square.style.backgroundColor = "red";
    else square.style.backgroundColor = "white";
}

function HCSR501_button(){
    send("HC-SR501 Test");
}

//********OLED********//
let TextAreaOLED = document.getElementById("OLED");

function OLED_handle(arrString) {
    if (arrString[2] === 'Error') TextAreaOLED.value = "OLED not detected";
    else TextAreaOLED.value = arrString[1] + " " + arrString[2];
}

function OLED_button(){
    send("OLED Test");
    TextAreaOLED.value = "Observe the OLED screen";
}

//********SoilMoisture********//
let TextAreaSoilMoisture = document.getElementById("SoilMoisture");
let TextAreaSoilMin = document.getElementById("SoilMin");
let TextAreaSoilMax = document.getElementById("SoilMax");
let TextAreaSoilRange = document.getElementById("SoilRange");
let isFirstSoilMoistureRead = true;
let MinSoilMoisture;
let MaxSoilMoisture;

function SoilMoisture_handle(arrString) {
    let moistureValue = parseInt(arrString[1]);

    if (moistureValue === 1024) {
        let msg = isFirstSoilMoistureRead ? "Soil Moisture not detected" : "Soil Moisture Sensor not plugged in";
        TextAreaSoilMoisture.value = msg;
        TextAreaSoilMin.value = "";
        TextAreaSoilMax.value = "";
        TextAreaSoilRange.value = "";
        isFirstSoilMoistureRead = false;
    } else {
        if (isFirstSoilMoistureRead) {
            TextAreaSoilMoisture.value = "Init Ok";
            MinSoilMoisture = moistureValue;
            MaxSoilMoisture = moistureValue;
            isFirstSoilMoistureRead = false;
        } else {
            TextAreaSoilMoisture.value = moistureValue;
            document.getElementById('progressSoil').value = moistureValue;
            MinSoilMoisture = Math.min(MinSoilMoisture, moistureValue);
            MaxSoilMoisture = Math.max(MaxSoilMoisture, moistureValue);
            TextAreaSoilMin.value = MinSoilMoisture;
            TextAreaSoilMax.value = MaxSoilMoisture;
            TextAreaSoilRange.value = MaxSoilMoisture - MinSoilMoisture;
        }
    }
}

function SoilMoisture_button() {
    send("SoilMoisture Test");
    isFirstSoilMoistureRead = true;
}

//********BME280********//
let TextAreaBME280 = document.getElementById("BME280");
let TextAreaBME_Tem = document.getElementById("BME_Tem");
let TextAreaBME_Hum = document.getElementById("BME_Hum");
let TextAreaBME_Pres = document.getElementById("BME_Pres");
let TextAreaRelAlt = document.getElementById("BME_RelAlt");
let isFirstBMERead = true;
let RelAltRef ;
let countBMEValue;
let sumAlt = 0;

function BME280_handle(arrString) {
    if(arrString[2] === 'Error'){
        const buttonBME = document.getElementById('BME280-button');
        buttonBME.disabled = true;
        TextAreaBME280.value = "BME280 not detected";    
    }
    else TextAreaBME280.value = arrString.slice(1, 9).join(' ');
    if(arrString[1] !== 'Tem') return;
    TextAreaBME_Tem.value = parseFloat(arrString[2]).toFixed(1).toString() + " °C";
    TextAreaBME_Hum.value = parseFloat(arrString[4]).toFixed(1).toString() + " %";
    TextAreaBME_Pres.value = arrString[6].toString()                       + " hPa";
    let ALtRawFloat = parseFloat(arrString[8]);
    if(isFirstBMERead){
        countBMEValue++;
        sumAlt += ALtRawFloat;
        if(countBMEValue === 10){
            RelAltRef = sumAlt/10;
            isFirstBMERead = false;
        }
    }
    if(!isFirstBMERead) TextAreaRelAlt.value = (ALtRawFloat - RelAltRef).toFixed(2).toString() + " m";
}

function BME280_button(){
    send("BME280 Test");
    isFirstBMERead = true;
    countBMEValue = 0;
    sumAlt = 0;
}

//********WiFi********//
let TextAreaESP = document.getElementById("ESP");
let TextAreaSSIDfromWeb = document.getElementById('ssid');
let TextAreaPasswordfromWeb = document.getElementById('password');
let TextAreaUTC_Time = document.getElementById("UTC_Time");
let TextAreaBrowser_Time = document.getElementById("Browser_Timezone");
let TextAreaLocal_Time = document.getElementById("Local_Time");

function WiFi_handle(arrString) {
    if(arrString[1] === 'UTC'){
        TextAreaUTC_Time.value = arrString[3].replace('T', ' ').replace('Z', '');
        const utcDate = new Date(arrString[3]);  
        const parts = utcDate.toString().split(' ');  
        if (parts[5]) {
            const timeZone = parts[5].substring(3, 8);
            TextAreaBrowser_Time.value = timeZone;
        }
        const localTime = utcDate.toLocaleString('en-GB', { hour12: false });  
        let [datePart, timePart] = localTime.split(', ');
        datePart = datePart.replace(/\//g, '-');
        const [day, month, year] = datePart.split('-');
        const formattedDate = `${year}-${month}-${day}`;
        const formattedLocalTime = `${formattedDate} ${timePart}`;
        TextAreaLocal_Time.value = formattedLocalTime;
    }
    else{
        const msgWiFi = string.split(/[\r\n]+/);
        TextAreaESP.value = msgWiFi[0] + "\n" + msgWiFi[1] + "\n" + msgWiFi[2];
    }
}

async function WiFi_button(){
    if(TextAreaSSIDfromWeb.value === "" || TextAreaPasswordfromWeb.value === ""){
        TextAreaESP.value = "Input WiFi SSID and Password to Test WiFi";
    }
    else{
        TextAreaESP.value = "";
        TextAreaUTC_Time.value = "";
        TextAreaBrowser_Time.value = "";
        TextAreaLocal_Time.value = "";
        await send("WiFi SSID " + TextAreaSSIDfromWeb.value);
        await send("WiFi Password " + TextAreaPasswordfromWeb.value);
        await send("WiFi Connect");
        TextAreaESP.value = "Connecting ...";
    }
}

//********MAX30102********//
let TextAreaMAX30102 = document.getElementById("MAX30102");
let TextAreaBeat = document.getElementById("beat");
let squareFinger = document.getElementById('squareFinger');

function MAX30102_handle(arrString) {
    if(arrString[2] === 'Error'){
        const buttonMAX30102 = document.getElementById('MAX30102-button');
        buttonMAX30102.disabled = true;
        TextAreaMAX30102.value = "MAX30102 not detected";
    }
    else if(arrString[2] === 'Ok'){
        TextAreaMAX30102.value = arrString[1] + " " + arrString[2];
    }
    else{
        if(arrString[1] === 'No') squareFinger.style.backgroundColor = "white";
        else {
            squareFinger.style.backgroundColor = "red";
            TextAreaBeat.value = arrString[2];
        }
        TextAreaMAX30102.value = arrString[1] + " " + arrString[2];
    }
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