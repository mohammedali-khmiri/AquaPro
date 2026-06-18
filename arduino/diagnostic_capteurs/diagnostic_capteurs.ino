/*
 * ============================================================
 *  DIAGNOSTIC CAPTEURS HY-SRF05
 *  Scanne tous les pins pour trouver les capteurs
 * ============================================================
 *  
 *  Ce sketch teste automatiquement differentes combinaisons
 *  de pins TRIG/ECHO pour detecter ou sont branches les capteurs.
 *  Les resultats s'affichent sur le LCD ET sur le port serie.
 *
 *  INSTRUCTIONS :
 *  1. Upload ce sketch
 *  2. Placez un objet a ~10-20cm devant UN capteur
 *  3. Regardez l'ecran : il affiche les pins qui fonctionnent
 *  4. Notez les pins TRIG/ECHO detectes
 *  5. Re-uploadez le sketch principal avec les bons pins
 */

#include <Adafruit_GFX.h>
#include <MCUFRIEND_kbv.h>

// Couleurs
#define CLR_BG       0x0000
#define CLR_WHITE    0xFFFF
#define CLR_CYAN     0x07FF
#define CLR_GREEN    0x07E0
#define CLR_RED      0xF800
#define CLR_YELLOW   0xFFE0
#define CLR_GRAY     0x7BEF
#define CLR_DARKGRAY 0x39E7
#define CLR_POOL     0x065F
#define CLR_ORANGE   0xFC00

MCUFRIEND_kbv tft;
int16_t W, H;

// ── Tous les pins a tester sur le header droit du Mega ──────────
// On evite les pins utilises par le TFT shield (2-9, A0-A4)
const uint8_t testPins[] = { 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53 };
const int numPins = sizeof(testPins) / sizeof(testPins[0]);

// Combinaisons courantes a tester en priorite
struct PinCombo {
  uint8_t trig;
  uint8_t echo;
  const char* label;
};

PinCombo combos[] = {
  {22, 23, "T22/E23"},   // Consecutif
  {22, 24, "T22/E24"},   // Alterné (pair)
  {24, 25, "T24/E25"},   // Consecutif
  {26, 28, "T26/E28"},   // Alterné
  {26, 27, "T26/E27"},   // Consecutif
  {23, 22, "T23/E22"},   // Inversé
  {24, 22, "T24/E22"},   // Inversé alterné
  {25, 24, "T25/E24"},   // Inversé
  {28, 26, "T28/E26"},   // Inversé alterné
  {30, 31, "T30/E31"},   // Autres pins possibles
  {32, 33, "T32/E33"},
  {34, 35, "T34/E35"},
  {36, 37, "T36/E37"},
  {38, 39, "T38/E39"},
  {40, 41, "T40/E41"},
  {42, 43, "T42/E43"},
};
const int numCombos = sizeof(combos) / sizeof(combos[0]);

// ── Mesure distance sur un couple de pins ───────────────────────
long testReadCm(uint8_t trig, uint8_t echo) {
  // Configurer les pins
  pinMode(trig, OUTPUT);
  pinMode(echo, INPUT);
  
  // Stabiliser
  digitalWrite(trig, LOW);
  delayMicroseconds(5);
  
  // Pulse trigger
  digitalWrite(trig, HIGH);
  delayMicroseconds(15);
  digitalWrite(trig, LOW);
  
  // Lire echo avec timeout long
  long dur = pulseIn(echo, HIGH, 50000UL);  // 50ms timeout
  
  if (dur == 0) return -1;  // Pas de reponse
  
  long cm = dur * 17L / 1000L;
  if (cm <= 0 || cm > 500) return -2;  // Hors plage
  
  return cm;
}

// ── Centrer du texte ────────────────────────────────────────────
void drawCentered(const char* text, int y, uint8_t sz, uint16_t col) {
  tft.setTextSize(sz);
  tft.setTextColor(col);
  int16_t x1, y1;
  uint16_t tw, th;
  tft.getTextBounds(text, 0, 0, &x1, &y1, &tw, &th);
  tft.setCursor((W - tw) / 2, y);
  tft.print(text);
}

