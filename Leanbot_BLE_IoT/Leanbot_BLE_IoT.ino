#include "LeanbotIoT.h"       // Leanbot IoT Library
#include <U8g2lib.h>          // U8g2 Library Reference: https://github.com/olikraus/u8g2/wiki
#include <Wire.h>             // Wire Library Reference: https://www.arduino.cc/en/Reference/Wire
#include <ErriezBMX280.h>     // https://github.com/Erriez/ErriezBMX280
#include "MAX30105.h"         // https://github.com/sparkfun/SparkFun_MAX3010x_Sensor_Library
#include "heartRate.h"

#define COMMAND_MAX_LENGTH 30

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
  Serial.println(F("Test IoT Modules"));
  delay(100);
  serial_checkCommand();
}

void serial_checkCommand() {
  if (Serial.available() <= 0) return;

  const char* command = Serial.readStringUntil('\n').c_str();
  Serial.print(F("Command: "));
  Serial.println(command);

  if (WiFi_checkCommand(command)) return;
  if (HC_SR501_checkCommand(command)) return;
  if (OLED_checkCommand(command)) return;
  if (SoilMoisture_checkCommand(command)) return;
  if (BME280_checkCommand(command)) return;
  if (MAX30102_checkCommand(command)) return;

  Serial.print(F("Unknown command: "));
  Serial.println(command);
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
    Serial.print(F("HC-SR501 "));
    Serial.println(pirValue);
    delay(100);
  }
}

boolean HC_SR501_checkCommand(const char* command) {
  if (strcmp(command, "HC-SR501 Test") == 0) {
    HC_SR501_test();
    return true;
  }
  return false;
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
  Serial.println(F("OLED Circle"));
  delay(100);
}

void OLED_drawFrame() {
  oled.firstPage();
  do {
    oled.drawFrame(40, 5, 50, 50);
  } while (oled.nextPage());
  Serial.println(F("OLED Frame"));
  delay(100);
}

boolean OLED_checkCommand(const char* command) {
  if (strcmp(command, "OLED Test1") == 0) {
    OLED_drawCircle();
    return true;
  } else if (strcmp(command, "OLED Test2") == 0) {
    OLED_drawFrame();
    return true;
  }
  return false;
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
    Serial.print(F("SoilMoisture "));
    Serial.println(soilValue);
    delay(100);
  }
}

boolean SoilMoisture_checkCommand(const char* command) {
  if (strcmp(command, "SoilMoisture Test") == 0) {
    SoilMoisture_test();
    return true;
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

void BME280_test() {
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
}

boolean BME280_checkCommand(const char* command) {
  if (strcmp(command, "BME280 Test") == 0) {
    BME280_test();
    return true;
  }
  return false;
}

/////////////////////////////////////////////
// WiFi Module
/////////////////////////////////////////////
char ssid[50] = "";
char password[50] = "";

void WiFi_setSSID(const char* newSSID) {
  strncpy(ssid, newSSID, sizeof(ssid) - 1);
  ssid[sizeof(ssid) - 1] = '\0';
}

void WiFi_setPassword(const char* newPassword) {
  strncpy(password, newPassword, sizeof(password) - 1);
  password[sizeof(password) - 1] = '\0';
}

boolean WiFi_connect() {
  Serial.print(F("SSID "));
  Serial.println(ssid);
  delay(100);
  Serial.print(F("Password "));
  Serial.println(password);
  delay(100);

  if (LbIoT.Wifi.status() != WL_CONNECTED) {
    if (LbIoT.Wifi.begin(ssid, password) < 0) {
      Serial.println(F("WiFi Connection Error"));
      return false; 
    } else {
      Serial.println(F("WiFi Connected"));
      delay(100);
    }
  }
  return true;
}

boolean WiFi_checkCommand(const char* command) {
  if (strncmp(command, "WiFi SSID", 10) == 0) {
    WiFi_setSSID(command + 10);
    Serial.print(F("WiFi SSID Set to: "));
    Serial.println(ssid);
    return true;
  } else if (strncmp(command, "WiFi Password", 14) == 0) {
    WiFi_setPassword(command + 14);
    Serial.print(F("WiFi Password Set to: "));
    Serial.println(password);
    return true;
  } else if (strcmp(command, "WiFi Connect") == 0) {
    return WiFi_connect();
  }
  Serial.println(F("WiFi command not recognized."));
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

void MAX30102_test() {
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

boolean MAX30102_checkCommand(const char* command) {
  if (strcmp(command, "MAX30102 Test") == 0) {
    MAX30102_test();
    return true;
  }
  return false;
}
