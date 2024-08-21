#include <Leanbot.h>

const int ThresholdLine = 60;
const int V_MIN = 350;
const int V_MEAN = 1000;
const int V_MAX = 2000;

bool checkDemofromWeb = false;
 
void setup() {
  Leanbot.begin();
  LbIRLine.setThreshold(ThresholdLine, ThresholdLine, ThresholdLine, ThresholdLine);
}
 
void loop() {
  printAllSensors();
  if (!checkDemofromWeb) {
    lbTouch_check();
  }
  serial_checkCommand();
  LbDelay(100);
}

void serial_checkCommand(){
  if (Serial.available() <= 0) return;
  char cmd = Serial.read();
  switch (cmd) {
    case 'F':  Leanbot_setSpeed(+4, +4);        break;    // Forward
    case 'B':  Leanbot_setSpeed(-4, -4);        break;    // Backward
    case 'L':  Leanbot_setSpeed(-4, +4);        break;    // Left
    case 'R':  Leanbot_setSpeed(+4, -4);        break;    // Right
    case 'G':  Leanbot_setSpeed(+2, +4);        break;    // Forward Left
    case 'I':  Leanbot_setSpeed(+4, +2);        break;    // Forward Right
    case 'H':  Leanbot_setSpeed(-2, -4);        break;    // Back Left
    case 'J':  Leanbot_setSpeed(-4, -2);        break;    // Back Right
    case 'S':  Leanbot_setSpeed( 0,  0);        break;    // Stop 
    case 'q':  Leanbot_SetVelocity(10);         break;
    case '0' ... '9':
               Leanbot_SetVelocity(cmd - '0');  break;
    case 'W':  ledOn();                         break;
    case 'w':  ledOff();                        break;
    case 'U':  ;                                break;    // back light on
    case 'u':  ;                                break;    // back light off
    case 'V':  hornOn();                        break;
    case 'v':  hornOff();                       break;
    case 'X':  LbGripper.close();              break;
    case 'x':  LbGripper.open();                break;
    default:  
      String  command = "";
      command += cmd;
      while (Serial.available() > 0) {
        char c = Serial.read();
        if (c == '\n') {
          handleCommandDemo(command);
          break;
        }
        else command += c;
      }
      break;
  }
}

void printAllSensors() {
  printTouch();
  Serial.print(" - ");
  printIR();
  Serial.print(" - ");
  printPing();
  Serial.print(" - ");
  printGripper();
  Serial.println();
}
 
void printTouch() {
  const int touchPins[] = {TB1A, TB1B, TB2A, TB2B};
  Serial.print("TB ");
  for (int i = 0; i < 4; i++) {
    Serial.print(LbTouch.read(touchPins[i]) == HIGH ? "1" : "0");
  }
}
 
int threshold(int value, int thresholdValue) {
  return (value > thresholdValue) ? 1 : 0;
}
 
void printIR(){
  Serial.print("IR ");                      
  int irValues[] = {
    threshold(LbIRSensor.read(sir6L), ThresholdLine),
    threshold(LbIRSensor.read(sir4L), ThresholdLine),
    threshold(LbIRSensor.read(sir5R), ThresholdLine),
    threshold(LbIRSensor.read(sir7R), ThresholdLine)
  };
  Serial.print(irValues[0]);
  Serial.print(irValues[1]);
  Serial.print(" ");
  LbIRLine.print(LbIRLine.read()); 
  Serial.print(" ");           
  Serial.print(irValues[2]);
  Serial.print(irValues[3]);
}
 
void printPing(){
  int distance = Leanbot.pingCm(); 
  Serial.print(distance);           
  Serial.print(" cm");
}
 
void printGripper(){
  Serial.print("GR ");
  int angleL = LbGripper.readL();
  int angleR = LbGripper.readR();
  Serial.print(angleL);
  Serial.print(" ");
  Serial.print(angleR);
}
 
void handleCommandDemo(String command) {
  if (command == ".Motion") MotionDemo();
  else if (command == ".Gripper") GripperDemo();
  else if (command == ".Buzzer") BuzzerDemo();
  else if (command == ".RGBLeds") RGBLedsDemo();
  else if (command == ".LineFollow") LineFollowDemo();
  else if (command == ".StraightMotion") StraightMotionDemo();
  else if (command == ".Objectfollow") ObjectfollowDemo();
  else if (command == ".IRLine") IRLineManualCalibration();
  else if (command == ".RemoteControl") checkDemofromWeb = true;
}

void StraightMotionDemo(){
  LbMotion.runLR( +2000, +2000 );    
  LbMotion.waitDistanceMm( 1000 );      
  LbDelay(100);
  LbMotion.runLR( -2000, -2000 );       
  LbMotion.waitDistanceMm( -980 );      
  LbMotion.runLR(0, 0);
  Serial.println("StraightMotion");
  LbDelay(100);
}
 
void LineFollowDemo(){
  int lineState;
  do {
    lineState = LbIRLine.read();
    printAllSensors();
    LbDelay(50);
    runFollowLine();
  } while ( LbIRLine.isBlackDetected() && lineState != 0b1111 );
  LbMotion.runLR(0, 0);
  LbDelay(100);
  Serial.println("LineFollow");
  LbDelay(100);
}
 
void ObjectfollowDemo(){
  int d = Leanbot.pingCm();
  int limit  = 15;
  int offset = 1;
  while( (d != 0) && (d < 100) ){
    d = Leanbot.pingCm();
    if (d > (limit + offset)) {
      LbMotion.runLR(V_MAX, V_MAX);
    } else if (d < (limit - offset)) {
      LbMotion.runLR(-V_MAX, -V_MAX);
    }
    printAllSensors();
    LbDelay(50);
  }
  LbMotion.runLR(0, 0);
  Serial.println("Objectfollow");
  LbDelay(100);
}
 