// ── Phase 1 : Test des pins individuels ─────────────────────────
void testPinStates() {
  tft.fillScreen(CLR_BG);
  
  tft.fillRect(0, 0, W, 30, CLR_POOL);
  drawCentered("DIAGNOSTIC PINS", 6, 2, CLR_WHITE);
  
  tft.setTextSize(1);
  tft.setTextColor(CLR_CYAN);
  tft.setCursor(5, 35);
  tft.print("Test etat logique de chaque pin:");
  
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("  PHASE 1 : ETAT DES PINS INDIVIDUELS"));
  Serial.println(F("========================================"));
  
  int row = 0;
  int y = 48;
  
  for (int i = 0; i < numPins && i < 16; i++) {
    uint8_t pin = testPins[i];
    pinMode(pin, INPUT);
    delay(5);
    int val = digitalRead(pin);
    
    int x = (i % 4) * 80 + 5;
    if (i > 0 && i % 4 == 0) y += 12;
    
    tft.setTextSize(1);
    tft.setTextColor(val == HIGH ? CLR_GREEN : CLR_GRAY);
    tft.setCursor(x, y);
    tft.print("P");
    tft.print(pin);
    tft.print("=");
    tft.print(val);
    
    Serial.print(F("  Pin ")); Serial.print(pin);
    Serial.print(F(" = ")); Serial.println(val == HIGH ? "HIGH" : "LOW");
  }
  
  delay(3000);
}

// ── Phase 2 : Scan des combinaisons TRIG/ECHO ──────────────────
void scanCombinations() {
  tft.fillScreen(CLR_BG);
  
  tft.fillRect(0, 0, W, 30, CLR_ORANGE);
  drawCentered("SCAN CAPTEURS", 6, 2, CLR_WHITE);
  
  tft.setTextSize(1);
  tft.setTextColor(CLR_YELLOW);
  tft.setCursor(5, 35);
  tft.print("Test combinaisons TRIG/ECHO...");
  tft.setTextColor(CLR_WHITE);
  tft.setCursor(5, 46);
  tft.print("Placez un objet a 10-30cm d'un capteur!");
  
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("  PHASE 2 : SCAN COMBINAISONS TRIG/ECHO"));
  Serial.println(F("  Placez un objet devant un capteur !"));
  Serial.println(F("========================================"));
  
  int y = 62;
  int foundCount = 0;
  
  for (int i = 0; i < numCombos; i++) {
    uint8_t trig = combos[i].trig;
    uint8_t echo = combos[i].echo;
    
    // Faire 3 essais
    long bestReading = -1;
    for (int attempt = 0; attempt < 3; attempt++) {
      long cm = testReadCm(trig, echo);
      if (cm > 0 && (bestReading < 0 || cm < bestReading)) {
        bestReading = cm;
      }
      delay(60);
    }
    
    // Afficher sur LCD
    if (y > H - 12) {
      // Ecran plein, scroller
      y = 62;
      tft.fillRect(0, 60, W, H - 60, CLR_BG);
    }
    
    tft.setTextSize(1);
    tft.setCursor(5, y);
    
    if (bestReading > 0) {
      // *** CAPTEUR TROUVE ! ***
      foundCount++;
      tft.setTextColor(CLR_GREEN);
      tft.print(">> ");
      tft.print(combos[i].label);
      tft.print(" = ");
      tft.print(bestReading);
      tft.print("cm  OK!");
      
      Serial.print(F("  *** TROUVE *** "));
      Serial.print(combos[i].label);
      Serial.print(F(" → TRIG="));
      Serial.print(trig);
      Serial.print(F(" ECHO="));
      Serial.print(echo);
      Serial.print(F(" Distance="));
      Serial.print(bestReading);
      Serial.println(F("cm"));
    } else {
      tft.setTextColor(CLR_DARKGRAY);
      tft.print("   ");
      tft.print(combos[i].label);
      tft.print(" = ");
      tft.print(bestReading == -1 ? "timeout" : "erreur");
      
      Serial.print(F("  - "));
      Serial.print(combos[i].label);
      Serial.println(bestReading == -1 ? F(" → pas de reponse") : F(" → hors plage"));
    }
    
    y += 11;
  }
  
  // Resultat final
  tft.fillRect(0, H - 30, W, 30, foundCount > 0 ? CLR_GREEN : CLR_RED);
  tft.setTextSize(2);
  tft.setTextColor(CLR_WHITE);
  tft.setCursor(10, H - 25);
  if (foundCount > 0) {
    tft.print(foundCount);
    tft.print(" capteur(s) OK!");
  } else {
    tft.print("AUCUN DETECTE!");
  }
  
  Serial.println(F(""));
  Serial.print(F("  RESULTAT: "));
  Serial.print(foundCount);
  Serial.println(F(" capteur(s) detecte(s)"));
  
  delay(5000);
}

