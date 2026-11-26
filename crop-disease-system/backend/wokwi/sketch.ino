#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <LiquidCrystal_I2C.h>
#include <DHT.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

// Replace with your public tunnel URL to localhost:8000 (e.g. "https://xxxx.lhr.life/api/wokwi/predict")
const char* SERVER_URL = "http://host.wokwi.internal:8000/api/wokwi/predict";

#define TRIG_PIN 5
#define ECHO_PIN 18
#define DHT_PIN 4
#define BTN_PIN 14
#define SERVO_PIN 13
#define LED_SPRAY 2
#define LED_ALERT 15

DHT dht(DHT_PIN, DHT22);
Servo sprayNozzle;
LiquidCrystal_I2C lcd(0x27, 16, 2);

int plantIndex = 1;

void setup() {
  Serial.begin(115200);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(BTN_PIN, INPUT_PULLUP);
  pinMode(LED_SPRAY, OUTPUT);
  pinMode(LED_ALERT, OUTPUT);

  dht.begin();
  sprayNozzle.attach(SERVO_PIN);
  sprayNozzle.write(0); // Nozzle closed

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("CropGuard AI");
  lcd.setCursor(0, 1);
  lcd.print("Connecting WiFi");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(300);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
  lcd.clear();
  lcd.print("Rover Ready!");
  lcd.setCursor(0, 1);
  lcd.print("Press SCAN BTN");
}

float readDistanceCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 100.0;
  return duration * 0.034 / 2.0;
}

void triggerAIScanAndSpray(float dist, float temp, float hum) {
  String plantId = "R1-C" + String(plantIndex);
  plantIndex = (plantIndex % 6) + 1;

  lcd.clear();
  lcd.print("Scanning " + plantId);
  lcd.setCursor(0, 1);
  lcd.print("Sending to AI...");

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    StaticJsonDocument<256> doc;
    doc["plant_id"] = plantId;
    doc["distance_cm"] = dist;
    doc["temperature"] = temp;
    doc["humidity"] = hum;
    doc["crop_type"] = "Rose";
    doc["trigger"] = "wokwi_esp32";

    String payload;
    serializeJson(doc, payload);
    Serial.println("TX -> " + payload);

    int httpCode = http.POST(payload);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.println("RX <- " + response);

      StaticJsonDocument<512> resDoc;
      deserializeJson(resDoc, response);

      const char* disease = resDoc["disease"] | "Leaf Rust";
      float conf = resDoc["confidence"] | 96.5;
      bool spray = resDoc["spray_command"] | true;

      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print(String(disease).substring(0, 16));
      lcd.setCursor(0, 1);
      lcd.print("Conf:" + String(conf, 1) + "%");

      if (spray && String(disease) != "Healthy") {
        digitalWrite(LED_ALERT, HIGH);
        digitalWrite(LED_SPRAY, HIGH);
        sprayNozzle.write(90); // Open precision spray valve!
        delay(2000);
        sprayNozzle.write(0);  // Close nozzle
        digitalWrite(LED_SPRAY, LOW);
        digitalWrite(LED_ALERT, LOW);
      }
    } else {
      Serial.println("HTTP Error: " + String(httpCode));
      lcd.clear();
      lcd.print("Server Offline");
    }
    http.end();
  }
}

void loop() {
  float dist = readDistanceCM();
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  if (isnan(temp)) temp = 28.0;
  if (isnan(hum)) hum = 75.0;

  // Trigger if green SCAN button is pressed OR plant is within 25cm of ultrasonic sensor
  if (digitalRead(BTN_PIN) == LOW || dist < 25.0) {
    triggerAIScanAndSpray(dist, temp, hum);
    delay(2500);
  }
  delay(200);
}