/*
 * ============================================================
 *  AquaPro IoT — Arduino Mega 2560
 *  Affichage PLEIN ECRAN + Capteurs HY-SRF05 + Servos
 * ============================================================
 *
 * Materiel :
 *   - 2x capteurs HY-SRF05 (mode 4 broches)
 *   - 2x micro-servo SG90
 *   - 1x shield 2.4" TFT LCD (ILI9341 / ILI9481 / etc.)
 *
 * Brochage :
 *   Capteur 1  -> TRIG=22, ECHO=24, VCC=Plaque Jaune (5V)
 *   Capteur 2  -> TRIG=26, ECHO=28, VCC=Plaque Jaune (5V)
 *   GND        -> GND de l'Arduino (en bas de la rangée 22-53)
 *   Servo 1    -> Signal=44  (hors bus TFT D2-D9)
 *   Servo 2    -> Signal=45  (hors bus TFT D2-D9)
 *   TFT Shield -> branche directement sur le Mega
 *                 Bus donnees D2-D9 | CS=A3, CD=A2, WR=A1, RD=A0, RST=A4
 *
 * Librairies requises :
 *   - MCUFRIEND_kbv   (David Prentice)
 *   - Adafruit_GFX    (Adafruit)
 *   - Servo           (incluse par defaut)
 *
 * Communication serie (115200 baud) :
 *   Sortie -> JSON toutes les 200 ms
 *   Entree -> commandes: DOOR1_OPEN, DOOR1_CLOSE, DOOR2_OPEN, DOOR2_CLOSE, RESET
 */

#include <Servo.h>
#include <Adafruit_GFX.h>
#include <MCUFRIEND_kbv.h>

// ── Couleurs 16 bits (RGB565) ─────────────────────────────────────────────
#define CLR_BG       0x0000  // Noir
#define CLR_POOL     0x065F  // Bleu piscine
#define CLR_CYAN     0x07FF
#define CLR_GREEN    0x07E0
#define CLR_RED      0xF800
#define CLR_AMBER    0xFD20
#define CLR_WHITE    0xFFFF
#define CLR_GRAY     0x7BEF
#define CLR_DARKGRAY 0x39E7
#define CLR_GOLD     0xFEA0
#define CLR_YELLOW   0xFFE0
#define CLR_ORANGE   0xFC00
#define CLR_DARKBLUE 0x000F

// ── Pins capteurs & servos ────────────────────────────────────────────────
#define TRIG1       22
#define ECHO1       24
#define TRIG2       26
#define ECHO2       28
#define SERVO1_PIN  44
#define SERVO2_PIN  45

// ── Reglages ──────────────────────────────────────────────────────────────
#define DETECT_CM   150       // Seuil de detection (cm) (Augmenté pour tester le capteur)
#define SEND_MS     200       // Intervalle envoi serie (ms)
#define SERVO_OPEN   90
#define SERVO_CLOSE   0
#define NUM_SAMPLES   3       // Nombre de lectures capteur pour la moyenne

// ── Objets ────────────────────────────────────────────────────────────────
Servo servo1, servo2;
MCUFRIEND_kbv tft;

// ── Etat ──────────────────────────────────────────────────────────────────
bool door1Open     = false;
bool door2Open     = false;
bool prev_w1       = false;
bool prev_w2       = false;
byte firstDetected = 0;       // 0=aucun, 1=couloir gauche, 2=couloir droit
unsigned long lastSend = 0;

// Race state
enum RaceState { RACE_WAITING, RACE_RACING, RACE_FINISHED };
RaceState raceState = RACE_WAITING;
unsigned long raceStartTime = 0;
unsigned long raceEndTime   = 0;

// Ecran courant pour eviter de tout redessiner
enum ScreenMode { SCREEN_WAITING, SCREEN_RACING, SCREEN_WINNER };
ScreenMode currentScreen = SCREEN_WAITING;

// Valeurs precedentes pour rafraichissement partiel
long  prev_d1 = -1, prev_d2 = -1;
bool  prev_door1_disp = false, prev_door2_disp = false;
byte  prev_first_disp = 255;
unsigned long prevDisplayedTime = 0;