// ── Phase 3 : Test SRF05 mode specifique (1 seul pin) ──────────
void testSRF05SinglePin() {
  tft.fillScreen(CLR_BG);
  
  tft.fillRect(0, 0, W, 30, CLR_YELLOW);
  drawCentered("TEST SRF05 MODE", 6, 2, CLR_BG);
  
  tft.setTextSize(1);
  tft.setTextColor(CLR_WHITE);
  tft.setCursor(5, 35);
  tft.print("Test mode 1-pin du HY-SRF05");
  tft.setCursor(5, 46);
  tft.print("(TRIG et ECHO sur le meme pin)");
  
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("  PHASE 3 : TEST MODE SRF05 (1 PIN)"));
  Serial.println(F("========================================"));
  
  int y = 62;
  int foundCount = 0;
  
  // Tester chaque pin en mode single-pin (SRF05 specifique)
  uint8_t singlePins[] = {22, 23, 24, 25, 26, 27, 28, 29, 30, 31};
  int numSingle = sizeof(singlePins) / sizeof(singlePins[0]);
  
  for (int i = 0; i < numSingle; i++) {
    uint8_t pin = singlePins[i];
    
    // Mode SRF05 single-pin: envoyer trigger, puis lire echo sur le meme pin
    pinMode(pin, OUTPUT);
    digitalWrite(pin, LOW);
    delayMicroseconds(5);
    digitalWrite(pin, HIGH);
    delayMicroseconds(15);
    digitalWrite(pin, LOW);
    
    // Basculer en input pour lire l'echo
    pinMode(pin, INPUT);
    long dur = pulseIn(pin, HIGH, 50000UL);
    
    long cm = -1;
    if (dur > 0) {
      cm = dur * 17L / 1000L;
      if (cm > 0 && cm < 500) {
        foundCount++;
      }
    }
    
    tft.setTextSize(1);
    tft.setCursor(5, y);
    
    if (cm > 0 && cm < 500) {
      tft.setTextColor(CLR_GREEN);
      tft.print(">> Pin ");
      tft.print(pin);
      tft.print(" = ");
      tft.print(cm);
      tft.print("cm  OK!");
      
      Serial.print(F("  *** Pin ")); Serial.print(pin);
      Serial.print(F(" = ")); Serial.print(cm); Serial.println(F("cm ***"));
    } else {
      tft.setTextColor(CLR_DARKGRAY);
      tft.print("   Pin ");
      tft.print(pin);
      tft.print(" = rien");
      
      Serial.print(F("  - Pin ")); Serial.print(pin); Serial.println(F(" = rien"));
    }
    
    y += 11;
    delay(60);
  }
  
  delay(3000);
}

