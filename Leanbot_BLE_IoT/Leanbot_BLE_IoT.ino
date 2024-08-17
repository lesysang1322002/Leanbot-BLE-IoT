#include "LeanbotIoT.h"       // Leanbot IoT Library
#include <U8g2lib.h>          // U8g2 Library Reference: https://github.com/olikraus/u8g2/wiki
#include <Wire.h>             // Wire Library Reference: https://www.arduino.cc/en/Reference/Wire
#include <ErriezBMX280.h>     // https://github.com/Erriez/ErriezBMX280
#include "MAX30105.h"         // https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library
#include "heartRate.h"
 
/////////////////////////////////////////////
// Main Setup and Loop
/////////////////////////////////////////////
 
String command; 
 
void setup() {
  Serial.begin(115200);
  Wire.begin();
 
  // Initialize modules
  HC_SR501_begin();
  OLED_begin();
  SoilMoisture_begin();
  BME280_begin();
  MAX30102_begin();
  Wire.setClock(100000);
}
 
void loop() {
  Serial.println(F("Test IoT Modules"));
  delay(100);
  serial_checkCommand();
}
 
void serial_checkCommand() {
  if (Serial.available() <= 0) return;
  command = Serial.readStringUntil('\n');
 
  if (HC_SR501_checkCommand()) return;
  if (OLED_checkCommand()) return;
  if (SoilMoisture_checkCommand()) return;
  if (BME280_checkCommand()) return;
  if (WiFi_checkCommand()) return;
  if (MAX30102_checkCommand()) return;
 
  Serial.println(F("Unknown command"));
}
 
/////////////////////////////////////////////
// HC-SR501 Sensor
/////////////////////////////////////////////
#define HC_SR501_Pin A1
 
void HC_SR501_begin() {
  pinMode(HC_SR501_Pin, INPUT);
}
 
boolean HC_SR501_test() {
  while (Serial.available() <= 0) {
    int pirValue = digitalRead(HC_SR501_Pin);
    Serial.print(F("HC-SR501 "));
    Serial.println(pirValue);
    delay(100);
  }
  return true;
}
 
boolean HC_SR501_checkCommand() {
  if (command == F("HC-SR501 Test")) return HC_SR501_test();
  return false;
}
 
/////////////////////////////////////////////
// OLED Module
/////////////////////////////////////////////
U8G2_SH1106_128X64_NONAME_1_HW_I2C oled(U8G2_R0);   // SH1106 for 1.3" OLED module
 
void OLED_begin() {
  oled.begin();
}
 
boolean OLED_test() {
  byte x = 63;  
  byte y = 31;  
  const byte radius = 15;  
  byte xDirection = 1;  
  byte yDirection = 1;  

  while (Serial.available() <= 0) {
    Serial.print("Circle at (");
    Serial.print(x);
    Serial.print(", ");
    Serial.print(y);
    Serial.println(")");

    oled.firstPage(); 
    Serial.println("First page initialized");

    do {
      // Serial.println("Before drawCircle");
      oled.drawCircle(x, y, radius, U8G2_DRAW_ALL);
      // Serial.println("After drawCircle");
    } while (oled.nextPage());
    // Serial.println("Finished drawing");

    x += xDirection;
    y += yDirection;

    Serial.print("Updated x: ");
    Serial.print(x);
    Serial.print(", Updated y: ");
    Serial.println(y);

    if ((x <= 0 + radius) || (x >= 127 - radius)) {
      xDirection = -xDirection;
      Serial.println("Reversing x direction");
    }
    if ((y <= 0 + radius) || (y >= 63 - radius)) {
      yDirection = -yDirection;
      Serial.println("Reversing y direction");
    }

    delay(50); 
  }
  
  Serial.println(F("OLED Test Done"));
  delay(50);
  return true;
}
 
boolean OLED_checkCommand() {
  if (command == F("OLED Test")) return OLED_test();
  return false;
}
 
/////////////////////////////////////////////
// Capacitive Soil Moisture Sensor
/////////////////////////////////////////////
#define SoilMoisture_Pin A0
 
void SoilMoisture_begin() {
  pinMode(SoilMoisture_Pin, INPUT);
  if(analogRead(SoilMoisture_Pin)){
    Serial.println(F("SoilMoisture Init Ok"));
    delay(100);
  } else {
    Serial.println(F("SoilMoisture Init Error"));
    delay(100);
  }
}
 
