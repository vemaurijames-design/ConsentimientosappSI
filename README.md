# Med&Fis — Sistema de Consentimientos Informados

> **Autor principal / Propietario del repositorio:** Mauricio Salazar  
> **Desarrollado por:** JM Ingeniero  
> **Cliente:** Med&Fis IPS · NIT 901102930 · Medellín, Colombia  
> **Médico responsable:** Dr. Rafael Eduardo Marrero Padilla · RM 3880525

Sistema digital de consentimientos informados para clínicas de estética y fisioterapia. Permite registrar, firmar, aprobar y enviar consentimientos informados con PDF, email y WhatsApp.

---

## Tabla de Contenidos

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
11. [Modelo de negocio](#11-modelo-de-negocio)

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

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/mauricio-salazar/medfis-consentimientos.git
cd medfis-consentimientos
```

> Si aún no tienes el repositorio en GitHub, crea uno en [github.com](https://github.com/new) y sube el código:
> ```bash
> git init
> git add .
> git commit -m "feat: sistema de consentimientos Med&Fis v1.0"
> git branch -M main
> git remote add origin https://github.com/mauricio-salazar/medfis-consentimientos.git
> git push -u origin main
> ```

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

### Servicios necesarios y costos

| Servicio | Uso | Costo |
|---------|-----|-------|
| **Dominio** (ej: medfis.com.co) | Identidad online | ~$50.000 COP/año |
| **Vercel** (frontend) | Hosting React | **Gratis** |
| **Railway** (backend + PostgreSQL) | Spring Boot + DB | ~$5 USD/mes |
| **Supabase** (PDFs) | Storage 1 GB | **Gratis** |
| **EmailJS** (emails) | 200 emails/mes | **Gratis** |
| **SSL/HTTPS** | Incluido en Vercel | **Gratis** |

**Total mínimo: ~$50.000 COP/año** (solo el dominio)

### Deploy Frontend → Vercel

```bash
# 1. Hacer push del código a GitHub

# 2. En vercel.com → Import Git Repository → seleccionar el repo

# 3. Configurar variables de entorno en Vercel Dashboard:
#    VITE_API_URL = https://tu-backend.railway.app/api
#    VITE_SUPABASE_URL = ...
#    VITE_SUPABASE_ANON_KEY = ...
#    VITE_EMAILJS_SERVICE_ID = ...
#    (etc.)

# 4. Build command: pnpm build
# 5. Output directory: dist
```

### Deploy Backend → Railway

```bash
# 1. Instalar Railway CLI
npm install -g @railway/cli

# 2. En el directorio backend/
railway init
railway up

# 3. Configurar variables en Railway Dashboard:
#    MEDFIS_MAIL_PASSWORD = abcd efgh ijkl mnop
#    spring.datasource.url = (Railway auto-configura si usa su PostgreSQL)
```

### Configurar CORS para producción

En `backend/src/main/resources/application.properties`:
```properties
cors.allowed-origins=https://medfis.vercel.app,https://medfis.tudominio.com.co
```

### Lista de verificación pre-lanzamiento

- [ ] Dominio configurado y apuntando a Vercel
- [ ] HTTPS activado (SSL automático en Vercel)
- [ ] Variables de entorno correctas en producción
- [ ] App Password Gmail configurado en Railway
- [ ] Supabase bucket `consentimientos` público
- [ ] EmailJS funcionando (enviar email de prueba)
- [ ] Contraseña admin cambiada (`admin123456` → contraseña segura)
- [ ] CORS actualizado con el dominio real
- [ ] Backup automático PostgreSQL configurado en Railway
- [ ] Probar flujo completo: crear → firmar → aprobar → descargar PDF → email → WhatsApp

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

## Licencia y propiedad intelectual

**© 2024–2025 Mauricio Salazar — Todos los derechos reservados.**

Software de gestión de consentimientos informados para Med&Fis IPS y afiliados.  
Prohibida la redistribución sin autorización expresa del propietario del repositorio.

Desarrollado por **JM Ingeniero** bajo contrato con el propietario.
