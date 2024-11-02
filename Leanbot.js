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

function UI(elmentID) {
    return document.getElementById(elmentID);
}