void MotionDemo(){
  LbMotion.runLRrpm(30, 30);
  LbMotion.waitDistanceMm(100);
  LbMotion.runLRrpm(-30, -30);
  LbMotion.waitDistanceMm(100);
  LbMotion.runLRrpm(30, -30);
  LbMotion.waitRotationDeg(90);
  LbMotion.runLRrpm(-30, 30);
  LbMotion.waitRotationDeg(90);
  LbMotion.stopAndWait();
  Serial.println("Motion");
  LbDelay(100);
}
 
void GripperDemo(){
  printAllSensors();
  LbGripper.close();
  printAllSensors();
  LbDelay(1000);
  LbGripper.open();
  printAllSensors();
  LbDelay(50);
  Serial.println("Gripper");
  LbDelay(100);
}

const int LedShape[] = {0x555555, 0xFF0000, 0xFFFF00, 0x00FF00, 0x00FFFF, 0x0000FF,0xFF00FF };
const int timeDisplay = 1000;

void RGBLedsDemo(){
  for (int i = 0; i < 7; i++) {
    LbRGB.fillColor(LedShape[i], CRGB(random8(), random8(), random8()));
    LbRGB.show();
    LbDelay(timeDisplay);
  }
  Serial.println("RGBLeds");
  LbDelay(100);
}

void BuzzerDemo(){
  const int notes[] = {261, 293, 329, 349, 392, 440, 493, 523};
  for (int i = 0; i < 8; i++) {
    Leanbot.tone(notes[i], 100);
    LbDelay(100);
  }
  Serial.println("Buzzer");
  LbDelay(100);
}
 
void IRLineManualCalibration(){
  LbIRLine.doManualCalibration(TB1A);
}
 
void runFollowLine() {
  for (int i = 0; i < 30; i++) {
    int lineValue = LbIRLine.read();
    LbIRLine.displayOnRGB(CRGB::DarkCyan);
 
    switch (lineValue) {
      case 0b0100:
      case 0b1110:
        LbMotion.runLR(0, +V_MEAN);
        break;
      case 0b1100:
      case 0b1000:
        LbMotion.runLR(-V_MEAN, +V_MEAN);
        break;
      case 0b0010:
      case 0b0111:
        LbMotion.runLR(+V_MEAN, 0);
        break;
      case 0b0011:
      case 0b0001:
        LbMotion.runLR(+V_MEAN, -V_MEAN);
        break;
      default:
        LbMotion.runLR(+V_MEAN, +V_MEAN);
    }
 
    if (LbIRLine.isBlackDetected())
      break;
 
    LbMotion.waitDistanceMm(1);
  }
}

void lbTouch_check() {
  if (LbTouch.onPress(TB1A)) {
    if (LbMotion.isMoving())      Leanbot_setSpeed(0, 0);
    else {
      delay(100);
      if (LbTouch.onPress(TB1B))  Leanbot_setSpeed(+2, +2);
      else                        Leanbot_setSpeed(+0, +2);
    }
    beepSingle();
    delay(50);
    return;
  }
 
  if (LbTouch.onPress(TB1B)) {
    if (LbMotion.isMoving())      Leanbot_setSpeed(0, 0);
    else {
      delay(100);
      if (LbTouch.onPress(TB1A))  Leanbot_setSpeed(+2, +2);
      else                        Leanbot_setSpeed(+2, +0);
    }
    beepSingle();
    delay(50);
    return;
  }
 
  if (LbTouch.read(TB2A) && LbTouch.read(TB2B)) {
    beepSingle();
    LbGripper_Toggle();
  }
}
 
/*******************************************************************************
Leanbot_Beep
*******************************************************************************/
 
#define BEEP_FREQ   1500
 
void hornOn() {
  Leanbot.tone(BEEP_FREQ, 5000);      // play sound at 1500Hz for 5000ms
}
 
void hornOff() {
  Leanbot.noTone();
}
 
void beepSingle() {
  Leanbot.tone(BEEP_FREQ, 50);        // play sound at 1500Hz for 50ms
}
 
/*******************************************************************************
Leanbot_RGB
*******************************************************************************/
 
void ledOn() {
  LbRGB.fillColor(CRGB::White);       // white setting for all lights
  LbRGB.show();                       // light status update
}
 
void ledOff() {
  LbRGB.fillColor(CRGB::Black);       // black setting for all lights
  LbRGB.show();                       // light status update
}
 
/*******************************************************************************
Leanbot_Motion
*******************************************************************************/
 
int velocity  = V_MAX / 1;
int motorLDir = 0;
int motorRDir = 0;
 
void Leanbot_run() {
  LbMotion.runLR(velocity * motorLDir / 4, velocity * motorRDir / 4);
}
 
void Leanbot_setSpeed(int speedL, int speedR) {
  motorLDir = speedL;
  motorRDir = speedR;
  Leanbot_run();
}
 
void Leanbot_SetVelocity(int speed) {
  velocity = map(speed, 0, 10, V_MIN, V_MAX);
  Leanbot_run();
}
 
/*******************************************************************************
Leanbot_Gripper
*******************************************************************************/
 
void LbGripper_Toggle() {
  static bool GripperIsClose = false;
 
  if (GripperIsClose) {
    LbGripper.open();
    GripperIsClose = false;
  } else {
    LbGripper.close();
    GripperIsClose = true;
  }
}