// Dimensions ecran (remplies apres tft.begin)
int16_t W, H;

// ── Mesure HY-SRF05 (Lecture simple) ───────────────────────────────────────
long readCm(uint8_t trig, uint8_t echo) {
  digitalWrite(trig, LOW);
  delayMicroseconds(5);
  digitalWrite(trig, HIGH);
  delayMicroseconds(15);
  digitalWrite(trig, LOW);

  // Timeout 50ms (environ 850cm max)
  long dur = pulseIn(echo, HIGH, 50000UL);  
  
  if (dur == 0) return 999;
  
  long cm = dur * 17L / 1000L;
  if (cm <= 0 || cm > 600) return 999;
  
  return cm;
}

// ── Dessiner un rectangle arrondi rempli ──────────────────────────────────
void drawRoundBox(int x, int y, int w, int h, int r, uint16_t fillCol, uint16_t borderCol) {
  tft.fillRoundRect(x, y, w, h, r, fillCol);
  tft.drawRoundRect(x, y, w, h, r, borderCol);
}

// ── Centrer du texte horizontalement ──────────────────────────────────────
void drawCenteredText(const char* text, int y, uint8_t sz, uint16_t col) {
  tft.setTextSize(sz);
  tft.setTextColor(col);
  int16_t x1, y1;
  uint16_t tw, th;
  tft.getTextBounds(text, 0, 0, &x1, &y1, &tw, &th);
  tft.setCursor((W - tw) / 2, y);
  tft.print(text);
}

// ── Ecran: En Attente ─────────────────────────────────────────────────────
void drawWaitingScreen() {
  tft.fillScreen(CLR_BG);
  currentScreen = SCREEN_WAITING;
  prev_d1 = -1; prev_d2 = -1;
  prev_w1 = false; prev_w2 = false;

  // Bande titre en haut
  tft.fillRect(0, 0, W, 40, CLR_POOL);
  drawCenteredText("AQUAPRO IoT", 10, 3, CLR_WHITE);

  // Ligne decorative
  tft.drawFastHLine(0, 42, W, CLR_CYAN);
  tft.drawFastHLine(0, 43, W, CLR_CYAN);

  // Zone statut central
  drawRoundBox(20, 60, W - 40, 80, 8, CLR_DARKGRAY, CLR_POOL);
  drawCenteredText("EN ATTENTE", 75, 3, CLR_CYAN);
  drawCenteredText("Pret a detecter...", 110, 2, CLR_WHITE);

  // Labels capteurs
  tft.drawFastHLine(0, 155, W, CLR_DARKGRAY);
  tft.setTextSize(2);
  tft.setTextColor(CLR_POOL);
  tft.setCursor(10, 165);
  tft.print("C1:");
  tft.setCursor(W / 2 + 10, 165);
  tft.print("C2:");

  // Zone portes
  tft.drawFastHLine(0, 200, W, CLR_DARKGRAY);
  tft.setTextSize(1);
  tft.setTextColor(CLR_GRAY);
  tft.setCursor(10, 210);
  tft.print("Porte 1:");
  tft.setCursor(W / 2 + 10, 210);
  tft.print("Porte 2:");
}

// ── Ecran: Course en cours ────────────────────────────────────────────────
void drawRacingScreen() {
  tft.fillScreen(CLR_BG);
  currentScreen = SCREEN_RACING;
  prevDisplayedTime = 0;

  // Fond vert en haut
  tft.fillRect(0, 0, W, 50, CLR_GREEN);
  drawCenteredText("GO !", 5, 5, CLR_WHITE);

  // Zone chrono
  drawRoundBox(10, 65, W - 20, 70, 8, 0x0841, CLR_GREEN);
  drawCenteredText("00:00.0", 80, 4, CLR_YELLOW);

  // Labels capteurs
  tft.drawFastHLine(0, 150, W, CLR_DARKGRAY);

  tft.setTextSize(2);
  tft.setTextColor(CLR_POOL);
  tft.setCursor(10, 160);
  tft.print("C1:");
  tft.setCursor(W / 2 + 10, 160);
  tft.print("C2:");

  // Indicateurs detection
  tft.setTextSize(1);
  tft.setTextColor(CLR_GRAY);
  tft.setCursor(10, 195);
  tft.print("Seuil: ");
  tft.print(DETECT_CM);
  tft.print(" cm");
}

