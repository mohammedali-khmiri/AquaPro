# 🏊 Swimming Platform — Sport & Competition Microservice

## Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌────────────────┐      ┌────────────┐
│   Client    │─────▶│  API Gateway │─────▶│  Sport Service │─────▶│ PostgreSQL │
│ (Angular /  │      │  :8090       │      │  :8082         │      │ :5432      │
│  Postman)   │      └──────┬───────┘      └────────────────┘      └────────────┘
└─────────────┘             │
                     ┌──────┴───────┐
                     │   Keycloak   │
                     │   :8080      │
                     └──────────────┘
```

| Component       | Port  | Description                                      |
|-----------------|-------|--------------------------------------------------|
| Keycloak        | 8080  | Identity provider (OIDC, JWT, realm roles)       |
| Sport Service   | 8082  | Spring Boot microservice (REST API)              |
| API Gateway     | 8090  | Spring Cloud Gateway (routing, JWT, rate limit)  |
| PostgreSQL      | 5432  | Database for sport-service (`sport_schema`)      |

---

## Tech Stack

- **Java 17+** / **Spring Boot 3.3**
- **Spring Security** + OAuth2 Resource Server
- **Spring Data JPA** (Hibernate) + PostgreSQL
- **Flyway** for database migrations
- **Keycloak 24** for authentication & authorization
- **Spring Cloud Gateway** for API routing
- **Testcontainers** for integration testing
- **Lombok** / **SpringDoc OpenAPI 2**

---

## Entities & Relationships

```
Coach (1) ──────── (N) Swimmer
Coach (1) ──────── (N) TrainingSession
TrainingSession (N) ── (M) Swimmer
Competition (1) ── (N) Event
Event (1) ──────── (N) Registration
Swimmer (1) ────── (N) Registration
Registration (1) ─ (1) Result
```

### Entity Summary

| Entity           | Description                                           |
|------------------|-------------------------------------------------------|
| `Coach`          | First/last name, email, phone, specialization         |
| `Swimmer`        | Name, DOB, gender, level, assigned coach              |
| `TrainingSession`| Date, time, duration, location, objective, swimmers   |
| `Competition`    | Name, date, location, status (UPCOMING/IN_PROGRESS/COMPLETED) |
| `Event`          | Distance, style, age category, linked to competition  |
| `Registration`   | Links swimmer to event (unique constraint)            |
| `Result`         | Time (ms), rank, points, linked to registration       |

---

## Role-Based Access Control (RBAC)

| Role           | Permissions                                                    |
|----------------|----------------------------------------------------------------|
| `ROLE_ADMIN`   | Full CRUD on all entities                                      |
| `ROLE_COACH`   | CRUD on swimmers, sessions, registrations, results             |
| `ROLE_SWIMMER` | Read-only: own profile, competitions, events, results          |

### Endpoint Access Matrix

| Endpoint                        | GET                  | POST        | PUT           | DELETE     |
|---------------------------------|----------------------|-------------|---------------|------------|
| `/api/sport/swimmers`           | ADMIN, COACH         | ADMIN, COACH| ADMIN, COACH  | ADMIN      |
| `/api/sport/coaches`            | ADMIN, COACH         | ADMIN       | ADMIN, COACH  | ADMIN      |
| `/api/sport/training-sessions`  | ADMIN, COACH         | ADMIN, COACH| ADMIN, COACH  | ADMIN, COACH|
| `/api/sport/competitions`       | ADMIN, COACH, SWIMMER| ADMIN       | ADMIN         | ADMIN      |
| `/api/sport/events`             | ADMIN, COACH, SWIMMER| ADMIN       | ADMIN         | ADMIN      |
| `/api/sport/registrations`      | ADMIN, COACH         | ADMIN, COACH| —             | ADMIN, COACH|
| `/api/sport/results`            | ALL                  | ADMIN, COACH| ADMIN, COACH  | ADMIN      |
| `/api/sport/my/**`              | ALL (own data)       | —           | —             | —          |

---

## Quick Start (Local Development)

### Prerequisites

- Docker & Docker Compose
- Java 17+ & Maven (for local dev without Docker)
- Git

### Option 1: Docker Compose (Recommended)

```bash
# Clone and navigate
cd swimming-platform

# Start all services
docker-compose up -d

# Wait for Keycloak to be ready (~30 seconds)
# Then access:
#   Keycloak Admin:  http://localhost:8080  (admin / admin)
#   Sport Service:   http://localhost:8082/swagger-ui.html
#   API Gateway:     http://localhost:8090/api/sport/**
```

### Option 2: Run Locally (without Docker for services)

#### 1. Start PostgreSQL

```bash
docker run -d --name sport-postgres \
  -e POSTGRES_DB=sport_db \
  -e POSTGRES_USER=sport_user \
  -e POSTGRES_PASSWORD=sport_pass \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Start Keycloak

```bash
docker run -d --name sport-keycloak \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  -p 8080:8080 \
  -v $(pwd)/keycloak/swimming-platform-realm.json:/opt/keycloak/data/import/swimming-platform-realm.json \
  quay.io/keycloak/keycloak:24.0 start-dev --import-realm
```

#### 3. Start Sport Service

```bash
cd sport-service
mvn spring-boot:run
```

#### 4. Start API Gateway (optional)

```bash
cd api-gateway
mvn spring-boot:run
```

---

## Keycloak Configuration

- **Realm**: `swimming-platform`
- **Client**: `sport-client` (confidential, secret: `sport-client-secret`)
- **Test Users**:

| Username   | Password     | Role          |
|------------|-------------|---------------|
| `admin`    | `admin123`  | ROLE_ADMIN    |
| `coach1`   | `coach123`  | ROLE_COACH    |
| `swimmer1` | `swimmer123`| ROLE_SWIMMER  |

### Get an Access Token

```bash
# Admin token
curl -s -X POST http://localhost:8080/realms/swimming-platform/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=password" \
  -d "client_id=sport-client" \
  -d "client_secret=sport-client-secret" \
  -d "username=admin" \
  -d "password=admin123"
```

---

## API Examples

### Create a Coach (Admin)

```bash
curl -X POST http://localhost:8082/api/sport/coaches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ahmed",
    "lastName": "Ben Ali",
    "email": "ahmed@swimming.tn",
    "specialization": "Sprint Freestyle"
  }'
```

### Create a Swimmer (Admin/Coach)

```bash
curl -X POST http://localhost:8082/api/sport/swimmers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Yassine",
    "lastName": "Trabelsi",
    "dateOfBirth": "2002-06-15",
    "gender": "MALE",
    "email": "yassine@swimming.tn",
    "level": "ADVANCED",
    "coachId": 1
  }'
```

### Create a Competition (Admin)

```bash
curl -X POST http://localhost:8082/api/sport/competitions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Championnat National 2026",
    "competitionDate": "2026-07-15",
    "location": "Piscine Olympique de Rades",
    "status": "UPCOMING"
  }'
```

### Record a Result (Admin/Coach)

```bash
curl -X POST http://localhost:8082/api/sport/results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "registrationId": 1,
    "timeInMillis": 52340,
    "rank": 1,
    "points": 850.5
  }'
```

> See `curl-examples.sh` for a complete runnable script with all operations.

---

## Swagger / OpenAPI

Once the sport-service is running:

- **Swagger UI**: http://localhost:8082/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8082/api-docs

Click "Authorize" and paste a JWT token to test endpoints interactively.

---

## Running Tests

```bash
cd sport-service

# Unit tests only
mvn test

# Integration tests (requires Docker for Testcontainers)
mvn verify
```

Tests include:
- **Unit Tests**: `SwimmerControllerTest`, `CompetitionControllerTest` (MockMvc + `@WithMockUser`)
- **Integration Tests**: `SportServiceIntegrationTest` (Testcontainers PostgreSQL, full stack)

---

## Project Structure

```
swimming-platform/
├── docker-compose.yml              # Orchestration
├── curl-examples.sh                # cURL test script
├── README.md
│
├── keycloak/
│   └── swimming-platform-realm.json  # Realm export (roles, clients, users)
│
├── sport-service/                   # Main microservice
│   ├── pom.xml
│   ├── Dockerfile
│   └── src/
│       ├── main/
│       │   ├── java/com/swimming/sportservice/
│       │   │   ├── SportServiceApplication.java
│       │   │   ├── config/
│       │   │   │   ├── SecurityConfig.java
│       │   │   │   ├── JwtAuthConverter.java
│       │   │   │   └── OpenApiConfig.java
│       │   │   ├── entity/
│       │   │   │   ├── Coach.java
│       │   │   │   ├── Swimmer.java
│       │   │   │   ├── TrainingSession.java
│       │   │   │   ├── Competition.java
│       │   │   │   ├── Event.java
│       │   │   │   ├── Registration.java
│       │   │   │   ├── Result.java
│       │   │   │   └── enums/ (Gender, Level, CompetitionStatus, SwimmingStyle)
│       │   │   ├── repository/     # JPA repositories
│       │   │   ├── dto/            # Request/Response DTOs
│       │   │   ├── mapper/         # Entity ↔ DTO mapping
│       │   │   ├── service/        # Business logic
│       │   │   ├── controller/     # REST endpoints
│       │   │   └── exception/      # GlobalExceptionHandler
│       │   └── resources/
│       │       ├── application.yml
│       │       └── db/migration/V1__init_schema.sql
│       └── test/
│           ├── java/.../
│           │   ├── SportServiceIntegrationTest.java
│           │   └── controller/*Test.java
│           └── resources/application-test.yml
│
└── api-gateway/                     # Spring Cloud Gateway
    ├── pom.xml
    ├── Dockerfile
    └── src/main/
        ├── java/.../ApiGatewayApplication.java
        ├── java/.../config/SecurityConfig.java
        └── resources/application.yml
```

---

## Database Schema

Managed via Flyway migration `V1__init_schema.sql`. Schema: `sport_schema`.

Tables: `coach`, `swimmer`, `training_session`, `training_session_swimmer`, `competition`, `event`, `registration`, `result`

---

## License

This project is for educational purposes.
