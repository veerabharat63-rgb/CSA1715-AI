/**
 * Embedded Wokwi Project Source Files for One-Click Clipboard Copying in the UI.
 */

export const WOKWI_DIAGRAM_JSON = `{
  "version": 1,
  "author": "CropGuard AI Agritech Team",
  "editor": "wokwi",
  "parts": [
    {
      "type": "wokwi-esp32-devkit-v1",
      "id": "esp",
      "top": 120,
      "left": 160,
      "attrs": {}
    },
    {
      "type": "wokwi-lcd1602",
      "id": "lcd",
      "top": -85,
      "left": 110,
      "attrs": { "pins": "i2c" }
    },
    {
      "type": "wokwi-hc-sr04",
      "id": "sonar",
      "top": -75,
      "left": -130,
      "attrs": { "distance": "24" }
    },
    {
      "type": "wokwi-dht22",
      "id": "dht",
      "top": 105,
      "left": -120,
      "attrs": { "temperature": "26.5", "humidity": "82" }
    },
    {
      "type": "wokwi-servo",
      "id": "servo",
      "top": 355,
      "left": 360,
      "attrs": {}
    },
    {
      "type": "wokwi-pushbutton",
      "id": "btn_scan",
      "top": 320,
      "left": 40,
      "attrs": { "color": "green", "label": "SCAN LEAF" }
    },
    {
      "type": "wokwi-slide-switch",
      "id": "sw_auto",
      "top": 380,
      "left": 130,
      "attrs": { "label": "AUTO PATROL" }
    },
    {
      "type": "wokwi-led",
      "id": "led_spray",
      "top": 110,
      "left": 440,
      "attrs": { "color": "blue", "label": "SPRAY ACTUATOR" }
    },
    {
      "type": "wokwi-led",
      "id": "led_alert",
      "top": 180,
      "left": 440,
      "attrs": { "color": "red", "label": "DISEASE ALERT" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r1",
      "top": 145,
      "left": 375,
      "attrs": { "value": "220" }
    },
    {
      "type": "wokwi-resistor",
      "id": "r2",
      "top": 215,
      "left": 375,
      "attrs": { "value": "220" }
    }
  ],
  "connections": [
    [ "esp:TX0", "$serialMonitor:RX", "", [] ],
    [ "esp:RX0", "$serialMonitor:TX", "", [] ],

    [ "esp:GND.1", "lcd:GND", "black", [ "h-20", "v-180" ] ],
    [ "esp:5V", "lcd:VCC", "red", [ "h-10", "v-170" ] ],
    [ "esp:D21", "lcd:SDA", "blue", [ "h-30", "v-170" ] ],
    [ "esp:D22", "lcd:SCL", "yellow", [ "h-40", "v-160" ] ],

    [ "esp:5V", "sonar:VCC", "red", [ "h-50", "v-155" ] ],
    [ "esp:GND.1", "sonar:GND", "black", [ "h-60", "v-145" ] ],
    [ "esp:D5", "sonar:TRIG", "purple", [ "h-20", "v-120" ] ],
    [ "esp:D18", "sonar:ECHO", "orange", [ "h-10", "v-110" ] ],

    [ "esp:3V3", "dht:VCC", "red", [ "h-30", "v-20" ] ],
    [ "esp:GND.1", "dht:GND", "black", [ "h-50", "v-10" ] ],
    [ "esp:D4", "dht:SDA", "green", [ "h-20", "v-10" ] ],

    [ "esp:D19", "btn_scan:2.l", "green", [ "h-20", "v120" ] ],
    [ "esp:GND.2", "btn_scan:1.l", "black", [ "v40", "h-60" ] ],

    [ "esp:D23", "sw_auto:2", "cyan", [ "h-30", "v170" ] ],
    [ "esp:GND.2", "sw_auto:1", "black", [ "v60", "h-30" ] ],

    [ "esp:D2", "r1:1", "blue", [ "h20" ] ],
    [ "r1:2", "led_spray:A", "blue", [ "h20" ] ],
    [ "esp:GND.2", "led_spray:C", "black", [ "v20", "h180" ] ],

    [ "esp:D15", "r2:1", "red", [ "h20" ] ],
    [ "r2:2", "led_alert:A", "red", [ "h20" ] ],
    [ "esp:GND.2", "led_alert:C", "black", [ "v40", "h180" ] ],

    [ "esp:5V", "servo:V+", "red", [ "v180", "h150" ] ],
    [ "esp:GND.2", "servo:GND", "black", [ "v190", "h140" ] ],
    [ "esp:D13", "servo:PWM", "gold", [ "h30", "v140" ] ]
  ]
}`;