// ── Ecran: Gagnant ────────────────────────────────────────────────────────
void drawWinnerScreen(byte lane, unsigned long timeMs) {
  tft.fillScreen(CLR_BG);
  currentScreen = SCREEN_WINNER;

  // Fond dore en haut
  tft.fillRect(0, 0, W, 55, CLR_GOLD);
  drawCenteredText("GAGNANT !", 8, 4, CLR_BG);

  // Zone couloir gagnant
  drawRoundBox(15, 70, W - 30, 60, 10, CLR_RED, CLR_GOLD);
  if (lane == 1) {
    drawCenteredText("COULOIR", 75, 2, CLR_WHITE);
    drawCenteredText("GAUCHE", 95, 3, CLR_YELLOW);
  } else {
    drawCenteredText("COULOIR", 75, 2, CLR_WHITE);
    drawCenteredText("DROIT", 95, 3, CLR_YELLOW);
  }

  // Zone chrono final
  drawRoundBox(15, 145, W - 30, 55, 8, 0x0841, CLR_GOLD);

  // Formatter le temps
  unsigned long secs = timeMs / 1000;
  unsigned long deciSecs = (timeMs % 1000) / 100;
  unsigned long mins = secs / 60;
  secs = secs % 60;

  char timeBuf[16];
  sprintf(timeBuf, "%02lu:%02lu.%lu", mins, secs, deciSecs);
  drawCenteredText(timeBuf, 155, 4, CLR_YELLOW);

  tft.setTextSize(1);
  tft.setTextColor(CLR_GRAY);
  int16_t x1, y1;
  uint16_t tw, th;
  tft.getTextBounds("secondes", 0, 0, &x1, &y1, &tw, &th);
  tft.setCursor((W - tw) / 2, 185);
  tft.print("secondes");

  // Instruction Reset
  drawRoundBox(30, 215, W - 60, 20, 4, CLR_DARKGRAY, CLR_GRAY);
  drawCenteredText("RESET pour rejouer", 219, 1, CLR_WHITE);
}

// ── Mise a jour partielle: distances ──────────────────────────────────────
void updateSensorValues(long d1, long d2, bool w1, bool w2) {
  int yPos;
  if (currentScreen == SCREEN_WAITING) yPos = 165;
  else if (currentScreen == SCREEN_RACING) yPos = 160;
  else return;

  // Couloir 1 - valeur
  if (d1 != prev_d1 || w1 != prev_w1) {
    tft.fillRect(50, yPos, 70, 20, CLR_BG);
    tft.setTextSize(2);
    tft.setTextColor(w1 ? CLR_RED : CLR_WHITE);
    tft.setCursor(50, yPos);
    if (d1 >= 999) tft.print("---");
    else { tft.print(d1); tft.print("cm"); }
    prev_d1 = d1;
  }

  // Badge detection 1
  if (w1 != prev_w1) {
    int badgeX = 10;
    int badgeY = yPos + 22;
    tft.fillRoundRect(badgeX, badgeY, 90, 14, 3, w1 ? CLR_RED : CLR_GREEN);
    tft.setTextSize(1);
    tft.setTextColor(CLR_WHITE);
    tft.setCursor(badgeX + 8, badgeY + 3);
    tft.print(w1 ? "DETECTE!" : "  LIBRE ");
    prev_w1 = w1;
  }

  // Couloir 2 - valeur
  if (d2 != prev_d2 || w2 != prev_w2) {
    tft.fillRect(W / 2 + 50, yPos, 70, 20, CLR_BG);
    tft.setTextSize(2);
    tft.setTextColor(w2 ? CLR_RED : CLR_WHITE);
    tft.setCursor(W / 2 + 50, yPos);
    if (d2 >= 999) tft.print("---");
    else { tft.print(d2); tft.print("cm"); }
    prev_d2 = d2;
  }

  // Badge detection 2
  if (w2 != prev_w2) {
    int badgeX = W / 2 + 10;
    int badgeY = yPos + 22;
    tft.fillRoundRect(badgeX, badgeY, 90, 14, 3, w2 ? CLR_RED : CLR_GREEN);
    tft.setTextSize(1);
    tft.setTextColor(CLR_WHITE);
    tft.setCursor(badgeX + 8, badgeY + 3);
    tft.print(w2 ? "DETECTE!" : "  LIBRE ");
    prev_w2 = w2;
  }
}

