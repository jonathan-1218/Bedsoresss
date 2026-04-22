// ESP32 FSR sensors with WiFi + filtering
// Reads 6 FSR sensors with filtering and sends to backend
// S5/S6 on ADC2 get heavy averaging for stability

#include <WiFi.h>
#include <HTTPClient.h>

// WIFI (update these to your NEW network)
const char* ssid = "amazepixels";
const char* password = "03041979";

// Backend API (match your Mac's IP address)
const char* serverUrl = "http://192.168.0.10:5000/sensors";

// FSR pins (all on current pins)
int S1 = 34;  // ADC1
int S2 = 35;  // ADC1
int S3 = 32;  // ADC1
int S4 = 33;  // ADC1
int S5 = 25;  // ADC2 (with heavy filtering)
int S6 = 26;  // ADC2 (with heavy filtering)

// Filtering variables
float filtered[6] = {0, 0, 0, 0, 0, 0};
const int SAMPLES = 4;   // Very low averaging for minimal lag
const float ALPHA = 1.0; // No smoothing lag on S5/S6
const int WIFI_RECONNECT_TIMEOUT_MS = 12000;
const int SEND_INTERVAL_MS = 180;
const int ADC2_REFRESH_EVERY_N_CYCLES = 12;

int lastS5Raw = 0;
int lastS6Raw = 0;
int cycleCount = 0;

bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  for (int attempts = 0; attempts < 20; attempts++) {
    if (WiFi.status() == WL_CONNECTED) {
      Serial.println(" ok");
      Serial.print("ESP32 IP: ");
      Serial.println(WiFi.localIP());
      return true;
    }
    delay(500);
    Serial.print(".");
  }

  Serial.println(" failed");
  return false;
}

int readSensorAveraged(int pin) {
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(pin);
    delayMicroseconds(100);
  }
  return sum / SAMPLES;
}

bool reconnectWiFiWithTimeout(unsigned long timeoutMs) {
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && (millis() - start) < timeoutMs) {
    delay(250);
  }

  return WiFi.status() == WL_CONNECTED;
}

void readAdc2WithWifiPause(int &s5_raw, int &s6_raw) {
  // ADC2 (GPIO25/26) cannot be sampled reliably while WiFi is active.
  WiFi.disconnect(true, false);
  WiFi.mode(WIFI_OFF);
  delay(10);

  s5_raw = readSensorAveraged(S5);
  s6_raw = readSensorAveraged(S6);

  reconnectWiFiWithTimeout(WIFI_RECONNECT_TIMEOUT_MS);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\nESP32 FSR sender started");
  Serial.print("SSID: ");
  Serial.println(ssid);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected, retrying...");
    connectWiFi();
    delay(2000);
    return;
  }

  if (WiFi.status() == WL_CONNECTED) {

    // ADC1 pins: single averaged read
    int s1 = readSensorAveraged(S1);
    int s2 = readSensorAveraged(S2);
    int s3 = readSensorAveraged(S3);
    int s4 = readSensorAveraged(S4);
    
    // ADC2 pins are expensive with WiFi ON; refresh rarely to keep UI responsive.
    if (cycleCount % ADC2_REFRESH_EVERY_N_CYCLES == 0) {
      int s5_raw = 0;
      int s6_raw = 0;
      readAdc2WithWifiPause(s5_raw, s6_raw);

      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi reconnect failed after ADC2 read");
        delay(2000);
        return;
      }

      lastS5Raw = s5_raw;
      lastS6Raw = s6_raw;
    }
    
    filtered[4] = filtered[4] * (1.0 - ALPHA) + lastS5Raw * ALPHA;
    filtered[5] = filtered[5] * (1.0 - ALPHA) + lastS6Raw * ALPHA;
    
    int s5 = (int)filtered[4];
    int s6 = (int)filtered[5];

    Serial.print("RAW S2:");
    Serial.print(s2);
    Serial.print(" RAW S5:");
    Serial.print(lastS5Raw);
    Serial.print(" | S:");
    Serial.print(s1);
    Serial.print(",");
    Serial.print(s2);
    Serial.print(",");
    Serial.print(s3);
    Serial.print(",");
    Serial.print(s4);
    Serial.print(",");
    Serial.print(s5);
    Serial.print(",");
    Serial.print(s6);
    Serial.print(" | ");

    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    // JSON payload
    String json = "{";
    json += "\"S1\":" + String(s1) + ",";
    json += "\"S2\":" + String(s2) + ",";
    json += "\"S3\":" + String(s3) + ",";
    json += "\"S4\":" + String(s4) + ",";
    json += "\"S5\":" + String(s5) + ",";
    json += "\"S6\":" + String(s6);
    json += "}";

    int response = http.POST(json);

    Serial.print("HTTP response: ");
    Serial.println(response);

    http.end();
    cycleCount++;
  }

  delay(SEND_INTERVAL_MS);
}
