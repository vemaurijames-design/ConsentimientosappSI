# Med&Fis — Sistema de Consentimientos Informados

Sistema fullstack para gestión digital de consentimientos informados en IPS médica.  
**React 18 + TypeScript** (frontend) · **Spring Boot 3.2.5 + PostgreSQL** (backend)

---

## Índice

1. [Arquitectura](#1-arquitectura)
2. [Requisitos previos](#2-requisitos-previos)
3. [Clonar y configurar localmente](#3-clonar-y-configurar-localmente)
4. [Base de datos PostgreSQL](#4-base-de-datos-postgresql)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Frontend — React + Vite](#6-frontend--react--vite)
7. [Plugins y configuración de IntelliJ IDEA](#7-plugins-y-configuración-de-intellij-idea)
8. [Colección Postman](#8-colección-postman)
9. [Flujo de trabajo completo](#9-flujo-de-trabajo-completo)
10. [Roles y permisos](#10-roles-y-permisos)
11. [Endpoints de la API](#11-endpoints-de-la-api)
12. [WebSocket — Notificaciones en tiempo real](#12-websocket--notificaciones-en-tiempo-real)
13. [Cuentas de prueba](#13-cuentas-de-prueba)
14. [Tipos de consentimiento](#14-tipos-de-consentimiento)

---

## 1. Arquitectura

```
medfis/
├── src/                        # Frontend React
│   ├── app/App.tsx             # Aplicación completa (SPA)
│   └── styles/                 # Tokens Tailwind + fuentes
├── backend/                    # Spring Boot
│   ├── src/main/java/com/medfis/
│   │   ├── config/             # SecurityConfig, WebSocketConfig
│   │   ├── controller/         # REST Controllers
│   │   ├── dto/                # Request/Response DTOs
│   │   ├── entity/             # JPA Entities + enums
│   │   ├── repository/         # Spring Data JPA repos
│   │   ├── security/           # JWT Filter + UserDetailsService
│   │   └── service/            # Lógica de negocio
│   └── src/main/resources/
│       ├── application.properties
│       ├── schema.sql           # DDL tablas
│       └── data.sql             # Seed usuarios iniciales
├── postman/
│   └── MedFis_Collection.json  # Colección completa Postman
└── README.md
```

### Stack completo

| Capa | Tecnología |
|------|-----------|
| Frontend SPA | React 18, TypeScript, Tailwind CSS, Vite |
| Gráficas | Recharts |
| Íconos | lucide-react |
| Animaciones | motion/react |
| Backend | Spring Boot 3.2.5, Java 17 |
| Seguridad | Spring Security + JWT (jjwt 0.11.5) |
| ORM | Spring Data JPA + Hibernate |
| Base de datos | PostgreSQL 15+ |
| Tiempo real | WebSocket STOMP (SockJS) |
| Build tool | Maven 3.9+ |

---

## 2. Requisitos previos

### Software obligatorio

| Herramienta | Versión mínima | Instalación |
|-------------|---------------|-------------|
| **Java JDK** | 17 LTS | https://adoptium.net |
| **Maven** | 3.9 | https://maven.apache.org o via IntelliJ |
| **Node.js** | 18 LTS | https://nodejs.org |
| **pnpm** | 8+ | `npm install -g pnpm` |
| **PostgreSQL** | 15 | https://www.postgresql.org/download |
| **Git** | 2.40+ | https://git-scm.com |
| **IntelliJ IDEA** | 2023.3+ | Community o Ultimate |
| **Postman** | Cualquiera | https://www.postman.com/downloads |

---

## 3. Clonar y configurar localmente

```bash
# 1. Clonar el repositorio
git clone https://github.com/TU_USUARIO/medfis.git
cd medfis

# 2. Copiar variables de entorno del frontend
cp .env.example .env

# 3. Instalar dependencias frontend
pnpm install
```

`.env.example` contiene:
```env
VITE_API_URL=http://localhost:8080/api
```

---

## 4. Base de datos PostgreSQL

### Crear la base de datos

```sql
-- Conectarse a PostgreSQL como superusuario
-- En Windows: pgAdmin → Query Tool
-- En Mac/Linux: psql -U postgres

CREATE USER medfis_user WITH PASSWORD 'medfis_pass';
CREATE DATABASE medfis_db OWNER medfis_user;
GRANT ALL PRIVILEGES ON DATABASE medfis_db TO medfis_user;
```

### Verificar conexión

```bash
psql -U medfis_user -d medfis_db -h localhost
# Password: medfis_pass
```

> **Nota:** Spring Boot ejecuta automáticamente `schema.sql` y `data.sql`  
> la primera vez que levanta, creando tablas y usuarios de prueba.

### Tablas creadas automáticamente

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Personal del sistema |
| `consentimientos` | Consentimientos con columna JSONB para datos flexibles |
| `notificaciones` | Alertas por rol de usuario |

---

## 5. Backend — Spring Boot

### Iniciar el backend

```bash
cd backend

# Opción A — Maven Wrapper
./mvnw spring-boot:run          # Mac/Linux
mvnw.cmd spring-boot:run        # Windows

# Opción B — Maven instalado globalmente
mvn spring-boot:run

# Opción C — Build y luego ejecutar JAR
mvn clean package -DskipTests
java -jar target/medfis-*.jar
```

El backend inicia en: **http://localhost:8080**

### Verificar que funciona

```bash
curl http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@medfis.com","password":"admin123"}'
```

Respuesta esperada:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "nombre": "Administrador Med&Fis",
  "email": "admin@medfis.com",
  "rol": "ADMINISTRADOR"
}
```

### Variables de configuración (`application.properties`)

```properties
server.port=8080
spring.datasource.url=jdbc:postgresql://localhost:5432/medfis_db
spring.datasource.username=medfis_user
spring.datasource.password=medfis_pass
spring.jpa.hibernate.ddl-auto=update
jwt.secret=MedFis2024SecretKeyParaJWTMustBe256BitsLongAtLeast32Chars!
jwt.expiration=86400000
cors.allowed-origins=http://localhost:5173,http://localhost:3000
```

---

## 6. Frontend — React + Vite

### Iniciar el frontend

```bash
# Desde la raíz del proyecto
pnpm dev
```

El frontend inicia en: **http://localhost:5173**

### Build de producción

```bash
pnpm build       # genera dist/
pnpm preview     # sirve el build localmente
```

---

## 7. Plugins y configuración de IntelliJ IDEA

### Plugins obligatorios

Ir a: **File → Settings → Plugins → Marketplace**

| Plugin | Para qué sirve |
|--------|---------------|
| **Spring Boot** (incluido en Ultimate) | Run/Debug Spring, Properties autocompletado |
| **Lombok** | Soporte anotaciones @Data, @Builder, @Slf4j |
| **Maven** (incluido) | Gestión de dependencias |
| **Database Tools** (Ultimate) o **Database Navigator** (Community) | Gestionar PostgreSQL visualmente |
| **EnvFile** | Cargar .env en Run Configurations |
| **Prettier** | Formato automático TS/TSX |
| **Node.js** | Soporte JavaScript/TypeScript integrado |

> **IntelliJ IDEA Community** es suficiente para el backend Spring Boot.  
> Para el frontend React, WebStorm o VS Code funcionan mejor.

### Configurar el proyecto en IntelliJ

**1. Abrir el proyecto backend:**
```
File → Open → seleccionar carpeta backend/
```
IntelliJ detecta el `pom.xml` automáticamente.

**2. Configurar el JDK:**
```
File → Project Structure → Project → SDK → Java 17
```

**3. Configurar Annotation Processing (Lombok):**
```
File → Settings → Build, Execution, Deployment
  → Compiler → Annotation Processors
  ✅ Enable annotation processing
```

**4. Crear Run Configuration para Spring Boot:**
```
Run → Edit Configurations → (+) Spring Boot
  Main class: com.medfis.MedfisApplication
  Environment variables: (opcional, ya están en application.properties)
  Working directory: $MODULE_WORKING_DIR$
```

**5. Conectar PostgreSQL (Database panel):**
```
View → Tool Windows → Database → (+) → Data Source → PostgreSQL
  Host: localhost
  Port: 5432
  Database: medfis_db
  User: medfis_user
  Password: medfis_pass
→ Test Connection → OK
```

**6. Abrir el frontend en IntelliJ (opcional):**
```
File → Open → carpeta raíz del proyecto (donde está package.json)
→ IntelliJ reconoce Node.js / TypeScript
```

Para ejecutar frontend desde IntelliJ:
```
View → Tool Windows → Terminal
→ pnpm dev
```

---

## 8. Colección Postman

### Importar la colección

1. Abrir **Postman**
2. **Import** → **File** → seleccionar `postman/MedFis_Collection.json`
3. La colección `Med&Fis — API Completa v2` aparece con 4 carpetas:
   - 🔐 AUTH
   - 👥 USUARIOS
   - 📋 CONSENTIMIENTOS
   - 🔔 NOTIFICACIONES

### Variables de colección

| Variable | Descripción |
|----------|-------------|
| `base_url` | `http://localhost:8080/api` |
| `token` | JWT — se captura automáticamente al hacer Login |
| `consent_id` | ID del último consentimiento creado |
| `user_id` | ID del último usuario creado |
| `notif_id` | ID de la primera notificación encontrada |

> Los tokens y IDs se capturan automáticamente con scripts `pm.collectionVariables.set()`.  
> No necesitas copiar/pegar manualmente entre requests.

### Flujo de prueba recomendado en Postman

```
1. AUTH → Login — Auxiliar          (guarda token de auxiliar)
2. CONSENTIMIENTOS → Crear Escleroterapia  (guarda consent_id)
3. NOTIFICACIONES → GET (con token auxiliar → vacío para auxiliar)
4. AUTH → Login — Médico            (nuevo token, médico)
5. NOTIFICACIONES → GET             (ve la notificación de nuevo consentimiento)
6. CONSENTIMIENTOS → Visto Bueno Médico   (aprueba consent_id)
7. AUTH → Login — Auxiliar          (vuelve a auxiliar)
8. NOTIFICACIONES → GET             (ve notificación de aprobación)
```

---

## 9. Flujo de trabajo completo

### Flujo: Auxiliar crea → Médico aprueba

```
Auxiliar                    Sistema                     Médico
   │                           │                           │
   ├─ Login ──────────────────►│                           │
   │                           │                           │
   ├─ Registra paciente        │                           │
   ├─ Toma vitales             │                           │
   ├─ Firma paciente ─────────►│                           │
   │                           ├─ Crea consentimiento      │
   │                           │  Estado: FIRMADO          │
   │                           ├─ Notif → MÉDICO ─────────►│
   │                           ├─ Notif → ADMINISTRADOR    │
   │                           │                           │
   │                           │    ◄── Recibe notificación┤
   │                           │    ◄── Revisa consentimient┤
   │                           │    ◄── Da Visto Bueno ────┤
   │                           │                           │
   │                           ├─ Estado: APROBADO         │
   │                           ├─ Notif → TODOS ──────────►│
   │◄─ Notif: aprobado ────────┤                           │
```

### Estados de un consentimiento

```
PENDIENTE → FIRMADO → APROBADO
                   ↘ RECHAZADO
                   ↘ ANULADO
```

---

## 10. Roles y permisos

| Acción | MÉDICO | ADMINISTRADOR | AUXILIAR | ENFERMERA | TÉCNICO |
|--------|--------|--------------|----------|-----------|---------|
| Crear consentimiento | ✅ | ✅ | ✅ | ✅ | ✅ |
| Ver historial | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dar Visto Bueno | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rechazar consentimiento | ✅ | ❌ | ❌ | ❌ | ❌ |
| Anular consentimiento | ✅ | ✅ | ❌ | ❌ | ❌ |
| Agregar personal (staff) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Configurar IPS | ❌ | ✅ | ❌ | ❌ | ❌ |
| Ver estadísticas | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 11. Endpoints de la API

Base URL: `http://localhost:8080/api`

### Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Login → JWT |
| POST | `/auth/logout` | ✅ | Logout (invalida sesión) |
| GET | `/auth/me` | ✅ | Perfil del usuario actual |

### Usuarios (solo ADMINISTRADOR)

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/usuarios` | ✅ | Listar todo el personal |
| POST | `/usuarios` | ✅ ADMIN | Crear nuevo usuario |
| PUT | `/usuarios/{id}` | ✅ ADMIN | Actualizar usuario |
| PATCH | `/usuarios/{id}/toggle` | ✅ ADMIN | Activar/desactivar |

### Consentimientos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/consentimientos` | ✅ | Listar todos |
| GET | `/consentimientos?q=texto` | ✅ | Buscar por nombre/doc/radicado |
| GET | `/consentimientos/{id}` | ✅ | Detalle completo |
| POST | `/consentimientos` | ✅ | Crear nuevo |
| POST | `/consentimientos/{id}/aprobar` | ✅ MÉDICO | Dar Visto Bueno |
| POST | `/consentimientos/{id}/rechazar` | ✅ MÉDICO | Rechazar con motivo |
| PATCH | `/consentimientos/{id}/anular` | ✅ | Anular |
| GET | `/consentimientos/pendientes` | ✅ | Cola de pendientes para médico |
| GET | `/consentimientos/estadisticas` | ✅ | Métricas del dashboard |

### Notificaciones

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/notificaciones` | ✅ | Mis notificaciones (filtradas por rol) |
| GET | `/notificaciones/count` | ✅ | Cantidad no leídas |
| PATCH | `/notificaciones/{id}/leer` | ✅ | Marcar una como leída |
| PATCH | `/notificaciones/leer-todas` | ✅ | Marcar todas como leídas |
| DELETE | `/notificaciones/{id}` | ✅ | Eliminar notificación |

---

## 12. WebSocket — Notificaciones en tiempo real

El backend emite notificaciones a través de WebSocket STOMP.

### Endpoint de conexión

```
ws://localhost:8080/ws/notificaciones
```

### Tópicos disponibles

| Tópico | Descripción |
|--------|-------------|
| `/topic/notificaciones/medico` | Solo para MÉDICO |
| `/topic/notificaciones/administrador` | Solo para ADMINISTRADOR |
| `/topic/notificaciones/todos` | Todos los roles |

### Ejemplo de conexión desde JavaScript

```javascript
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const client = new Client({
  webSocketFactory: () => new SockJS('http://localhost:8080/ws/notificaciones'),
  connectHeaders: { Authorization: `Bearer ${token}` },
  onConnect: () => {
    client.subscribe('/topic/notificaciones/medico', (msg) => {
      const notif = JSON.parse(msg.body);
      console.log('Nueva notificación para médico:', notif);
    });
  }
});
client.activate();
```

### Cuándo se emiten notificaciones

| Evento | Destino |
|--------|---------|
| Auxiliar/Enfermera guarda consentimiento firmado | `/topic/notificaciones/medico` + `/administrador` |
| Médico aprueba (Visto Bueno) | `/topic/notificaciones/todos` |
| Médico rechaza | `/topic/notificaciones/todos` |

---

## 13. Cuentas de prueba

Creadas automáticamente con `data.sql` al primer inicio:

| Email | Contraseña | Rol |
|-------|-----------|-----|
| `rafael.marrero@medfis.com` | `medico123` | MÉDICO |
| `admin@medfis.com` | `admin123` | ADMINISTRADOR |
| `auxiliar@medfis.com` | `auxiliar123` | AUXILIAR |

> El ADMINISTRADOR puede crear más usuarios desde el panel **Gestión de Personal**.

---

## 14. Tipos de consentimiento

| Tipo | Código | Radicado | Pasos |
|------|--------|----------|-------|
| Escleroterapia | `escleroterapia` | `ESC-YYYY-XXXX` | 5 |
| Sueroterapia | `sueroterapia` | `SUE-YYYY-XXXX` | 5 |
| Láser ND:YAG | `laser` | `LAS-YYYY-XXXX` | 5 |
| Paquete Completo | `paquete` | `PAQ-YYYY-XXXX` | 7 |

### Paquete Completo — Pasos del wizard

1. Datos del Paciente + Contacto de Emergencia
2. Signos Vitales + Cuestionario Escleroterapia (13 preguntas)
3. Prescripción Sueroterapia + Lotes + Parámetros Láser
4. Lectura Consentimiento Escleroterapia (scroll obligatorio)
5. Lectura Consentimiento Sueroterapia (scroll obligatorio)
6. Lectura Consentimiento Láser ND:YAG (scroll obligatorio)
7. Firma Digital del Paciente (Canvas API — touch + mouse)

---

## Variables de entorno para producción

```env
# Frontend (.env)
VITE_API_URL=https://api.tudominio.com/api

# Backend (application-prod.properties)
spring.datasource.url=jdbc:postgresql://DB_HOST:5432/medfis_db
spring.datasource.username=medfis_user
spring.datasource.password=CONTRASEÑA_SEGURA
jwt.secret=CLAVE_ALEATORIA_MIN_32_CARACTERES_PRODUCCION
cors.allowed-origins=https://tudominio.com
```

---

## Comandos de desarrollo rápido

```bash
# Levantar todo localmente (en 3 terminales)

# Terminal 1 — PostgreSQL (si no está como servicio)
pg_ctl start

# Terminal 2 — Backend
cd backend && ./mvnw spring-boot:run

# Terminal 3 — Frontend
pnpm dev

# URLs
# Frontend:  http://localhost:5173
# Backend:   http://localhost:8080
# Swagger:   http://localhost:8080/swagger-ui.html (si se añade springdoc)
```

---

**Med&Fis** · Sistema de Consentimientos Informados · Colombia  
Desarrollado con Spring Boot 3.2.5 + React 18 + PostgreSQL 15