// ── Mise a jour chrono pendant la course ──────────────────────────────────
void updateRaceTimer() {
  if (currentScreen != SCREEN_RACING) return;

  unsigned long elapsed = millis() - raceStartTime;
  unsigned long displaySecs = elapsed / 1000;

  // Rafraichir seulement toutes les 100ms
  if (elapsed / 100 == prevDisplayedTime / 100) return;
  prevDisplayedTime = elapsed;

  unsigned long secs = elapsed / 1000;
  unsigned long deciSecs = (elapsed % 1000) / 100;
  unsigned long mins = secs / 60;
  secs = secs % 60;

  char timeBuf[16];
  sprintf(timeBuf, "%02lu:%02lu.%lu", mins, secs, deciSecs);

  // Effacer zone chrono et reafficher
  tft.fillRect(15, 78, W - 30, 40, 0x0841);
  drawCenteredText(timeBuf, 80, 4, CLR_YELLOW);
}

// ── Mise a jour badges portes ─────────────────────────────────────────────
void updateDoorBadges() {
  if (currentScreen != SCREEN_WAITING) return;

  if (door1Open != prev_door1_disp) {
    tft.fillRoundRect(80, 207, 60, 16, 3, door1Open ? CLR_GREEN : CLR_DARKGRAY);
    tft.setTextSize(1);
    tft.setTextColor(CLR_WHITE);
    tft.setCursor(86, 211);
    tft.print(door1Open ? "OUVERT" : "FERME ");
    prev_door1_disp = door1Open;
  }

  if (door2Open != prev_door2_disp) {
    tft.fillRoundRect(W / 2 + 80, 207, 60, 16, 3, door2Open ? CLR_GREEN : CLR_DARKGRAY);
    tft.setTextSize(1);
    tft.setTextColor(CLR_WHITE);
    tft.setCursor(W / 2 + 86, 211);
    tft.print(door2Open ? "OUVERT" : "FERME ");
    prev_door2_disp = door2Open;
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);   // Meme baud rate que le service Angular

  // Capteurs
  pinMode(TRIG1, OUTPUT); pinMode(ECHO1, INPUT);
  pinMode(TRIG2, OUTPUT); pinMode(ECHO2, INPUT);

  // Etat initial trigger LOW
  digitalWrite(TRIG1, LOW);
  digitalWrite(TRIG2, LOW);

  // Servos (Attachés en permanence comme demandé)
  servo1.attach(SERVO1_PIN); servo1.write(SERVO_CLOSE);
  servo2.attach(SERVO2_PIN); servo2.write(SERVO_CLOSE);

  // TFT LCD - detection auto du driver
  uint16_t id = tft.readID();
  if (id == 0xD3D3) id = 0x9481;   // fallback driver commun
  tft.begin(id);
  tft.setRotation(1);   // Paysage (landscape) pour plein ecran
  W = tft.width();       // 320
  H = tft.height();      // 240

  // Test capteur au demarrage
  raceStartTime = millis();
  drawWaitingScreen();

  // Test rapide des capteurs et affichage du resultat
  delay(100);
  long test1 = readCm(TRIG1, ECHO1);
  delay(50);
  long test2 = readCm(TRIG2, ECHO2);

  tft.setTextSize(1);
  tft.setTextColor(CLR_GRAY);
  tft.setCursor(10, H - 12);
  tft.print("Test C1=");
  tft.print(test1);
  tft.print("cm  C2=");
  tft.print(test2);
  tft.print("cm  Baud=115200");

  Serial.println(F("{\"status\":\"ready\"}"));
  Serial.print(F("{\"debug\":\"Sensor test: C1="));
  Serial.print(test1);
  Serial.print(F("cm, C2="));
  Serial.print(test2);
  Serial.println(F("cm\"}"));
}

