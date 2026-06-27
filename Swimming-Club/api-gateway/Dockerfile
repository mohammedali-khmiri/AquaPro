# ── Stage 1 : Compilation (Java) ─────────────────────────────────────────────
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Téléchargement des dépendances Java via le pom.xml
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copie du code source et compilation du JAR
COPY src ./src
RUN mvn clean package -DskipTests

# ── Stage 2 : Exécution ──────────────────────────────────────────────────────
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Récupération du fichier JAR généré
COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]