export const WOKWI_SKETCH_INO = `/*
 * ============================================================================
 * CropGuard AI - ESP32 Hardware-in-the-Loop (HIL) Rover Firmware
 * Precision Rose Farming · Edge Triggered AI Vision & Kinematic Spraying
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
const char* WIFI_SSID     = "Wokwi-GUEST";
const char* WIFI_PASSWORD = "";

// 'host.wokwi.internal' routes directly to host localhost:8000 in Wokwi
const char* API_ENDPOINT  = "http://host.wokwi.internal:8000/api/wokwi/predict";

DHT dht(PIN_DHT, DHT_TYPE);
Servo sprayServo;
LiquidCrystal_I2C lcd(0x27, 16, 2);

bool lastBtnState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long lastAutoScanTime = 0;
const unsigned long AUTO_SCAN_COOLDOWN_MS = 6000;

int currentPlantRow = 1;
int currentPlantCol = 1;

float readUltrasonicDistanceCm() {
  digitalWrite(PIN_TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(PIN_TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(PIN_TRIG, LOW);

  long duration = pulseIn(PIN_ECHO, HIGH, 30000);
  if (duration == 0) return 999.0;
  return duration * 0.0343 / 2.0;
}

void updateLcd(const char* line1, const char* line2) {
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print(line1);
  lcd.setCursor(0, 1);
  lcd.print(line2);
}

void triggerAiScanAndSpray(float distanceCm, float tempC, float humidity, const char* triggerType) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi not connected! Skipping AI inference.");
    updateLcd("WiFi Offline", "Retrying link...");
    return;
  }

  char plantId[12];
  snprintf(plantId, sizeof(plantId), "R%d-C%d", currentPlantRow, currentPlantCol);

  currentPlantCol++;
  if (currentPlantCol > 6) {
    currentPlantCol = 1;
    currentPlantRow++;
    if (currentPlantRow > 3) currentPlantRow = 1;
  }

  Serial.println("\\n=======================================================");
  Serial.printf("[HIL SCAN TRIGGERED] Target: %s via %s\\n", plantId, triggerType);
  Serial.printf("[SENSOR TELEMETRY] Dist: %.1f cm | Temp: %.1f C | Hum: %.1f %%\\n", distanceCm, tempC, humidity);

  updateLcd("SCANNING LEAF...", plantId);

  StaticJsonDocument<384> docOut;
  docOut["plant_id"]      = plantId;
  docOut["distance_cm"]   = distanceCm;
  docOut["temp_c"]        = tempC;
  docOut["humidity"]      = humidity;
  docOut["crop_type"]     = "rose";
  docOut["scan_trigger"]  = triggerType;
  docOut["rover_speed"]   = 0.5;
  docOut["nozzle_offset"] = 0.8;

  String requestJson;
  serializeJson(docOut, requestJson);

  HTTPClient http;
  http.begin(API_ENDPOINT);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(6000);

  int httpCode = http.POST(requestJson);
  if (httpCode <= 0) {
    Serial.printf("[HTTP ERROR] Failed to connect! Code: %d\\n", httpCode);
    updateLcd("AI Link Failed", "Check Backend");
    http.end();
    return;
  }

  String responseJson = http.getString();
  http.end();

  StaticJsonDocument<512> docIn;
  DeserializationError error = deserializeJson(docIn, responseJson);
  if (error) {
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

  if (sprayCommand && strcmp(disease, "Healthy") != 0) {
    digitalWrite(PIN_LED_ALERT, HIGH);

    char line1[17];
    char line2[17];
    snprintf(line1, sizeof(line1), "%.7s %.0f%%", disease, confidence);
    snprintf(line2, sizeof(line2), "Dt:%dms ALERT", deltaTMs);
    updateLcd(line1, line2);

    delay(deltaTMs);

    digitalWrite(PIN_LED_SPRAY, HIGH);
    sprayServo.write(90);

    snprintf(line2, sizeof(line2), "SPRAYING %dms", sprayDurationMs);
    updateLcd(line1, line2);

    delay(sprayDurationMs);

    sprayServo.write(0);
    digitalWrite(PIN_LED_SPRAY, LOW);
    digitalWrite(PIN_LED_ALERT, LOW);

    snprintf(line2, sizeof(line2), "SAVED: %.0f%% CHEM", chemicalSaved);
    updateLcd(line1, line2);
    delay(2000);

  } else {
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
}

void setup() {
  Serial.begin(115200);
  pinMode(PIN_TRIG, OUTPUT);
  pinMode(PIN_ECHO, INPUT);
  pinMode(PIN_BTN_SCAN, INPUT_PULLUP);
  pinMode(PIN_SW_AUTO, INPUT_PULLUP);
  pinMode(PIN_LED_SPRAY, OUTPUT);
  pinMode(PIN_LED_ALERT, OUTPUT);

  digitalWrite(PIN_LED_SPRAY, LOW);
  digitalWrite(PIN_LED_ALERT, LOW);

  sprayServo.attach(PIN_SERVO);
  sprayServo.write(0);

  dht.begin();
  lcd.init();
  lcd.backlight();
  updateLcd("CropGuard AI HIL", "Connecting WiFi.");

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(400);
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    updateLcd("WiFi Connected", "AI HIL Rover Ready");
  } else {
    updateLcd("WiFi Warning", "Offline Standby");
  }
  delay(1500);
}

void loop() {
  float distanceCm = readUltrasonicDistanceCm();
  float tempC      = dht.readTemperature();
  float humidity   = dht.readHumidity();

  if (isnan(tempC)) tempC = 25.0;
  if (isnan(humidity)) humidity = 75.0;

  bool isAutoMode = (digitalRead(PIN_SW_AUTO) == LOW);
  bool btnReading = digitalRead(PIN_BTN_SCAN);

  if (btnReading == LOW && lastBtnState == HIGH && (millis() - lastDebounceTime) > 300) {
    lastDebounceTime = millis();
    triggerAiScanAndSpray(distanceCm, tempC, humidity, "manual_button");
  }
  lastBtnState = btnReading;

  if (isAutoMode) {
    if (distanceCm > 2.0 && distanceCm < 30.0) {
      if (millis() - lastAutoScanTime > AUTO_SCAN_COOLDOWN_MS) {
        lastAutoScanTime = millis();
        triggerAiScanAndSpray(distanceCm, tempC, humidity, "ultrasonic_proximity");
      }
    }
  }

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
`;

export const WOKWI_LIBRARIES_TXT = `# Wokwi Arduino / ESP32 Dependencies for CropGuard AI
ArduinoJson
ESP32Servo
LiquidCrystal I2C
DHT sensor library
Adafruit Unified Sensor
`;