// ── Loop ──────────────────────────────────────────────────────────────────
void loop() {

  // ── Lecture commandes entrantes ────────────────────────────────────────
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();

    if (cmd == "DOOR1_OPEN")  { servo1.write(SERVO_OPEN);  door1Open  = true;  }
    if (cmd == "DOOR1_CLOSE") { servo1.write(SERVO_CLOSE); door1Open  = false; }
    if (cmd == "DOOR2_OPEN")  { servo2.write(SERVO_OPEN);  door2Open  = true;  }
    if (cmd == "DOOR2_CLOSE") { servo2.write(SERVO_CLOSE); door2Open  = false; }
    if (cmd == "RESET") {
      firstDetected = 0;
      raceState = RACE_WAITING;
      raceStartTime = millis();
      raceEndTime = 0;
      prev_first_disp = 255;
      prev_d1 = -1; prev_d2 = -1;
      prev_w1 = false; prev_w2 = false;
      drawWaitingScreen();
    }
  }

  // ── Mise a jour chrono pendant la course ──────────────────────────────
  if (raceState == RACE_RACING) {
    updateRaceTimer();
  }

  // ── Lecture capteurs & envoi JSON a intervalle regulier ────────────────
  long d1 = readCm(TRIG1, ECHO1);
  delay(60);    // Pause OBLIGATOIRE de 60ms entre les deux capteurs
  long d2 = readCm(TRIG2, ECHO2);
  bool w1 = (d1 > 0 && d1 < DETECT_CM);
  bool w2 = (d2 > 0 && d2 < DETECT_CM);

    // ── Logique de course (Premier arrivé gagne !) ──────────────────────
    if (raceState == RACE_WAITING) {
      // Le premier capteur qui s'active désigne le gagnant immédiatement
      if (w1) {
        firstDetected = 1;
        raceState = RACE_FINISHED;
        raceEndTime = millis() - raceStartTime;
        drawWinnerScreen(1, raceEndTime);
      }
      else if (w2) {
        firstDetected = 2;
        raceState = RACE_FINISHED;
        raceEndTime = millis() - raceStartTime;
        drawWinnerScreen(2, raceEndTime);
      }
    }

    // ── Mise a jour affichage partiel ────────────────────────────────────
    updateSensorValues(d1, d2, w1, w2);
    updateDoorBadges();
    prev_w1 = w1;
    prev_w2 = w2;

    // ── Envoi JSON serie -> Angular ─────────────────────────────────────
    const char* raceStr = "waiting";
    unsigned long raceTime = 0;

    if (raceState == RACE_RACING) {
      raceStr = "racing";
      raceTime = millis() - raceStartTime;
    } else if (raceState == RACE_FINISHED) {
      raceStr = "finished";
      raceTime = raceEndTime;
    }

    Serial.print(F("{\"s1\":")); Serial.print(d1);
    Serial.print(F(",\"s2\":")); Serial.print(d2);
    Serial.print(F(",\"w1\":")); Serial.print(w1 ? F("true") : F("false"));
    Serial.print(F(",\"w2\":")); Serial.print(w2 ? F("true") : F("false"));
    Serial.print(F(",\"d1\":\"")); Serial.print(door1Open ? F("open") : F("closed"));
    Serial.print(F("\",\"d2\":\"")); Serial.print(door2Open ? F("open") : F("closed"));
    Serial.print(F("\",\"first\":")); Serial.print(firstDetected);
    Serial.print(F(",\"race\":\"")); Serial.print(raceStr);
    Serial.print(F("\",\"time\":")); Serial.print(raceTime);
    Serial.println(F("}"));

    // Fin du cycle, on attend un peu (exactement comme test_simple.ino)
    delay(140);
}
