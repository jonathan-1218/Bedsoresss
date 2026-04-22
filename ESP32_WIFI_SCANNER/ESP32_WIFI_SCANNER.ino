// 📶 WiFi NETWORK SCANNER
// Shows all available WiFi networks and their exact names
// Use this to find the correct SSID to use in the main sketch

#include <WiFi.h>

void setup() {
  Serial.begin(115200);
  delay(2000);
  
  Serial.println("\n🔍 WiFi NETWORK SCANNER");
  Serial.println("Scanning available networks...\n");
  
  int networks = WiFi.scanNetworks();
  
  if (networks == 0) {
    Serial.println("❌ No networks found");
  } else {
    Serial.print("✅ Found ");
    Serial.print(networks);
    Serial.println(" networks:\n");
    
    for (int i = 0; i < networks; i++) {
      Serial.print(i + 1);
      Serial.print(". SSID: \"");
      Serial.print(WiFi.SSID(i));
      Serial.print("\" | Signal: ");
      Serial.print(WiFi.RSSI(i));
      Serial.println(" dBm");
    }
  }
  
  Serial.println("\n⚠️  Copy the exact SSID name (including spaces and capitalization)");
  Serial.println("and update your WiFi sketch's ssid variable");
}

void loop() {
  delay(10000);
}
