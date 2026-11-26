/*
 * ============================================================================
 * CropGuard AI - ESP32 Hardware-in-the-Loop (HIL) Rover Firmware
 * Precision Rose Farming · Edge Triggered AI Vision & Kinematic Spraying
 * ============================================================================
 * 
 * Hardware Peripherals Wired in Wokwi:
 * - ESP32 DevKit V1 (Main Controller)
 * - HC-SR04 Ultrasonic Distance Sensor (Canopy proximity detection)
 *   -> TRIG: GPIO 5 | ECHO: GPIO 18
 * - DHT22 Temperature & Humidity Sensor (Microclimate fungal risk)
 *   -> DATA: GPIO 4
 * - Pushbutton "SCAN LEAF" (Manual demo trigger)
 *   -> PIN: GPIO 19 (INPUT_PULLUP)
 * - Slide Switch "AUTO PATROL" (Autonomous mode switch)
 *   -> PIN: GPIO 23 (INPUT_PULLUP)
 * - Precision Spray Valve Servo Motor
 *   -> PWM: GPIO 13 (0° Closed, 90° Spraying)
 * - Blue Indicator LED (Spray Nozzle Actuated)
 *   -> PIN: GPIO 2
 * - Red Alert LED (Disease Pathogen Detected)
 *   -> PIN: GPIO 15
 * - I2C LCD 1602 Display (Live diagnosis & spray telemetry)
 *   -> SDA: GPIO 21 | SCL: GPIO 22 (Address: 0x27)
 * ============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

// ── Pin Configuration ────────────────────────────────────────────────────────
#define PIN_TRIG        5
#define PIN_ECHO        18
#define PIN_DHT         4
#define PIN_BTN_SCAN    19
#define PIN_SW_AUTO     23
#define PIN_SERVO       13
#define PIN_LED_SPRAY   2
#define PIN_LED_ALERT   15

#define DHT_TYPE        DHT22

// ── Network Configuration ───────────────────────────────────────────────────
// Wokwi simulation uses standard virtual WiFi access point
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// Backend API endpoint on host computer
// In Wokwi web & VS Code extension, 'host.wokwi.internal' points to host localhost:8000
const char* API_ENDPOINT  = "http://host.wokwi.internal:8000/api/wokwi/predict";

// ── Hardware Instances ──────────────────────────────────────────────────────
DHT dht(PIN_DHT, DHT_TYPE);
Servo sprayServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

// ── State Variables ─────────────────────────────────────────────────────────
bool lastBtnState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long lastAutoScanTime = 0;
const unsigned long AUTO_SCAN_COOLDOWN_MS = 6000; // 6s between scans in auto mode

int currentPlantRow = 1;
int currentPlantCol = 1;

// ── Ultrasonic Distance Helper ──────────────────────────────────────────────
float readUltrasonicDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000); // 30ms timeout
  if (duration == 0) return 999.0; // No echo detected
  return duration * 0.0343 / 2.0;  // Speed of sound = 343 m/s
}

// ── LCD Display Helpers ─────────────────────────────────────────────────────
void updateLcd(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

// ── AI Prediction & Kinematic Spray Actuation ───────────────────────────────
void triggerAiScanAndSpray(float distanceCm, float tempC, float humidity, const char* triggerType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi not connected! Skipping AI inference.");
    updateLcd("WiFi Offline", "Retrying link...");
    return;
  }

  char plantId[12];
  snprintf(plantId, sizeof(plantId), "R%d-C%d", currentPlantRow, currentPlantCol);

  // Advance plant target for next scan (R1-C1 .. R3-C6)
  currentPlantCol++;
  if (currentPlantCol > 6) {
    currentPlantCol = 1;
    currentPlantRow++;
    if (currentPlantRow > 3) currentPlantRow = 1;
  }

  Serial.println("\n=======================================================");
  Serial.printf("[HIL SCAN TRIGGERED] Target: %s via %s\n", plantId, triggerType);
  Serial.printf("[SENSOR TELEMETRY] Dist: %.1f cm | Temp: %.1f C | Hum: %.1f %%\n", distanceCm, tempC, humidity);

  updateLcd("SCANNING LEAF...", plantId);

  // 1. Construct JSON Telemetry Payload
  StaticJsonDocument<384> docOut;
  docOut["plant_id"]      = plantId;
  docOut["distance_cm"]   = distanceCm;
  docOut["temp_c"]        = tempC;
  docOut["humidity"]      = humidity;
  docOut["crop_type"]     = "rose";
  docOut["scan_trigger"]  = triggerType;
  docOut["rover_speed"]   = 0.5; // m/s
  docOut["nozzle_offset"] = 0.8; // m

  String requestJson;
  serializeJson(docOut, requestJson);

  // 2. Transmit to CropGuard AI Backend
  HTTPClient http;
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  Serial.printf("[HTTP POST] Transmitting telemetry to %s...\n", API_ENDPOINT);
  int httpCode = http.POST(requestJson);

  if (httpCode <= 0) {
    Serial.printf("[HTTP ERROR] Failed to connect! Code: %d (%s)\n", httpCode, http.errorToString(httpCode).c_str());
    updateLcd("AI Link Failed", "Check Backend");
    http.end();
    return;
  }

  String responseJson = http.getString();
  Serial.printf("[HTTP %d] Received AI Response:\n%s\n", httpCode, responseJson.c_str());
  http.end();

  // 3. Parse AI Model Response
  StaticJsonDocument<512> docIn;
  DeserializationError error = deserializeJson(docIn, responseJson);

  if (error) {
    Serial.printf("[JSON ERROR] Parsing failed: %s\n", error.c_str());
    updateLcd("JSON Parse Err", "Invalid Packet");
    return;
  }

  const char* disease   = docIn["disease"] | "Unknown";
  float confidence      = docIn["confidence"] | 0.0;
  float severity        = docIn["severity"] | 0.0;
  bool sprayCommand     = docIn["spray_command"] | false;
  int sprayDurationMs   = docIn["spray_duration_ms"] | 1200;
  int deltaTMs          = docIn["delta_t_ms"] | 1600;
  float chemicalSaved   = docIn["chemical_saved_pct"] | 0.0;

  // 4. Actuate Physical Peripherals & HIL Feedback
  if (sprayCommand && strcmp(disease, "Healthy") != 0) {
    // Disease Alert: Turn ON Red LED
    digitalWrite(PIN_LED_ALERT, HIGH);

    char line1[17];
    char line2[17];
    snprintf(line1, sizeof(line1), "%.7s %.0f%%", disease, confidence);
    snprintf(line2, sizeof(line2), "Dt:%dms ALERT", deltaTMs);
    updateLcd(line1, line2);

    Serial.printf("[AI DIAGNOSIS] %s Detected (%.1f%% Conf, %.1f%% Sev)\n", disease, confidence, severity);
    Serial.printf("[KINEMATICS] Delaying %d ms (distance / speed lookahead)...\n", deltaTMs);

    // Wait kinematic delta_t (time for rover to travel from camera to rear spray boom)
    delay(deltaTMs);

    // Actuate Precision Spray Nozzle: Blue LED ON + Servo to 90 degrees
    Serial.printf("[ACTUATOR] Opening Spray Valve Servo (90 deg) for %d ms\n", sprayDurationMs);
    digitalWrite(PIN_LED_SPRAY, HIGH);
    sprayServo.write(90);

    snprintf(line2, sizeof(line2), "SPRAYING %dms", sprayDurationMs);
    updateLcd(line1, line2);

    delay(sprayDurationMs);

    // Close Precision Spray Nozzle: Servo back to 0 degrees + Blue LED OFF
    Serial.println("[ACTUATOR] Closing Spray Valve Servo (0 deg)");
    sprayServo.write(0);
    digitalWrite(PIN_LED_SPRAY, LOW);
    digitalWrite(PIN_LED_ALERT, LOW);

    snprintf(line2, sizeof(line2), "SAVED: %.0f%% CHEM", chemicalSaved);
    updateLcd(line1, line2);
    delay(2000);

  } else {
    // Plant is Healthy: Zero chemical wasted!
    Serial.printf("[AI DIAGNOSIS] Healthy Canopy (%.1f%% Conf). No spray needed.\n", confidence);
    digitalWrite(PIN_LED_ALERT, LOW);
    digitalWrite(PIN_LED_SPRAY, LOW);
    sprayServo.write(0);

    char line1[17];
    char line2[17];
    snprintf(line1, sizeof(line1), "%.6s: HEALTHY", plantId);
    snprintf(line2, sizeof(line2), "%.0f%% - NO SPRAY", confidence);
    updateLcd(line1, line2);
    delay(2500);
  }

  Serial.println("=======================================================\n");
}

// ── Setup ───────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n╔════════════════════════════════════════════════════╗");
  Serial.println("║   CropGuard AI · ESP32 Hardware-in-the-Loop Rover  ║");
  Serial.println("║   Precision Rose Disease Detection & Spraying      ║");
  Serial.println("╚════════════════════════════════════════════════════╝");

  // GPIO Pin Modes
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BTN_SCAN, INPUT_PULLUP);
  pinMode(PIN_SW_AUTO, INPUT_PULLUP);
  pinMode(PIN_LED_SPRAY, OUTPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);

  digitalWrite(PIN_LED_SPRAY, LOW);
  digitalWrite(PIN_LED_ALERT, LOW);

  // Initialize Servo
  sprayServo.attach(PIN_SERVO);
  sprayServo.write(0); // Valve closed at 0°

  // Initialize Sensors
  dht.begin();

  // Initialize I2C LCD Display
  lcd.init();
  lcd.backlight();
  updateLcd("CropGuard AI HIL", "Connecting WiFi.");

  // Connect to Wokwi Simulated Wi-Fi
  Serial.printf("[WIFI] Connecting to SSID: %s...\n", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(400);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected successfully!");
    Serial.printf("[WIFI] IP Address: %s\n", WiFi.localIP().toString().c_str());
    updateLcd("WiFi Connected", "AI HIL Rover Ready");
  } else {
    Serial.println("\n[WIFI] Simulated connection timeout (will retry in loop)");
    updateLcd("WiFi Warning", "Offline Standby");
  }

  delay(1500);
}

// ── Main Loop ───────────────────────────────────────────────────────────────
void loop() {
  // Read Sensors
  float distanceCm = readUltrasonicDistanceCm();
  float tempC      = dht.readTemperature();
  float humidity   = dht.readHumidity();

  // Fallbacks if sensor read fails
  if (isnan(tempC)) tempC = 25.0;
  if (isnan(humidity)) humidity = 75.0;

  bool isAutoMode = (digitalRead(PIN_SW_AUTO) == LOW); // Slide switch ON (connected to GND)
  bool btnReading = digitalRead(PIN_BTN_SCAN);

  // 1. Manual Scan Pushbutton Trigger
  if (btnReading == LOW && lastBtnState == HIGH && (millis() - lastDebounceTime) > 300) {
    lastDebounceTime = millis();
    Serial.println("[USER] Manual 'SCAN LEAF' button pressed!");
    triggerAiScanAndSpray(distanceCm, tempC, humidity, "manual_button");
  }
  lastBtnState = btnReading;

  // 2. Autonomous Ultrasonic Proximity Trigger
  if (isAutoMode) {
    // When rover approaches plant canopy within 30cm, trigger scan
    if (distanceCm > 2.0 && distanceCm < 30.0) {
      if (millis() - lastAutoScanTime > AUTO_SCAN_COOLDOWN_MS) {
        lastAutoScanTime = millis();
        Serial.printf("[AUTO PATROL] Canopy proximity detected: %.1f cm (< 30 cm)\n", distanceCm);
        triggerAiScanAndSpray(distanceCm, tempC, humidity, "ultrasonic_proximity");
      }
    }
  }

  // 3. Periodic Status Display Refresh on LCD (every 1.5 seconds)
  static unsigned long lastLcdRefresh = 0;
  if (millis() - lastLcdRefresh > 1500) {
    lastLcdRefresh = millis();
    char line1[17];
    char line2[17];

    if (isAutoMode) {
      snprintf(line1, sizeof(line1), "AUTO: %.0fcm CANOPY", distanceCm);
    } else {
      snprintf(line1, sizeof(line1), "MANUAL: PRESS BTN");
    }
    snprintf(line2, sizeof(line2), "%.0fC  %.0f%% HUM", tempC, humidity);
    updateLcd(line1, line2);
  }

  delay(40);
}