boolean SoilMoisture_test() {
  while (Serial.available() <= 0) {
    int soilValue = 1024 - analogRead(SoilMoisture_Pin);
    Serial.print(F("SoilMoisture "));
    Serial.println(soilValue);
    delay(100);
  }
  return true;
}
 
boolean SoilMoisture_checkCommand() {
  if (command == F("SoilMoisture Test")) {
    return SoilMoisture_test();
  }
  return false;
}
 
/////////////////////////////////////////////
// BME280 Sensor
/////////////////////////////////////////////
ErriezBMX280 bmx280 = ErriezBMX280(0x76);
#define SEA_LEVEL_PRESSURE_HPA 1026.25
 
void BME280_begin() {
  if (bmx280.begin()) {
    Serial.println(F("BME280 Init Ok"));
    delay(100);
  } else {
    Serial.println(F("BME280 Init Error"));
    delay(100);
  }
}
 
boolean BME280_test() {
  while (Serial.available() <= 0) {
    float temperature = bmx280.readTemperature();
    float humidity = bmx280.readHumidity();
    float pressure = bmx280.readPressure() / 100.0;
    float altitude = bmx280.readAltitude(SEA_LEVEL_PRESSURE_HPA);
    Serial.print(F("BME280 "));
    Serial.print(F("Tem ")); Serial.print(temperature); Serial.print(F(" "));
    Serial.print(F("Hum ")); Serial.print(humidity); Serial.print(F(" "));
    Serial.print(F("Pres ")); Serial.print(pressure); Serial.print(F(" "));
    Serial.print(F("Alt ")); Serial.println(altitude);
    delay(100);
  }
  return true;
}
 
boolean BME280_checkCommand() {
  if (command == F("BME280 Test")) return BME280_test();
  return false;
}
 
/////////////////////////////////////////////
// WiFi Module
/////////////////////////////////////////////
String ssid = "", password = "";
 
boolean WiFi_setSSID(String newSSID) {
  ssid = newSSID;
  return true;
}
 
boolean WiFi_setPassword(String newPassword) {
  password = newPassword;
  return true;
}
 
boolean WiFi_connect() {
  if (LbIoT.Wifi.status() != WL_CONNECTED) {
    if (LbIoT.Wifi.begin(ssid.c_str(), password.c_str()) < 0) {
      delay(100);
      Serial.println(F("WiFi Connection Error"));
      delay(100);
    } else {
      delay(100);
      Serial.println(F("WiFi Connected"));
      delay(100);
    }
  }
  return true;
}
 
boolean WiFi_checkCommand() {
  if (command.startsWith(F("WiFi SSID"))) return WiFi_setSSID(command.substring(10));
  if (command.startsWith(F("WiFi Password"))) return WiFi_setPassword(command.substring(14));
  if (command == F("WiFi Connect")) return WiFi_connect();
  return false;
}
 
/////////////////////////////////////////////
// MAX30102 Sensor
/////////////////////////////////////////////
MAX30105 particleSensor;
#define FINGER_THRESHOLD 50000
#define MAX30102_LED_OFF (0x00)
#define MAX30102_LED_ON (0x1F)
 
byte beatCnt = 0;
 
void MAX30102_begin() {
  if (particleSensor.begin(Wire, 400000)) {
    Serial.println(F("MAX30102 Init Ok"));
    delay(100);
  } else {
    Serial.println(F("MAX30102 Init Error"));
    delay(100);
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0x00);
}
 
boolean MAX30102_test() {
  while (Serial.available() <= 0) {
    long irValue = particleSensor.getIR();
 
    if (checkForBeat(irValue) && (irValue >= FINGER_THRESHOLD)) {
      tone(11, 440, 50);
      beatCnt++;
      Serial.print(F("MAX30102 Beat "));
      Serial.println(beatCnt);
    } else if (irValue < FINGER_THRESHOLD) {
      Serial.println(F("MAX30102 No Finger"));
      sensorProcessIdle();
    }
  }
  return true;
}
 
void sensorProcessIdle() {
  static uint8_t powerLevel = MAX30102_LED_OFF;
  static uint32_t prevMs = 0;
  uint32_t nowMs = millis();
 
  if ((nowMs - prevMs) > 500) {
    prevMs = nowMs;
    powerLevel = (powerLevel == MAX30102_LED_OFF) ? (MAX30102_LED_ON) : (MAX30102_LED_OFF);
    particleSensor.setPulseAmplitudeIR(powerLevel);
    particleSensor.clearFIFO();
    beatCnt = 0;
  }
}
 
boolean MAX30102_checkCommand() {
  if (command == F("MAX30102 Test")) return MAX30102_test();
  return false;
}