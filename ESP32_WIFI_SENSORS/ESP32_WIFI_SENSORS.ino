// ESP32 FSR sender (stable version with ADC2 fix)

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// ================= WIFI =================
const char *ssid = "Jonathan";
const char *password = "12345678";

// ================= BACKEND =================
const bool USE_PUBLIC_TUNNEL = false;

const char *LOCAL_SERVER_URL = "http://10.153.163.150:5000/api/esp32-data";
const char *PUBLIC_TUNNEL_URL = "https://fancy-stars-sin.loca.lt/api/esp32-data";

const char *serverUrl = USE_PUBLIC_TUNNEL ? PUBLIC_TUNNEL_URL : LOCAL_SERVER_URL;

// ================= SENSOR PINS =================
const int S1 = 34;  // ADC1
const int S2 = 35;  // ADC1
const int S3 = 32;  // ADC1
const int S4 = 33;  // ADC1
const int S5 = 25;  // ADC2
const int S6 = 26;  // ADC2

// ================= CONFIG =================
const int WIFI_CONNECT_TIMEOUT_MS = 12000;
const int HTTP_TIMEOUT_MS = 3000;

// Averaging
const int ADC_SAMPLES = 8;

// ================= SETUP =================
void configureAdc() {
  analogReadResolution(12);

  analogSetPinAttenuation(S1, ADC_11db);
  analogSetPinAttenuation(S2, ADC_11db);
  analogSetPinAttenuation(S3, ADC_11db);
  analogSetPinAttenuation(S4, ADC_11db);
  analogSetPinAttenuation(S5, ADC_11db);
  analogSetPinAttenuation(S6, ADC_11db);
}

// ================= WIFI =================
bool connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.setTxPower(WIFI_POWER_19_5dBm);

  WiFi.begin(ssid, password);

  Serial.print("Connecting WiFi");

  unsigned long start = millis();

  while (WiFi.status() != WL_CONNECTED &&
         millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    delay(300);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(" OK");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
    return true;
  }

  Serial.println(" FAILED");
  return false;
}

// ================= SENSOR READ =================
int readAveraged(int pin) {
  long sum = 0;
  for (int i = 0; i < ADC_SAMPLES; i++) {
    sum += analogRead(pin);
    delayMicroseconds(120);
  }
  return sum / ADC_SAMPLES;
}

void readAllSensors(int &s1, int &s2, int &s3, int &s4, int &s5, int &s6) {
  // 🔴 TURN WIFI OFF (required for ADC2)
  WiFi.mode(WIFI_OFF);
  delay(5);

  s1 = readAveraged(S1);
  s2 = readAveraged(S2);
  s3 = readAveraged(S3);
  s4 = readAveraged(S4);
  s5 = readAveraged(S5);  // ADC2 safe now
  s6 = readAveraged(S6);  // ADC2 safe now
}

// ================= SEND =================
bool sendToBackend(int s1, int s2, int s3, int s4, int s5, int s6) {
  if (WiFi.status() != WL_CONNECTED) return false;

  char json[128];
  snprintf(json, sizeof(json),
           "{\"S1\":%d,\"S2\":%d,\"S3\":%d,\"S4\":%d,\"S5\":%d,\"S6\":%d}",
           s1, s2, s3, s4, s5, s6);

  HTTPClient http;
  http.setTimeout(HTTP_TIMEOUT_MS);

  WiFiClientSecure secureClient;

  if (USE_PUBLIC_TUNNEL) {
    secureClient.setInsecure();
    http.begin(secureClient, serverUrl);
  } else {
    http.begin(serverUrl);
  }

  http.addHeader("Content-Type", "application/json");

  int code = http.POST((uint8_t *)json, strlen(json));
  http.end();

  Serial.print("HTTP: ");
  Serial.println(code);

  return code > 0;
}

// ================= MAIN =================
void setup() {
  Serial.begin(115200);
  delay(800);

  configureAdc();

  Serial.println("ESP32 6xFSR sender (FINAL)");
  Serial.print("Mode: ");
  Serial.println(USE_PUBLIC_TUNNEL ? "PUBLIC TUNNEL" : "LOCAL LAN");

  connectWiFi();
}

void loop() {
  int s1, s2, s3, s4, s5, s6;

  // 1. Read sensors (WiFi OFF inside)
  readAllSensors(s1, s2, s3, s4, s5, s6);

  // Debug output
  Serial.print("S:");
  Serial.print(s1); Serial.print(",");
  Serial.print(s2); Serial.print(",");
  Serial.print(s3); Serial.print(",");
  Serial.print(s4); Serial.print(",");
  Serial.print(s5); Serial.print(",");
  Serial.println(s6);

  // 2. Turn WiFi back ON
  WiFi.mode(WIFI_STA);
  delay(10);

  // 3. Reconnect if needed
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting WiFi...");
    connectWiFi();
  }

  // 4. Send data
  sendToBackend(s1, s2, s3, s4, s5, s6);

  delay(2000);
}