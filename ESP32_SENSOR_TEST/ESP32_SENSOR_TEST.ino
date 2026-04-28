// 🧪 FSR SENSOR DIAGNOSTIC SKETCH WITH FILTERING
// Read raw ADC values with heavy averaging for ADC2 pins (S5, S6)
// No WiFi, no backend - just raw sensor data
// Upload and open Serial Monitor at 115200 baud

// 🎯 FSR Pins (match your PCB wiring exactly)
int S1 = 34;  // ADC1 ✅
int S2 = 35;  // ADC1 ✅
int S3 = 32;  // ADC1 ✅
int S4 = 33;  // ADC1 ✅
int S5 = 25;  // ADC2 ⚠️ (with heavy filtering)
int S6 = 26;  // ADC2 ⚠️ (with heavy filtering)

void configureAdcPins() {
  // Use full-width ADC range to avoid clipping near 4095 when divider voltage is >1.1V.
  analogReadResolution(12);
  analogSetPinAttenuation(S1, ADC_11db);
  analogSetPinAttenuation(S2, ADC_11db);
  analogSetPinAttenuation(S3, ADC_11db);
  analogSetPinAttenuation(S4, ADC_11db);
  analogSetPinAttenuation(S5, ADC_11db);
  analogSetPinAttenuation(S6, ADC_11db);

  pinMode(S1, INPUT);
  pinMode(S2, INPUT);
  pinMode(S3, INPUT);
  pinMode(S4, INPUT);
  pinMode(S5, INPUT);
  pinMode(S6, INPUT);
}

// Filtering variables
float filtered[6] = {0, 0, 0, 0, 0, 0};
const int SAMPLES = 20;  // Average 20 readings
const float ALPHA = 0.3; // Low-pass filter coefficient (0-1, lower = smoother)

int readSensorAveraged(int pin) {
  long sum = 0;
  for (int i = 0; i < SAMPLES; i++) {
    sum += analogRead(pin);
    delayMicroseconds(100);
  }
  return sum / SAMPLES;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  configureAdcPins();
  Serial.println("FW_MARKER: SENSOR_TEST_DEC_V3");
  Serial.println("\n🚀 FSR DIAGNOSTIC TEST (with filtering)");
  Serial.println("Press sensors and watch values change");
  Serial.println("S5/S6 have heavy averaging for ADC2 stability\n");
}

void loop() {
  // ADC1 pins: single read (fast, stable)
  int s1 = readSensorAveraged(S1);
  int s2 = readSensorAveraged(S2);
  int s3 = readSensorAveraged(S3);
  int s4 = readSensorAveraged(S4);
  
  // ADC2 pins: averaged + low-pass filter (smooth out WiFi noise)
  int s5_raw = readSensorAveraged(S5);
  int s6_raw = readSensorAveraged(S6);
  
  filtered[4] = filtered[4] * (1.0 - ALPHA) + s5_raw * ALPHA;
  filtered[5] = filtered[5] * (1.0 - ALPHA) + s6_raw * ALPHA;
  
  int s5 = (int)filtered[4];
  int s6 = (int)filtered[5];

  // Print all 6 values on one line
  Serial.print("S1:");
  Serial.print(s1, DEC);
  Serial.print(" | S2:");
  Serial.print(s2, DEC);
  Serial.print(" | S3:");
  Serial.print(s3, DEC);
  Serial.print(" | S4:");
  Serial.print(s4, DEC);
  Serial.print(" | S5:");
  Serial.print(s5, DEC);
  Serial.print(" (filt) | S6:");
  Serial.print(s6, DEC);
  Serial.println(" (filt)");

  delay(100);  // Read every 100ms
}
