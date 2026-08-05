# Med&Fis — Sistema de Consentimientos Informados

Desarrollado por **JM Ingeniero** · Todos los derechos reservados

---

## Requisitos previos

| Herramienta | Versión mínima | Descarga |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| pnpm | 8+ | `npm install -g pnpm` |
| Java JDK | 17 | https://adoptium.net |
| Maven | 3.8+ | https://maven.apache.org |
| PostgreSQL | 14+ | https://www.postgresql.org |

---

## 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/medfis-consentimientos.git
cd medfis-consentimientos
```

---

## 2. Configurar la base de datos (PostgreSQL)

```sql
-- Ejecutar en psql o pgAdmin:
CREATE DATABASE medfis_db;
CREATE USER medfis_user WITH PASSWORD 'medfis_pass';
GRANT ALL PRIVILEGES ON DATABASE medfis_db TO medfis_user;
```

---

## 3. Backend — Spring Boot

```bash
cd backend
mvn spring-boot:run
```

Al arrancar por primera vez crea automáticamente:
- Tablas (Hibernate DDL auto)
- Usuario administrador: `medfissaludintensa@gmail.com` / `admin123456`

Verifica: `http://localhost:8080/api/auth/login`

---

## 4. Frontend — React + Vite

### Windows (PowerShell)

```powershell
cd ..
# Limpiar e instalar (necesario en Windows por binarios nativos)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
pnpm install
pnpm dev
```

Si aparece error `lightningcss.win32-x64-msvc.node`:
```powershell
pnpm add -D lightningcss-win32-x64-msvc @rollup/rollup-win32-x64-msvc
pnpm dev
```

### Linux / Mac

```bash
cd ..
pnpm install
pnpm dev
```

Abre: `http://localhost:5173`

---

## 5. Variables de entorno (opcional — para email y almacenamiento nube)

Crea el archivo `.env.local` en la raíz del proyecto (NO va a GitHub):

```env
VITE_API_URL=http://localhost:8080/api
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_SUPABASE_BUCKET=consentimientos
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=XXXXXXXXXXXXXX
VITE_EMAILJS_REPLY_TO=medfissaludintensa@gmail.com
VITE_EMAIL_CLINICA=medfissaludintensa@gmail.com
VITE_WA_CLINICA=573114048112
```

Sin `.env.local` la app funciona localmente (localStorage) sin email ni nube.

---

## 6. Login inicial

| Email | Contraseña | Rol |
|---|---|---|
| medfissaludintensa@gmail.com | admin123456 | ADMINISTRADOR |

El administrador puede agregar más usuarios desde: **Panel Admin → Gestión de Staff**

---

## Estructura del proyecto

```
medfis-consentimientos/
├── src/                    ← Frontend React + TypeScript
│   ├── app/
│   │   ├── App.tsx         ← Aplicación principal
│   │   └── lib/
│   │       ├── pdfService.ts      ← Generación PDF (jsPDF)
│   │       ├── emailService.ts    ← Envío email (EmailJS)
│   │       └── supabaseClient.ts  ← Almacenamiento nube
│   └── styles/
├── backend/                ← API REST Spring Boot
│   └── src/main/java/com/medfis/
│       ├── controller/     ← Endpoints REST
│       ├── service/        ← Lógica de negocio
│       ├── entity/         ← Entidades JPA
│       ├── repository/     ← Spring Data JPA
│       ├── security/       ← JWT + Spring Security
│       └── config/
│           └── DataInitializer.java  ← Crea admin al arrancar
└── .env.example            ← Plantilla de variables de entorno
```

---

## Postman — Pruebas API

### Login
```
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{"email":"medfissaludintensa@gmail.com","password":"admin123456"}
```

### Crear consentimiento
```
POST http://localhost:8080/api/consentimientos
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipo": "escleroterapia",
  "pacienteNombre": "María López",
  "pacienteDoc": "1098765432",
  "pacienteTel": "3001234567",
  "datos": {}
}
```

### Aprobar
```
PUT http://localhost:8080/api/consentimientos/{id}/aprobar
Authorization: Bearer {token}
{"medico": "Dr. Rafael Marrero"}
```

---

© 2024 Med&Fis Salud Intensa · JM Ingeniero · Todos los derechos reservados
Nos reservamos el derecho de admisión.
