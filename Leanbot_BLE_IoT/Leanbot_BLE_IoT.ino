#include "LeanbotIoT.h"       // Leanbot IoT Library
#include <U8g2lib.h>          // U8g2 Library Reference: https://github.com/olikraus/u8g2/wiki
#include <Wire.h>             // Wire Library Reference: https://www.arduino.cc/en/Reference/Wire
#include <ErriezBMX280.h>     // https://github.com/Erriez/ErriezBMX280
#include "MAX30105.h"         // https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library
#include "heartRate.h"

/////////////////////////////////////////////
// Main Setup and Loop
/////////////////////////////////////////////
void setup() {
  Serial.begin(115200);
  Wire.begin();
  Wire.setClock(400000);

  // Initialize modules
  HC_SR501_begin();
  OLED_begin();
  SoilMoisture_begin();
  BME280_begin();
  MAX30102_begin();
}

void loop() {
  Serial.println("Test IoT Modules");
  serial_checkCommand();
  delay(100);
}

void serial_checkCommand() {
  if (Serial.available() <= 0) return;
  String command = Serial.readStringUntil('\n');

  if (HC_SR501_checkCommand(command)) return;
  if (OLED_checkCommand(command)) return;
  if (SoilMoisture_checkCommand(command)) return;
  if (BME280_checkCommand(command)) return;
  if (WiFi_checkCommand(command)) return;
  if (MAX30102_checkCommand(command)) return;

  Serial.println("Unknown command");
}

/////////////////////////////////////////////
// HC-SR501 Sensor
/////////////////////////////////////////////
#define HC_SR501_Pin A1

void HC_SR501_begin() {
  pinMode(HC_SR501_Pin, INPUT);
}

void HC_SR501_test() {
  while (Serial.available() <= 0) {
    int pirValue = digitalRead(HC_SR501_Pin);
    Serial.print("HC-SR501 ");
    Serial.println(pirValue);
    delay(100);
  }
}

boolean HC_SR501_checkCommand(String command) {
  if (command == "HC-SR501 Test") {
    HC_SR501_test();
  } else {
    return false;
  }
  return true;
}

/////////////////////////////////////////////
// OLED Module
/////////////////////////////////////////////
U8G2_SH1106_128X64_NONAME_1_HW_I2C oled(U8G2_R0);   // SH1106 for 1.3" OLED module

void OLED_begin() {
  oled.begin();
}

void OLED_drawCircle() {
  oled.firstPage();
  do {
    oled.drawCircle(60, 30, 25, U8G2_DRAW_ALL);
  } while (oled.nextPage());
  Serial.println("OLED Circle");
}

void OLED_drawFrame() {
  oled.firstPage();
  do {
    oled.drawFrame(40, 5, 50, 50);
  } while (oled.nextPage());
  Serial.println("OLED Frame");
}

boolean OLED_checkCommand(String command) {
  if (command == "OLED Test1") {
    OLED_drawCircle();
  } else if (command == "OLED Test2") {
    OLED_drawFrame();
  } else {
    return false;
  }
  return true;
}

/////////////////////////////////////////////
// Capacitive Soil Moisture Sensor
/////////////////////////////////////////////
#define SoilMoisture_Pin A0

void SoilMoisture_begin() {
  pinMode(SoilMoisture_Pin, INPUT);
}

void SoilMoisture_test() {
  while (Serial.available() <= 0) {
    int soilValue = 1024 - analogRead(SoilMoisture_Pin);
    Serial.print("SoilMoisture ");
    Serial.println(soilValue);
    delay(100);
  }
}

boolean SoilMoisture_checkCommand(String command) {
  if (command == "SoilMoisture Test") {
    SoilMoisture_test();
  } else {
    return false;
  }
  return true;
}

/////////////////////////////////////////////
// BME280 Sensor
/////////////////////////////////////////////
ErriezBMX280 bmx280 = ErriezBMX280(0x76);
#define SEA_LEVEL_PRESSURE_HPA 1026.25

void BME280_begin() {
  if (bmx280.begin()) {
    Serial.println("BME280 Init Ok");
    delay(100);
  } else {
    Serial.println("BME280 Init Error");
    delay(100);
  }
}

void BME280_test() {
  while (Serial.available() <= 0) {
    float temperature = bmx280.readTemperature();
    float humidity = bmx280.readHumidity();
    float pressure = bmx280.readPressure() / 100.0;
    float altitude = bmx280.readAltitude(SEA_LEVEL_PRESSURE_HPA);
    Serial.print("BME280 ");
    Serial.print("Tem "); Serial.print(temperature); Serial.print(" ");
    Serial.print("Hum "); Serial.print(humidity); Serial.print(" ");
    Serial.print("Pres "); Serial.print(pressure); Serial.print(" ");
    Serial.print("Alt "); Serial.println(altitude);
    delay(100);
  }
}

boolean BME280_checkCommand(String command) {
  if (command == "BME280 Test") {
    BME280_test();
  } else {
    return false;
  }
  return true;
}

/////////////////////////////////////////////
// WiFi Module
/////////////////////////////////////////////
String ssid = "", password = "";

void WiFi_setSSID(String newSSID) {
  ssid = newSSID;
}

void WiFi_setPassword(String newPassword) {
  password = newPassword;
}

void WiFi_connect() {
  Serial.print("SSID ");
  Serial.println(ssid);
  delay(100);
  Serial.print("Password ");
  Serial.println(password);
  delay(100);
}

boolean WiFi_checkCommand(String command) {
  if (command.startsWith("WiFi SSID")) {
    WiFi_setSSID(command.substring(10));
  } else if (command.startsWith("WiFi Password")) {
    WiFi_setPassword(command.substring(14));
  } else if (command == "WiFi Connect") {
    WiFi_connect();
  } else {
    return false;
  }
  return true;
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
    Serial.println("MAX30102 Init Ok");
    delay(100);
  } else {
    Serial.println("MAX30102 Init Error");
    delay(100);
  }
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeGreen(0x00);
}

void MAX30102_test() {
  while (Serial.available() <= 0) {
    long irValue = particleSensor.getIR();

    if (checkForBeat(irValue) && (irValue >= FINGER_THRESHOLD)) {
      tone(11, 440, 50);
      beatCnt++;
      Serial.print("MAX30102 Beat ");
      Serial.println(beatCnt);
    } else if (irValue < FINGER_THRESHOLD) {
      Serial.println("MAX30102 No Finger");
      sensorProcessIdle();
    }
  }
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

boolean MAX30102_checkCommand(String command) {
  if (command == "MAX30102 Test") {
    MAX30102_test();
  } else {
    return false;
  }
  return true;
}
