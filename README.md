# CliniSign — Consentimientos Médicos Digitales

> **Nombre comercial:** CliniSign · *"Consentimientos médicos digitales. Seguros. Rápidos. Legales."*  
> **Autor principal / Propietario del repositorio:** Mauricio Salazar  
> **Desarrollado por:** JM Ingeniero  
> **Cliente:** Med&Fis IPS · NIT 901102930 · Medellín, Colombia  
> **Médico responsable:** Dr. Rafael Eduardo Marrero Padilla · RM 3880525

**CliniSign** es un sistema digital de consentimientos informados para clínicas de estética y fisioterapia. Permite registrar, firmar con firma digital, aprobar con aval médico y enviar consentimientos informados en PDF por email y WhatsApp — todo desde el navegador, sin instalar nada.

---

## Tabla de Contenidos

0. [Arquitectura: Admin distribuidor vs Clientes](#0-arquitectura-admin-distribuidor-vs-clientes)
1. [Stack tecnológico](#1-stack-tecnológico)
2. [Clonar y ejecutar localmente](#2-clonar-y-ejecutar-localmente)
3. [Variables de entorno](#3-variables-de-entorno)
4. [Estructura del proyecto](#4-estructura-del-proyecto)
5. [Cómo añadir un nuevo tipo de consentimiento](#5-cómo-añadir-un-nuevo-tipo-de-consentimiento)
6. [Cómo modificar los textos del consentimiento](#6-cómo-modificar-los-textos-del-consentimiento)
7. [Firma del doctor en el PDF](#7-firma-del-doctor-en-el-pdf)
8. [Personalizar el PDF](#8-personalizar-el-pdf)
9. [Backend Spring Boot](#9-backend-spring-boot)
10. [Pasar a producción](#10-pasar-a-producción)
11. [Modelo de negocio — CliniSign](#11-modelo-de-negocio)
12. [Seguridad de datos y backup](#12-seguridad-de-datos-y-estrategia-de-backup)

---

## 0. Arquitectura: Admin Distribuidor vs Clientes

### Concepto de distribución

```
MAURICIO SALAZAR (Propietario / Distribuidor)
        │
        │  Vende acceso a CliniSign
        ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Cliente A       │  │  Cliente B       │  │  Cliente C       │
│  IPS Salud+      │  │  Estética Bella  │  │  FisioVida       │
│  ─────────────── │  │  ─────────────── │  │  ─────────────── │
│  BD propia       │  │  BD propia       │  │  BD propia       │
│  PostgreSQL      │  │  PostgreSQL      │  │  PostgreSQL      │
│  (cloud cliente) │  │  (cloud cliente) │  │  (cloud cliente) │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

**Principio legal clave:** Cada cliente tiene su **propia base de datos**. Los datos de salud de sus pacientes NUNCA se mezclan con otros clientes ni pasan por el servidor del distribuidor. Esto cumple con la Ley 1581 de 2012 (Colombia) y la normativa de datos sensibles de salud.

### Roles del sistema

| Rol | Permisos |
|-----|----------|
| **ADMINISTRADOR** | Control total: CRUD usuarios, configuración IPS, médicos, permisos, ver todas las estadísticas, ver/descargar todos los PDFs |
| **MÉDICO** | Ver y aprobar/rechazar consentimientos, Visto Bueno médico |
| **ENFERMERA** | Crear consentimientos, registrar signos vitales |
| **AUXILIAR** | Crear y registrar consentimientos |
| **TÉCNICO** | Crear consentimientos de láser |

### Lo que controla el Administrador

El **ADMINISTRADOR** de cada instalación tiene control total:

```
Configuración IPS (menú ⚙️ → Configuración IPS)
├── Tab "General": Nombre, NIT, Ciudad, Médico principal
├── Tab "Logo & Marca": Logo de la clínica, firma general fallback
└── Tab "Médicos": Lista de médicos con foto, RM, especialidad, firma digital

Gestión de Personal (menú 👥 → Personal)
├── Crear/editar/desactivar usuarios
├── Asignar roles y permisos
├── Cambiar contraseñas
├── Fotos de perfil del personal
└── Datos adicionales de médicos (RM, especialidad)

Control de registros
├── Ver y descargar PDF de cualquier consentimiento
├── Anular consentimientos
└── Acceso completo al historial

Estadísticas
└── Acceso completo a la pantalla Admin con métricas detalladas
```

### Cómo desplegar para un nuevo cliente (Mauricio como distribuidor)

```bash
# 1. Clonar el repositorio base (la plantilla)
git clone https://github.com/mauricio-salazar/clinisign.git cliente-a
cd cliente-a

# 2. Crear .env.local para ese cliente (cada cliente tiene sus propias keys)
cp .env.example .env.local
# Editar con los datos del cliente A:
# - Su URL de PostgreSQL (en Railway/Render/Supabase)
# - Su bucket de Supabase Storage
# - Su configuración de EmailJS
# - Su WhatsApp

# 3. Cambiar las constantes del cliente en el código
# Editar src/app/App.tsx línea 66-70:
const DEFAULT_IPS: IPSConfig = {
  nombre: "IPS Cliente A",  // ← nombre de la clínica
  nit: "900123456",          // ← NIT del cliente
  medico: "Dr. Juan Pérez",  // ← médico responsable
  rm: "RM 1234567",
  ciudad: "Bogotá, Colombia",
  doctores: [],
};

# 4. Crear el usuario administrador del cliente
# Editar src/app/App.tsx — buscar USUARIOS_INICIALES o similar
# y poner el email/contraseña inicial del administrador del cliente.

# 5. Build de producción
pnpm build
# → genera /dist con todos los archivos estáticos

# 6. Subir a Vercel (o el hosting elegido)
npx vercel deploy --prod
# → URL pública del cliente: https://clinisign-clientea.vercel.app

# 7. Entregar al cliente:
#   - URL del sistema
#   - Email y contraseña de administrador
#   - Manual de usuario (PDF)
```

### Gestión de la base de datos del cliente

**Cada cliente usa su propio PostgreSQL en la nube.** El distribuidor NO accede a los datos de salud del cliente. Solo el equipo del cliente accede a su propia base.

```
Opción recomendada: Railway.app (PostgreSQL)
├── Plan Hobby: $5 USD/mes (500 MB, más que suficiente)
├── El cliente paga directamente a Railway
├── URL de conexión: postgresql://user:pass@host:5432/dbname
└── El cliente tiene acceso total a su propia base

Opción alternativa: Render.com
├── Plan gratuito: 90 días (luego $7 USD/mes)
└── Ideal para clientes que quieren probar primero

Opción enterprise: Servidor propio del cliente
└── El cliente instala PostgreSQL en su propio servidor
```

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite 6 |
| Estilos | Tailwind CSS v4 |
| PDF | jsPDF |
| Email | EmailJS (navegador) / JavaMailSender (backend) |
| WhatsApp | API wa.me (link directo) |
| Almacenamiento PDF | Supabase Storage |
| Backend | Spring Boot 3.2.5 + PostgreSQL |
| Auth | JWT (Spring Security) |
| Notificaciones | WebSocket STOMP |

---

## 2. Clonar y ejecutar localmente

### Requisitos previos

- Node.js 22+ y pnpm (`npm install -g pnpm`)
- Java 21+ y Maven (para el backend)
- PostgreSQL 15+ corriendo localmente
- Git

### Paso 0 — Subir el código a GitHub (solo la primera vez, como propietario)

```bash
# Desde la carpeta del proyecto
git init
git add .
git commit -m "feat: CliniSign v1.0 — Sistema de consentimientos informados"
git branch -M main
# Crear el repositorio en github.com/new (privado recomendado)
git remote add origin https://github.com/mauricio-salazar/clinisign.git
git push -u origin main
```

> **Repositorio privado** es obligatorio — contiene la configuración de clientes y credenciales base.  
> Solo Mauricio Salazar tiene acceso. Cada cliente NO tiene acceso al código fuente.

### Paso 1 — Clonar el repositorio (en el servidor o máquina local)

```bash
# Con HTTPS (recomendado, no requiere clave SSH)
git clone https://github.com/mauricio-salazar/clinisign.git
cd clinisign

# Con SSH (si tienes clave SSH configurada en GitHub)
git clone git@github.com:mauricio-salazar/clinisign.git
cd clinisign

# Verificar que clonó bien
ls -la
# Deber ver: src/, backend/, package.json, vite.config.ts, etc.
```

### Cómo actualizar cuando hay cambios

```bash
# Descargar los últimos cambios del repositorio
git pull origin main

# Si hay cambios en dependencias
pnpm install

# Reiniciar servidor de desarrollo
pnpm dev
```

### Paso 2 — Frontend

```bash
# En la raíz del proyecto
pnpm install

# Crear variables de entorno
cp .env.example .env.local
# Editar .env.local con tus valores reales

# Iniciar servidor de desarrollo
pnpm dev
# → Abre http://localhost:5173
```

### Paso 3 — Backend (opcional para pruebas básicas)

```bash
# Crear base de datos PostgreSQL
psql -U postgres -c "CREATE DATABASE medfis_db;"
psql -U postgres -c "CREATE USER medfis_user WITH PASSWORD 'medfis_pass';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE medfis_db TO medfis_user;"

# Iniciar Spring Boot
cd backend
mvn spring-boot:run
# → Escucha en http://localhost:8080
```

> **El frontend funciona sin el backend** usando localStorage como base de datos local. El backend agrega persistencia PostgreSQL y email SMTP.

### Credenciales iniciales de acceso

```
Email:    medfissaludintensa@gmail.com
Password: admin123456
Rol:      ADMINISTRADOR
```

> **IMPORTANTE — Seguridad:** Cambia la contraseña del administrador inmediatamente después del primer acceso.  
> El Administrador es el único que puede ver y gestionar las credenciales del personal.  
> Las credenciales **NUNCA** se muestran en la pantalla de login.

### Pasos iniciales para cada nueva instalación de cliente

Una vez que el sistema esté corriendo, el Administrador debe:

1. **Configurar la IPS** → menú ⚙️ → Configuración IPS  
   - Tab "General": Nombre de la clínica, NIT, ciudad, médico principal
   - Tab "Logo & Marca": Subir el logo (PNG, fondo transparente, max 300 KB)
   - Tab "Médicos": Agregar cada médico con foto, RM, especialidad y firma escaneada

2. **Crear el personal** → menú 👥 → Personal  
   - Agregar a cada empleado con su correo, rol y contraseña inicial
   - Para MÉDICO: ingresar su RM y especialidad
   - Subir foto de perfil (opcional pero recomendado)

3. **Informar credenciales** → el Administrador entrega por canal seguro (mensaje privado, no email)  
   el correo y contraseña inicial a cada empleado

4. **Hacer el primer consentimiento de prueba** → verificar que el PDF se genera correctamente,  
   que el email llega y que WhatsApp funciona

---

## 3. Variables de entorno

Crea `.env.local` en la raíz copiando `.env.example`:

```env
# Backend
VITE_API_URL=http://localhost:8080/api

# Supabase — Almacenamiento PDFs (gratis hasta 1 GB)
VITE_SUPABASE_URL=https://XXXXXXXXXXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_BUCKET=consentimientos

# EmailJS — Email desde el navegador (gratis 200/mes)
VITE_EMAILJS_SERVICE_ID=service_xxxxxxx
VITE_EMAILJS_TEMPLATE_ID=template_xxxxxxx
VITE_EMAILJS_PUBLIC_KEY=XXXXXXXXXXXXXXXXXXXXXX
VITE_EMAILJS_REPLY_TO=medfissaludintensa@gmail.com

# Clínica
VITE_EMAIL_CLINICA=medfissaludintensa@gmail.com
VITE_WA_CLINICA=573114048112
```

### Configurar EmailJS (paso a paso)

1. [emailjs.com](https://emailjs.com) → Sign Up Free
2. **Email Services** → Add Service → Gmail → conectar `medfissaludintensa@gmail.com`
3. **Email Templates** → Create Template → pegar la plantilla HTML del `.env.example`
4. **Account** → General → copiar **Public Key**
5. Copiar Service ID y Template ID → pegar en `.env.local`

### Configurar Supabase (paso a paso)

1. [supabase.com](https://supabase.com) → Start for free
2. New Project → nombre: `medfis`
3. Storage → New Bucket → nombre: `consentimientos` → **Public: ON**
4. Project Settings → API → copiar URL y anon key → pegar en `.env.local`

---

## 4. Estructura del proyecto

```
medfis-consentimientos/
│
├── src/
│   └── app/
│       ├── App.tsx                    ← Todo el frontend en un archivo
│       ├── components/figma/          ← ImageWithFallback y utils
│       └── lib/
│           ├── pdfService.ts          ← Generación PDF (jsPDF)
│           ├── emailService.ts        ← Email vía EmailJS
│           └── supabaseClient.ts      ← Subida de PDFs
│
├── backend/src/main/java/com/medfis/
│   ├── config/
│   │   ├── DataInitializer.java       ← Crea admin al arrancar
│   │   └── SecurityConfig.java        ← JWT + CORS
│   ├── controller/
│   │   ├── AuthController.java        ← POST /api/auth/login
│   │   ├── ConsentimientoController.java
│   │   └── UsuarioController.java
│   ├── entity/
│   │   ├── Consentimiento.java
│   │   └── Usuario.java
│   └── service/
│       └── EmailService.java          ← SMTP JavaMailSender
│
├── .env.example                       ← Plantilla de variables
├── .gitignore                         ← node_modules, .env.local, target/
├── MedFis_API.postman_collection.json ← Colección Postman (16 requests)
└── README.md                          ← Este archivo
```

---

## 5. Cómo añadir un nuevo tipo de consentimiento

Ejemplo completo: agregar **"Mesoterapia"** (prefijo `MES`)

### A. En `src/app/App.tsx`

**1. Agregar al tipo (línea ~72):**
```typescript
type TipoConsent = "escleroterapia" | "sueroterapia" | "laser" | "paquete" | "mesoterapia";
```

**2. Crear el texto legal (después de `makeTextoLaser`, línea ~285):**
```typescript
function makeTextoMesoterapia(ips: IPSConfig) {
  return `CONSENTIMIENTO INFORMADO PARA MESOTERAPIA
${ips.nombre} — NIT ${ips.nit}

[DESCRIPCIÓN DEL PROCEDIMIENTO]
La mesoterapia es una técnica de medicina estética que consiste en...

[RIESGOS]
Los posibles efectos secundarios incluyen...

[FIRMA]
Yo, _________________, manifiesto que he leído y comprendido...`;
}
```

**3. Agregar prefijo del radicado en `genRadicado` (línea ~320):**
```typescript
function genRadicado(tipo: TipoConsent, n: number) {
  const prefix = {
    escleroterapia: "ESC",
    sueroterapia:   "SUE",
    laser:          "LAS",
    paquete:        "PAQ",
    mesoterapia:    "MES",  // ← agregar aquí
  }[tipo];
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}
```

**4. Agregar el contador por tipo en `nextIdsRef` (línea ~2742):**
```typescript
const tipos: TipoConsent[] = ["escleroterapia", "sueroterapia", "laser", "paquete", "mesoterapia"];
```

**5. Crear el formulario** (copiar `FormEscleroterapia` ~línea 1168 y adaptarlo):
```typescript
function FormMesoterapia({ onSave, onCancel, addToast, nextId, userName, records }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void;
  nextId: number; userName: string; records: ConsentRecord[];
}) {
  const ips = useIPS();
  // ... estados locales: pac, vitales, firma, consentido, step ...

  const handleSave = () => {
    const r: ConsentRecord = {
      id: genId(),
      tipo: "mesoterapia",                          // ← tipo correcto
      radicado: genRadicado("mesoterapia", nextId), // ← tipo correcto
      fecha: hoy(),
      pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
      estado: "FIRMADO", pendienteMedico: true, creadoPor: userName,
      datos: { paciente: pac, vitales, firmaConsentimiento: firma, consentido },
    };
    setRecord(r); onSave(r);
  };
  // ...
}
```

**6. Agregar botón en `TipoSelectorPage`:**
```tsx
{ tipo: "mesoterapia", label: "Mesoterapia", sub: "Microinyecciones",
  icon: <Heart size={24}/>, color: "bg-pink-500", iconBg: "bg-pink-500",
  light: "bg-pink-50 hover:bg-pink-100 border-pink-200" }
```

**7. Instanciar el formulario al final de `App()` (línea ~3073):**
```tsx
{activeForm === "mesoterapia" && (
  <FormMesoterapia
    onSave={handleSave}
    onCancel={() => setActiveForm(null)}
    addToast={addToast}
    nextId={nextIdsRef.current["mesoterapia"] ?? 1}
    userName={user.nombre}
    records={records}
  />
)}
```

### B. En `src/app/lib/pdfService.ts`

Agregar el label del nuevo tipo en `tipoLabel` (línea ~71):
```typescript
const tipoLabel: Record<string, string> = {
  escleroterapia: "ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES...",
  sueroterapia:   "SUEROTERAPIA DE VITAMINA C y/o COMPLEJO B",
  laser:          "TERAPIA LÁSER ND:YAG PARA CONTROL DE VENAS VÁRICES",
  paquete:        "PAQUETE INTEGRAL MED&FIS",
  mesoterapia:    "MESOTERAPIA ESTÉTICA",  // ← agregar aquí
};
```

### C. En el backend `Consentimiento.java`

```java
public enum TipoConsentimiento {
    escleroterapia, sueroterapia, laser, paquete, mesoterapia
}
```

---

## 6. Cómo modificar los textos del consentimiento

Los textos legales están en `src/app/App.tsx` como funciones que reciben `ips: IPSConfig`:

| Función | Línea aprox. | Procedimiento |
|---------|-------------|---------------|
| `makeTextoEscleroterapia(ips)` | ~153 | Escleroterapia |
| `makeTextoSueroterapia(ips)` | ~195 | Sueroterapia |
| `makeTextoLaser(ips)` | ~235 | Terapia Láser |

Son strings multilínea (template literals). Editar el texto directamente.

**Variables de la clínica disponibles dentro del texto:**
- `${ips.nombre}` → nombre de la clínica
- `${ips.nit}` → NIT
- `${ips.medico}` → nombre del médico
- `${ips.rm}` → registro médico
- `${ips.ciudad}` → ciudad

---

## 7. Firma del doctor en el PDF

La firma del médico es una imagen (JPG/PNG del sello o firma escaneada).

### Desde la interfaz (recomendado)

1. Ingresar como **Administrador**
2. Sidebar → ⚙️ Configuración IPS
3. Sección "Firma / Sello del Médico (PDF)" → clic para subir
4. Seleccionar JPG/PNG (máx. 500 KB)
5. **Guardar**

La imagen queda guardada en `localStorage["medfis_ips_config"]` y aparece automáticamente en todos los PDFs nuevos.

### Consejos para la imagen de firma

- Fondo **blanco** o **transparente** (PNG)
- Resolución: 400×150 px mínimo
- Incluir firma manuscrita + sello redondo del médico si tiene
- Peso máximo: 500 KB

### Desde código (para hardcodear)

En `App.tsx`, línea ~62:
```typescript
const DEFAULT_IPS: IPSConfig = {
  ...
  firmaDoctor: "data:image/png;base64,iVBORw0KGgo...",
};
```

Para convertir una imagen a base64 desde la consola del navegador (F12):
```javascript
// Pega esto en la consola con la imagen en /public/firma.png
fetch('/firma.png').then(r=>r.blob()).then(b=>{
  const r=new FileReader(); r.onloadend=()=>console.log(r.result); r.readAsDataURL(b);
});
```

---

## 8. Personalizar el PDF

El PDF se genera en `src/app/lib/pdfService.ts`.

### Colores corporativos (línea ~20)

```typescript
const AZUL_OSCURO: [number, number, number] = [3, 28, 166];    // #031CA6
const AZUL_MEDIO:  [number, number, number] = [13, 81, 217];   // #0D51D9
const GRIS_TEXTO:  [number, number, number] = [55, 65, 81];    // #374151
```

Para cambiar el color azul corporativo:
```typescript
// Ejemplo: verde clínica
const AZUL_OSCURO: [number, number, number] = [2, 120, 90];   // verde oscuro
const AZUL_MEDIO:  [number, number, number] = [16, 185, 129]; // esmeralda
```

### Secciones del PDF (en orden, `pdfService.ts`)

1. **Cabecera** (fondo azul): nombre IPS, NIT, ciudad, radicado
2. **Barra de procedimiento**: tipo de consentimiento
3. **Tabla datos paciente**: nombre, doc, tel, email
4. **Médico responsable**: nombre y RM
5. **Texto legal**: completo con títulos en negrita
6. **Datos adicionales**: dirección, contacto emergencia
7. **Signos vitales**: SpO2, TA, FC, temperatura, peso, talla
8. **Bloque de firmas**: imagen firma paciente + imagen firma médico
9. **Pie de página** (todas las páginas): copyright, N° página

### Agregar un campo nuevo al PDF

1. Agregar al interface `DatosConsentimiento` en `pdfService.ts`:
```typescript
interface DatosConsentimiento {
  // ...existentes...
  numeroPolizaSalud?: string; // ← nuevo campo
}
```

2. Usar el campo en el body del PDF:
```typescript
if (datos.numeroPolizaSalud) {
  doc.text(`Póliza: ${datos.numeroPolizaSalud}`, M + 4, y);
  y += 5;
}
```

3. Pasarlo al llamar `generarPDFConsentimiento` en `App.tsx`:
```typescript
generarPDFConsentimiento({
  ...existingParams,
  numeroPolizaSalud: (r.datos as any)?.paciente?.poliza,
});
```

---

## 9. Backend Spring Boot

### Endpoints

| Método | Endpoint | Auth | Descripción |
|--------|---------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login → `{ token, id, email, nombre, rol }` |
| GET | `/api/consentimientos` | ✅ | Lista (admin: todos, médico: pendientes, aux: propios) |
| POST | `/api/consentimientos` | ✅ | Crear consentimiento |
| POST | `/api/consentimientos/{id}/aprobar` | ✅ médico | Aprobar |
| POST | `/api/consentimientos/{id}/rechazar` | ✅ médico | Rechazar `{ motivo }` |
| GET | `/api/usuarios` | ✅ admin | Listar staff |
| POST | `/api/usuarios` | ✅ admin | Crear usuario |
| PATCH | `/api/usuarios/{id}/toggle` | ✅ admin | Activar/desactivar |

### Configurar Gmail App Password (SMTP)

```properties
# backend/src/main/resources/application.properties
spring.mail.username=medfissaludintensa@gmail.com
spring.mail.password=${MEDFIS_MAIL_PASSWORD:SIN_CONFIGURAR}
```

**Pasos para obtener App Password:**
1. [myaccount.google.com](https://myaccount.google.com) → Seguridad
2. Verificación en 2 pasos → **Activar**
3. Contraseñas de aplicación → Generar (16 caracteres)
4. Windows: `set MEDFIS_MAIL_PASSWORD=abcd efgh ijkl mnop`
5. Linux/Mac: `export MEDFIS_MAIL_PASSWORD=abcd efgh ijkl mnop`

### Pruebas con Postman

Importar `MedFis_API.postman_collection.json` en Postman. La colección incluye:
- Login con auto-guardado del token
- CRUD completo de consentimientos
- Aprobar / rechazar
- Gestión de usuarios

---

## 10. Pasar a producción

### Servicios necesarios por cliente y costos

| Servicio | Uso | Costo mensual |
|---------|-----|-------|
| **Dominio** (ej: clinisign-clientea.com) | Identidad online | ~$4.000 COP/mes |
| **Vercel** (frontend React) | Hosting estático | **Gratis** (Hobby plan) |
| **Railway** (Spring Boot + PostgreSQL) | Backend + BD | ~$20.000 COP/mes |
| **Supabase** (almacenamiento PDFs) | 1 GB storage | **Gratis** |
| **EmailJS** (emails navegador) | 200 emails/mes | **Gratis** |
| **SSL/HTTPS** | Incluido en Vercel | **Gratis** |

**Total aprox. por cliente: $24.000 COP/mes** (costo de infraestructura)  
**Precio que puedes cobrar: $149.900 – $299.900 COP/mes** según el plan  
**Margen bruto: ~92%**

### Deploy completo paso a paso para un cliente

#### A. Crear la base de datos PostgreSQL en Railway

```bash
# 1. Ir a railway.app → New Project → Provision PostgreSQL
# 2. En el panel de Railway, ir a la BD → Connect → copiar la connection string:
#    postgresql://postgres:password@host:5432/railway

# 3. Guardar esa URL, la necesitarás en los siguientes pasos
```

#### B. Preparar el código para el cliente

```bash
# Clonar la plantilla base
git clone https://github.com/mauricio-salazar/clinisign.git clinisign-clientea
cd clinisign-clientea

# Editar src/app/App.tsx — línea ~67 (DEFAULT_IPS):
# Cambiar los datos iniciales de la clínica:
const DEFAULT_IPS: IPSConfig = {
  nombre: "IPS del Cliente A",     # ← nombre real
  nit: "900111222",                 # ← NIT real
  medico: "Dr. Carlos Torres",      # ← médico principal
  rm: "RM 4567890",
  ciudad: "Bogotá, Colombia",
  doctores: [],
};
# (El Administrador puede cambiar todo esto desde la interfaz sin tocar el código)

# Crear las variables de entorno del cliente
cat > .env.local << EOF
VITE_API_URL=https://clinisign-clientea-backend.railway.app/api
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPABASE_BUCKET=consentimientos
VITE_EMAILJS_SERVICE_ID=service_xxx
VITE_EMAILJS_TEMPLATE_ID=template_xxx
VITE_EMAILJS_PUBLIC_KEY=xxx
VITE_EMAIL_CLINICA=admin@clientea.com
VITE_WA_CLINICA=573001234567
EOF
```

#### C. Deploy del backend (Spring Boot) en Railway

```bash
# 1. En el directorio backend/
cd backend

# 2. Configurar application.properties para producción:
# Crear backend/src/main/resources/application-prod.properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${PGUSER}
spring.datasource.password=${PGPASSWORD}
spring.jpa.hibernate.ddl-auto=update
spring.jpa.properties.hibernate.connection.useSSL=true
jwt.secret=${JWT_SECRET}
cors.allowed-origins=${CORS_ORIGINS}

# 3. En Railway Dashboard → Add Service → GitHub Repo → seleccionar backend/
# 4. Configurar variables de entorno en Railway:
JWT_SECRET=GenerarClave64CaracteresAleatorios
CORS_ORIGINS=https://clinisign-clientea.vercel.app
MEDFIS_MAIL_PASSWORD=app-password-gmail

# 5. Railway buildea automáticamente con Maven y despliega
# → URL: https://clinisign-clientea-backend.railway.app
```

#### D. Deploy del frontend (React) en Vercel

```bash
# Opción 1: Vercel CLI (recomendada)
npm install -g vercel
vercel login
vercel --prod
# → Responder las preguntas: nombre del proyecto, directorio raíz, etc.
# → URL: https://clinisign-clientea.vercel.app

# Opción 2: Conectar GitHub a Vercel
# 1. Vercel.com → New Project → Import Git Repository
# 2. Seleccionar el repositorio del cliente
# 3. Configurar variables de entorno (copiar del .env.local)
# 4. Build Command: pnpm build
# 5. Output Directory: dist
# 6. Deploy!
```

#### E. Conectar dominio personalizado (opcional)

```bash
# En Vercel Dashboard → Project Settings → Domains
# Agregar: clinisign.clientea.com.co

# En el proveedor del dominio (GoDaddy, Namecheap, etc.)
# Agregar CNAME: clinisign → cname.vercel-dns.com
# SSL automático en 5 minutos
```

#### F. Verificar que todo funciona

```bash
# Checklist de lanzamiento por cliente:
✅ Frontend carga en https://clinisign-clientea.vercel.app
✅ Nombre y NIT de la clínica correctos en el login
✅ Login con admin funciona (medfissaludintensa@gmail.com / admin123456)
✅ Cambiar contraseña admin inmediatamente
✅ Configurar IPS: logo, médicos, firmas
✅ Agregar usuarios del personal con sus roles
✅ Crear consentimiento de prueba → firmar → verificar PDF descarga
✅ Verificar que email llega al paciente
✅ Verificar que WhatsApp abre con el mensaje correcto
✅ Aprobar consentimiento → verificar PDF con firma del médico aprobador
✅ Backup automático de BD configurado (Railway hace backups automáticos)
```

### Responsive: web, móvil y tablet

El sistema es **100% responsive**:

| Pantalla | Comportamiento |
|---------|----------------|
| **Desktop** (1024px+) | Sidebar fijo a la izquierda, contenido en el centro |
| **Tablet** (768-1023px) | Sidebar colapsable con overlay |
| **Móvil** (< 768px) | Menú hamburguesa, formularios apilados, firma táctil |

**La firma del paciente es completamente táctil** — funciona con el dedo en móvil y tablet, y con el ratón en desktop. No requiere componentes externos.

---

## 11. Modelo de negocio

### ¿Qué problema resuelves?

Las clínicas de estética en Colombia están **obligadas** por ley (Resolución 8430/1993) a obtener consentimiento informado escrito antes de cualquier procedimiento. Hoy lo hacen en papel: costoso, lento, fácil de perder, sin trazabilidad.

### Propuesta de valor

> "De 20 minutos en papel a 3 minutos digital. Consentimientos informados firmados, archivados y enviados automáticamente al paciente."

### Mercado objetivo

- Clínicas de medicina estética (Colombia: +3.500 registradas)
- Consultorios de fisioterapia y rehabilitación
- Centros de bienestar con procedimientos invasivos
- Médicos independientes con consultorio propio

### Modelo de precios sugerido (mensual)

| Plan | Precio/mes | Usuarios | Consentimientos |
|------|-----------|---------|----------------|
| **Básico** | $79.900 COP | 2 | 50/mes |
| **Clínica** | $149.900 COP | 5 | Ilimitados |
| **Premium** | $299.900 COP | Ilimitados | Ilimitados + white-label |
| **Setup** | $500.000 COP (único) | — | Instalación + capacitación 2h |

### Canales de venta

1. **Visita directa**: llevar laptop a consultorios estéticos
2. **LinkedIn**: médicos estéticos, gerentes de IPS
3. **Instagram**: mostrar el flujo en video de 60 segundos
4. **Ferias**: Expo Estética, Congreso Colombiano de Medicina Estética
5. **Partners**: proveedores de equipos estéticos (Esclerox, láseres)

### Argumentos clave de venta

- ✅ **Legal compliance:** Cumple Resolución 8430 de 1993
- ✅ **Ahorro de tiempo:** 20 min → 3 min por paciente
- ✅ **Cero papel:** Ahorro en impresión y archiveros
- ✅ **Evidencia digital:** PDF con firma + hash de integridad
- ✅ **Automatización:** Email + WhatsApp automáticos al paciente
- ✅ **Control médico:** Flujo de aprobación con visto bueno
- ✅ **Acceso remoto:** Desde cualquier dispositivo, sin instalación

### Script de demo (5 minutos)

```
1. "¿Cuánto tiempo tarda su auxiliar en llenar un consentimiento a mano?"
   → "Unos 15-20 minutos..."
   → "Con este sistema: 3 minutos. Vea:"

2. [Abrir el sistema en vivo]
   → Crear consentimiento de Escleroterapia
   → Firmar en pantalla
   → Mostrar el PDF descargado con la firma

3. "El paciente recibe automáticamente el PDF por email y WhatsApp."
   → Mostrar email recibido con PDF adjunto

4. "El médico recibe notificación y aprueba desde su celular."
   → Mostrar notificación y botón de Visto Bueno

5. "Por $149.900 al mes, ¿quiere que lo configuremos esta semana?"
```

---

## 12. Seguridad de datos y estrategia de backup

Los consentimientos informados contienen **datos de salud sensibles** (datos personales, firmas, procedimientos). La siguiente estrategia protege la información en todos los niveles.

### 12.1 Variables de entorno — nunca en código

Nunca pongas contraseñas, API keys ni URLs privadas directamente en el código. Usa siempre `.env.local`:

```bash
# Clonar el repo y crear el archivo de entorno
cp .env.example .env.local
# Llenar .env.local con los valores reales — este archivo NUNCA va al repositorio
```

El `.gitignore` ya excluye `.env.local`. Confirma que está ahí:

```
.env.local
*.env
```

### 12.2 Seguridad en PostgreSQL (backend Spring Boot)

```sql
-- 1. Crear usuario de base de datos sin privilegios de superusuario
CREATE USER medfis_app WITH PASSWORD 'ClaveSegura2025!';
GRANT CONNECT ON DATABASE medfis TO medfis_app;
GRANT USAGE ON SCHEMA public TO medfis_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO medfis_app;

-- 2. Habilitar cifrado en reposo (Railway/Render lo activan automáticamente)
-- En producción: usar siempre conexión SSL
-- spring.datasource.url=jdbc:postgresql://host:5432/medfis?sslmode=require

-- 3. Cifrar columnas sensibles (opcional pero recomendado)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- Ejemplo: guardar firmaConsentimiento cifrada
UPDATE consent_records 
SET datos = datos || jsonb_build_object('firmaCifrada', encode(encrypt(datos->>'firma', 'clave', 'aes'), 'base64'));
```

**En `application.properties` (producción):**

```properties
spring.datasource.url=${DATABASE_URL}
spring.datasource.username=${DB_USER}
spring.datasource.password=${DB_PASS}
spring.jpa.properties.hibernate.connection.useSSL=true
spring.jpa.properties.hibernate.connection.requireSSL=true
```

### 12.3 Supabase Storage — seguridad de PDFs en la nube

Los PDFs de consentimientos se suben automáticamente a Supabase Storage. Configura las políticas de acceso (RLS):

```sql
-- En Supabase SQL Editor:

-- Solo usuarios autenticados pueden ver los PDFs
CREATE POLICY "Autenticados pueden leer PDFs"
ON storage.objects FOR SELECT
USING (auth.role() = 'authenticated');

-- Solo el backend puede insertar/eliminar
CREATE POLICY "Solo backend puede subir"
ON storage.objects FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Los buckets deben ser PRIVADOS (no públicos)
-- En Supabase Dashboard → Storage → consentimientos → Editar → desmarcar "Public bucket"
```

### 12.4 Backup automático de PostgreSQL

**Backup diario con pg_dump (script para servidor Linux/Railway):**

```bash
#!/bin/bash
# /scripts/backup_medfis.sh
DATE=$(date +%Y%m%d_%H%M)
BACKUP_DIR="/backups/medfis"
mkdir -p $BACKUP_DIR

# Crear backup comprimido
PGPASSWORD=$DB_PASS pg_dump \
  -h $DB_HOST -p 5432 -U $DB_USER -d medfis \
  --no-password -Fc \
  -f "$BACKUP_DIR/medfis_$DATE.dump"

# Mantener solo los últimos 30 backups
ls -t $BACKUP_DIR/*.dump | tail -n +31 | xargs rm -f

echo "Backup completado: medfis_$DATE.dump"
```

**Programar con cron (diario a las 2 AM):**

```bash
crontab -e
# Agregar esta línea:
0 2 * * * /scripts/backup_medfis.sh >> /var/log/medfis_backup.log 2>&1
```

**Restaurar un backup:**

```bash
PGPASSWORD=$DB_PASS pg_restore \
  -h $DB_HOST -p 5432 -U $DB_USER -d medfis_restore \
  --no-password -Fc medfis_20250115_020000.dump
```

### 12.5 Backup de Supabase Storage

Los PDFs en Supabase se pueden respaldar con el CLI de Supabase:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Descargar todos los PDFs del bucket
supabase storage cp --recursive ss:///consentimientos ./backup_pdfs/

# Automatizar con cron semanal
0 3 * * 0 supabase storage cp --recursive ss:///consentimientos /backups/pdfs/$(date +%Y%m%d)/
```

### 12.6 Checklist de seguridad antes de ir a producción

```
✅ .env.local no está en el repositorio (.gitignore correcto)
✅ VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY configurados
✅ PostgreSQL con usuario de mínimos privilegios (no 'postgres')
✅ Conexión a BD con SSL habilitado (sslmode=require)
✅ Supabase bucket configurado como PRIVADO
✅ RLS activado en Supabase Storage
✅ Backup automático diario configurado en servidor
✅ Contraseñas de usuarios con al menos 12 caracteres
✅ JWT secret de Spring Boot con clave aleatoria larga (64+ chars)
✅ CORS restringido al dominio de la clínica en Spring Boot
✅ Logs de acceso activados en el servidor de producción
```

### 12.7 JWT y CORS en Spring Boot (producción)

```properties
# application-prod.properties
jwt.secret=${JWT_SECRET}  # Variable de entorno, mínimo 64 caracteres
jwt.expiration=86400000   # 24 horas

# CORS restringido
spring.web.cors.allowed-origins=https://medfis.tudominio.com
spring.web.cors.allowed-methods=GET,POST,PUT,DELETE
spring.web.cors.allow-credentials=true
```

---

## Licencia y propiedad intelectual

**© 2024–2025 Mauricio Salazar — Todos los derechos reservados.**

**CliniSign** — Software de gestión de consentimientos informados para Med&Fis IPS y afiliados.  
Prohibida la redistribución sin autorización expresa del propietario del repositorio.

Desarrollado por **JM Ingeniero** bajo contrato con el propietario.
