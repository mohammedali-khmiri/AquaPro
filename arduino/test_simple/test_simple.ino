void setup() {
  Serial.begin(115200);
  pinMode(22, OUTPUT);
  pinMode(24, INPUT);
  Serial.println("=== TEST ULTRA SIMPLE (Pin 22 et 24) ===");
}

void loop() {
  digitalWrite(22, LOW);
  delayMicroseconds(5);
  digitalWrite(22, HIGH);
  delayMicroseconds(15);
  digitalWrite(22, LOW);
  
  long dur = pulseIn(24, HIGH, 50000UL); // Timeout 50ms
  long cm = dur * 17L / 1000L;
  
  Serial.print("Duree brute: ");
  Serial.print(dur);
  Serial.print(" us  |  Distance calculee: ");
  Serial.print(cm);
  Serial.println(" cm");
  
  delay(250);
}