// ── Phase 4 : Monitoring continu des pins attendus ──────────────
void continuousMonitor() {
  tft.fillScreen(CLR_BG);
  
  tft.fillRect(0, 0, W, 30, CLR_POOL);
  drawCentered("MONITORING LIVE", 6, 2, CLR_WHITE);
  
  tft.setTextSize(1);
  tft.setTextColor(CLR_YELLOW);
  tft.setCursor(5, 35);
  tft.print("Lecture continue - bougez les fils!");
  
  Serial.println(F(""));
  Serial.println(F("========================================"));
  Serial.println(F("  PHASE 4 : MONITORING CONTINU"));
  Serial.println(F("  Bougez/touchez les fils des capteurs"));
  Serial.println(F("========================================"));
  
  // Dessiner les labels
  tft.setTextSize(2);
  tft.setTextColor(CLR_CYAN);
  
  tft.setCursor(5, 55);  tft.print("T22/E23:");
  tft.setCursor(5, 80);  tft.print("T22/E24:");
  tft.setCursor(5, 105); tft.print("T24/E25:");
  tft.setCursor(5, 130); tft.print("T26/E28:");
  tft.setCursor(5, 155); tft.print("T26/E27:");
  tft.setCursor(5, 180); tft.print("RawE23:");
  tft.setCursor(5, 200); tft.print("RawE25:");
  
  unsigned long startLoop = millis();
  
  // Boucle de monitoring pendant 60 secondes
  while (millis() - startLoop < 60000) {
    
    // Test combo 1: T22/E23
    long r1 = testReadCm(22, 23);
    delay(30);
    
    // Test combo 2: T22/E24
    long r2 = testReadCm(22, 24);
    delay(30);
    
    // Test combo 3: T24/E25
    long r3 = testReadCm(24, 25);
    delay(30);
    
    // Test combo 4: T26/E28
    long r4 = testReadCm(26, 28);
    delay(30);
    
    // Test combo 5: T26/E27
    long r5 = testReadCm(26, 27);
    delay(30);
    
    // Lire etat brut des pins echo
    pinMode(23, INPUT);
    int raw23 = digitalRead(23);
    pinMode(25, INPUT);
    int raw25 = digitalRead(25);
    
    // Afficher les valeurs
    int valueX = 180;
    
    // Combo 1
    tft.fillRect(valueX, 55, 140, 18, CLR_BG);
    tft.setTextSize(2);
    tft.setCursor(valueX, 55);
    tft.setTextColor(r1 > 0 ? CLR_GREEN : CLR_RED);
    if (r1 > 0) { tft.print(r1); tft.print("cm"); }
    else tft.print("---");
    
    // Combo 2
    tft.fillRect(valueX, 80, 140, 18, CLR_BG);
    tft.setCursor(valueX, 80);
    tft.setTextColor(r2 > 0 ? CLR_GREEN : CLR_RED);
    if (r2 > 0) { tft.print(r2); tft.print("cm"); }
    else tft.print("---");
    
    // Combo 3
    tft.fillRect(valueX, 105, 140, 18, CLR_BG);
    tft.setCursor(valueX, 105);
    tft.setTextColor(r3 > 0 ? CLR_GREEN : CLR_RED);
    if (r3 > 0) { tft.print(r3); tft.print("cm"); }
    else tft.print("---");
    
    // Combo 4
    tft.fillRect(valueX, 130, 140, 18, CLR_BG);
    tft.setCursor(valueX, 130);
    tft.setTextColor(r4 > 0 ? CLR_GREEN : CLR_RED);
    if (r4 > 0) { tft.print(r4); tft.print("cm"); }
    else tft.print("---");
    
    // Combo 5
    tft.fillRect(valueX, 155, 140, 18, CLR_BG);
    tft.setCursor(valueX, 155);
    tft.setTextColor(r5 > 0 ? CLR_GREEN : CLR_RED);
    if (r5 > 0) { tft.print(r5); tft.print("cm"); }
    else tft.print("---");
    
    // Raw pin states
    tft.fillRect(valueX, 180, 140, 16, CLR_BG);
    tft.setTextSize(1);
    tft.setCursor(valueX, 182);
    tft.setTextColor(raw23 ? CLR_GREEN : CLR_GRAY);
    tft.print(raw23 ? "HIGH" : "LOW");
    
    tft.fillRect(valueX, 200, 140, 16, CLR_BG);
    tft.setCursor(valueX, 202);
    tft.setTextColor(raw25 ? CLR_GREEN : CLR_GRAY);
    tft.print(raw25 ? "HIGH" : "LOW");
    
    // Timer restant
    tft.fillRect(W - 40, 35, 40, 10, CLR_BG);
    tft.setTextSize(1);
    tft.setTextColor(CLR_GRAY);
    tft.setCursor(W - 35, 35);
    tft.print((60000 - (millis() - startLoop)) / 1000);
    tft.print("s");
    
    // Serial debug
    Serial.print(F("T22/E23=")); Serial.print(r1);
    Serial.print(F(" T22/E24=")); Serial.print(r2);
    Serial.print(F(" T24/E25=")); Serial.print(r3);
    Serial.print(F(" T26/E28=")); Serial.print(r4);
    Serial.print(F(" T26/E27=")); Serial.print(r5);
    Serial.print(F(" Raw23=")); Serial.print(raw23);
    Serial.print(F(" Raw25=")); Serial.println(raw25);
    
    delay(200);
  }
}

