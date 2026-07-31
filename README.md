# Med&Fis — Sistema de Consentimientos Informados

Sistema digital de consentimientos informados para IPS médica, desarrollado con React + TypeScript + Tailwind CSS.

## Funcionalidades

### Tipos de Consentimiento
| Tipo | Descripción | Radicado |
|------|-------------|----------|
| **Escleroterapia** | Inyección de Várices MMII | `ESC-YYYY-XXXX` |
| **Sueroterapia** | Vitamina C / Complejo B IV | `SUE-YYYY-XXXX` |
| **Láser ND:YAG** | Terapia Láser Venas | `LAS-YYYY-XXXX` |
| **Paquete Completo** | Los 3 procedimientos en una sesión | `PAQ-YYYY-XXXX` |

### Flujo del Paquete Completo (7 pasos)
1. **Datos del Paciente** — Identificación, contacto, emergencia
2. **Vitales + Cuestionario** — Signos vitales y test diagnóstico escleroterapia
3. **Prescripción + Parámetros** — Dosis sueroterapia, lotes y parámetros láser ND:YAG
4. **Leer · Escleroterapia** — Lectura obligatoria del consentimiento
5. **Leer · Sueroterapia** — Lectura obligatoria del consentimiento
6. **Leer · Láser ND:YAG** — Lectura obligatoria del consentimiento
7. **Firma del Paciente** — Firma digital única válida para los 3 procedimientos

### Roles de Usuario
| Rol | Permisos |
|-----|----------|
| **MÉDICO** | Ver, revisar firmas, anular |
| **ADMINISTRADOR** | Todo + Configuración IPS |
| **AUXILIAR** | Crear, ver |

### Configuración IPS (Constantes Editables)
El Administrador puede editar los datos de la IPS desde el sidebar → **Configuración IPS**:
- Nombre de la IPS
- NIT
- Médico Responsable + Registro Médico
- Ciudad / Sede

Los cambios se persisten en `localStorage` y se reflejan en todos los documentos.

## Stack Técnico

- **React 18** + **TypeScript**
- **Tailwind CSS** — sistema de tokens en `src/styles/theme.css`
- **Vite** — bundler
- **Recharts** — gráficas de tendencia y distribución
- **lucide-react** — iconografía

## Estructura del Proyecto

```
src/
├── app/
│   └── App.tsx          # Componente principal (todo en uno)
├── styles/
│   ├── fonts.css        # Imports Google Fonts
│   ├── theme.css        # Tokens de diseño (colores, tipografía)
│   └── index.css        # Tailwind base + componentes
└── main.tsx             # Entry point
```

## Cuentas de Prueba

| Email | Contraseña | Rol |
|-------|------------|-----|
| `rafael.marrero@medfis.com` | `medico123` | MÉDICO |
| `admin@medfis.com` | `admin123` | ADMINISTRADOR |
| `auxiliar@medfis.com` | `auxiliar123` | AUXILIAR |

## Instalación y Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## Características Técnicas

- **Firma digital** — Canvas API, compatible con touch y mouse
- **IMC automático** — Calculado al ingresar peso y talla
- **WhatsApp integration** — Enlace directo con mensaje preformateado
- **Trazabilidad M/DM** — Registro de números de lote por procedimiento
- **Cuestionario diagnóstico** — 13 preguntas con respuesta Si/No
- **Lectura obligatoria** — El PDF se habilita solo al desplazar hasta el final
- **Persistencia IPS** — Configuración guardada en localStorage

## Paleta de Colores

| Token | Color | Uso |
|-------|-------|-----|
| `#0C1A35` | Azul marino | Sidebar, encabezados |
| `#1A56DB` | Azul primario | Acciones, enlaces |
| `#00B896` | Verde teal | Sueroterapia, éxito |
| `#F59E0B` | Ámbar | Láser, advertencias |
| `#8B5CF6` | Púrpura | Paquete completo |

---

**Med&Fis** · Sistema de Consentimientos Informados · Colombia