// ── Setup ───────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  
  // Init TFT
  uint16_t id = tft.readID();
  if (id == 0xD3D3) id = 0x9481;
  tft.begin(id);
  tft.setRotation(1);
  W = tft.width();
  H = tft.height();
  
  Serial.println(F(""));
  Serial.println(F("╔══════════════════════════════════════╗"));
  Serial.println(F("║  DIAGNOSTIC CAPTEURS HY-SRF05       ║"));
  Serial.println(F("║  Placez un objet devant un capteur   ║"));
  Serial.println(F("╚══════════════════════════════════════╝"));
  
  // Splash screen
  tft.fillScreen(CLR_BG);
  tft.fillRect(0, 0, W, H, CLR_BG);
  drawCentered("DIAGNOSTIC", 40, 4, CLR_CYAN);
  drawCentered("CAPTEURS", 80, 4, CLR_CYAN);
  drawCentered("HY-SRF05", 120, 3, CLR_YELLOW);
  drawCentered("Placez un objet a 15cm", 170, 1, CLR_WHITE);
  drawCentered("d'un capteur puis attendez...", 182, 1, CLR_WHITE);
  delay(3000);
  
  // Phase 1 : Tester les etats des pins
  testPinStates();
  
  // Phase 2 : Scanner les combinaisons
  scanCombinations();
  
  // Phase 3 : Test mode SRF05 single-pin
  testSRF05SinglePin();
  
  // Phase 4 : Monitoring continu
  continuousMonitor();
  
  // Fin
  tft.fillScreen(CLR_BG);
  drawCentered("DIAGNOSTIC", 60, 3, CLR_CYAN);
  drawCentered("TERMINE", 90, 3, CLR_CYAN);
  drawCentered("Voir port serie 115200", 140, 2, CLR_YELLOW);
  drawCentered("pour les resultats", 160, 2, CLR_YELLOW);
}

void loop() {
  // Boucle de lecture rapide pour debug
  delay(500);
  
  long r1 = testReadCm(22, 23);
  delay(30);
  long r2 = testReadCm(22, 24);
  delay(30);
  long r3 = testReadCm(24, 25);
  delay(30);
  long r4 = testReadCm(26, 28);
  delay(30);
  long r5 = testReadCm(26, 27);
  
  Serial.print(F("[LOOP] T22/E23=")); Serial.print(r1);
  Serial.print(F(" T22/E24=")); Serial.print(r2);
  Serial.print(F(" T24/E25=")); Serial.print(r3);
  Serial.print(F(" T26/E28=")); Serial.print(r4);
  Serial.print(F(" T26/E27=")); Serial.println(r5);
}
