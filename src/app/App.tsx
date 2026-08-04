import { useState, useRef, useEffect, createContext, useContext, useCallback } from "react";
import { ImageWithFallback } from "@/app/components/figma/ImageWithFallback";
import medfisLogo from "@/imports/medfis_logo.png";
import {
  FileText, LogOut, Plus, Search, Eye, Trash2, Download,
  CheckCircle, Clock, XCircle, Mail, MessageSquare,
  Pen, ChevronRight, ChevronLeft, Bell, Menu, X,
  Shield, LayoutDashboard, Check, Phone, Stethoscope,
  Package, Syringe, Zap, Droplets, Printer,
  ThumbsUp, ThumbsDown, ClipboardList, BookOpen,
  Activity, MapPin, AtSign, UserCheck, AlertTriangle,
  Info, Users, Heart, Settings, Save, UserPlus,
  CheckSquare, XSquare, Lock, Unlock, BellRing,
  CalendarCheck, UserCog, RefreshCw, BarChart2, Edit3, KeyRound
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════════
// API SERVICE LAYER — conecta con Spring Boot backend
// Cambiar VITE_API_URL en .env para producción:
//   VITE_API_URL=http://localhost:8080/api
// ═══════════════════════════════════════════════════════════════════════════════
const API_BASE = (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) || "http://localhost:8080/api";

/* Mapa de endpoints Spring Boot:
 * POST   /api/auth/login                      → login
 * POST   /api/auth/logout                     → logout
 * GET    /api/usuarios                        → listar staff (admin)
 * POST   /api/usuarios                        → crear usuario (admin)
 * PUT    /api/usuarios/{id}                   → editar usuario (admin)
 * PATCH  /api/usuarios/{id}/toggle            → activar/desactivar (admin)
 * GET    /api/consentimientos                  → listar (filtrado por rol)
 * POST   /api/consentimientos                  → crear consentimiento
 * GET    /api/consentimientos/{id}             → detalle
 * POST   /api/consentimientos/{id}/aprobar     → médico aprueba
 * POST   /api/consentimientos/{id}/rechazar    → médico rechaza (requiere motivo)
 * GET    /api/notificaciones                   → notificaciones del usuario
 * PATCH  /api/notificaciones/{id}/leer         → marcar leída
 * DELETE /api/notificaciones/{id}              → eliminar
 * WS     /ws/notificaciones                    → WebSocket (Spring STOMP)
 */
const apiService = {
  _token: "",
  setToken(t: string) { this._token = t; },
  headers() { return { "Content-Type": "application/json", Authorization: `Bearer ${this._token}` }; },
  async get(path: string) { return fetch(`${API_BASE}${path}`, { headers: this.headers() }); },
  async post(path: string, body: unknown) { return fetch(`${API_BASE}${path}`, { method: "POST", headers: this.headers(), body: JSON.stringify(body) }); },
  async put(path: string, body: unknown) { return fetch(`${API_BASE}${path}`, { method: "PUT", headers: this.headers(), body: JSON.stringify(body) }); },
  async patch(path: string, body?: unknown) { return fetch(`${API_BASE}${path}`, { method: "PATCH", headers: this.headers(), body: body ? JSON.stringify(body) : undefined }); },
};

// ─── IPS CONFIG ───────────────────────────────────────────────────────────────
interface IPSConfig { nombre: string; nit: string; medico: string; rm: string; ciudad: string; }

const DEFAULT_IPS: IPSConfig = {
  nombre: "Med&Fis", nit: "901102930",
  medico: "Dr. Rafael Eduardo Marrero Padilla", rm: "RM 3880525", ciudad: "Medellín, Colombia",
};

const IPSContext = createContext<IPSConfig>(DEFAULT_IPS);
const useIPS = () => useContext(IPSContext);

// ─── TIPOS ────────────────────────────────────────────────────────────────────
type AppPage = "dashboard" | "form" | "historial" | "staff" | "admin" | "notificaciones";
type TipoConsent = "escleroterapia" | "sueroterapia" | "laser" | "paquete";
type EstadoConsent = "FIRMADO" | "PENDIENTE" | "APROBADO" | "RECHAZADO" | "ANULADO";
type RolUsuario = "MÉDICO" | "ADMINISTRADOR" | "AUXILIAR" | "ENFERMERA" | "TÉCNICO";

interface Usuario {
  id: string; nombre: string; email: string; rol: RolUsuario;
  password: string; activo: boolean; createdAt: string;
}

interface Notificacion {
  id: string;
  tipo: "NUEVO_CONSENTIMIENTO" | "APROBADO" | "RECHAZADO" | "SISTEMA";
  titulo: string;
  mensaje: string;
  consentId?: string;
  leida: boolean;
  fecha: string;
  paraRol: RolUsuario | "TODOS";
  paraUserId?: string;
}

interface DatosPaciente {
  tipoDoc: string; documento: string; nombre: string; telefono: string; email: string;
  direccion: string; ciudad: string; fechaNacimiento: string; fecha: string;
  contactoNombre: string; contactoParentesco: string; contactoTelefono: string;
}

interface DatosVitales {
  oximetria: string; tension: string; frecuenciaCardiaca: string; frecuenciaRespiratoria: string;
  temperatura: string; peso: string; talla: string; imc: string; glucemia: string; observaciones: string;
}

interface LaserRow {
  fototipo: string; pieza: string; modo: string;
  frecuencia: string; fluencia: string; energia: string; area: string; pases: string;
}

interface DatosPaquete {
  paciente: DatosPaciente; vitales: DatosVitales;
  cuestionario: Record<string, "Si" | "No" | "">;
  dosis_vitC: string; dosis_compB: string; viaPrescripcion: string;
  trazabilidad: { nacl: string; vitC: string; compB: string; jeringa: string; pericraneal: string; macrogotero: string; };
  parametros: LaserRow[]; firmaConsentimiento: string; consentido: boolean | null;
}

interface ConsentRecord {
  id: string; tipo: TipoConsent; radicado: string; fecha: string;
  pacienteNombre: string; pacienteDoc: string; pacienteTel: string;
  estado: EstadoConsent; pendienteMedico: boolean;
  motivoRechazo?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  creadoPor?: string;
  datos: DatosPaquete | Record<string, unknown>;
}

// ─── ESTADO INICIAL USUARIOS ──────────────────────────────────────────────────
const USUARIOS_INICIALES: Usuario[] = [
  { id: "1", nombre: "Dr. Rafael Eduardo Marrero Padilla", email: "rafael.marrero@medfis.com", rol: "MÉDICO",        password: "medico123",   activo: true, createdAt: "2024-01-01" },
  { id: "2", nombre: "Administrador Med&Fis",               email: "admin@medfis.com",          rol: "ADMINISTRADOR", password: "admin123",    activo: true, createdAt: "2024-01-01" },
  { id: "3", nombre: "Auxiliar Recepción",                  email: "auxiliar@medfis.com",        rol: "AUXILIAR",      password: "auxiliar123", activo: true, createdAt: "2024-01-01" },
];

const CUESTIONARIO_PREGUNTAS = [
  "¿Enfermedad como diabetes, Presión arterial, Lupus, artritis Reumatoide, Cáncer actualmente?",
  "¿Cansancio en piernas?",
  "¿Visibilidad de venas várices?",
  "Alergias a Medicamentos Y/o Alimentos.",
  "¿Alguna Vez se ha tratado venas várices con infiltración?",
  "¿Antecedentes de cirugía Vascular?",
  "¿Antecedentes patológicos cardiovasculares o cerebrales?",
  "Si está en edad reproductiva: ¿Embarazo o sospecha del mismo o lactancia Materna?",
  "¿Realiza ejercicio?",
  "¿Consumo de grasa o ultra procesados con frecuencia?",
  "¿Condiciones como Ansiedad o Depresión?",
  "¿Permanece mucho tiempo de pie o sentada?",
  "¿Uso de medias de compresión alguna Vez?",
];

// ─── TEXTOS DINÁMICOS (transcritos fielmente del documento oficial Med&Fis) ───
function makeTextoEscleroterapia(ips: IPSConfig) {
  return `CONSENTIMIENTO INFORMADO PARA ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES
${ips.nombre} — NIT ${ips.nit}

Política de NO REUSO: "Por razones de bioseguridad y eficacia, todos los dispositivos médicos de un solo uso serán desechados adecuadamente después de su uso y no se reutilizarán bajo ninguna circunstancia."

Nota aclaratoria 1: Con el fin de optimizar la atención, en el consultorio estarán dos personas durante el procedimiento: el médico tratante y un(a) auxiliar encargado(a) del diligenciamiento de la historia. Por lo tanto, al brindar mi consentimiento acepto la permanencia de estas dos personas durante el tratamiento.

Yo, mayor de edad e identificado(a) con el documento relacionado, por medio del presente manifiesto que he decidido voluntaria y libremente conocer la información referente al tratamiento de mis venas várices y/o arañas varicosas por medio de la inyección de sustancias esclerosantes (escleroterapia).

DESCRIPCIÓN DEL PROCEDIMIENTO:
Se inyecta una solución química conocida como esclerosante (Polidocanol) en forma líquida-microespuma directamente en la vena afectada. Esta solución irrita la pared interna de la vena provocando que se hinche y se cierre. Con el tiempo la vena se convierte en tejido cicatricial y se desvanece. No se requiere anestesia ya que es un procedimiento mínimamente invasivo y generalmente de recuperación rápida. El objetivo de la escleroterapia es eliminar venas varicosas y arañas vasculares provocando su cierre y eventual reabsorción por el cuerpo. Esto busca mejorar la apariencia estética de las piernas y reducir síntomas como dolor, hinchazón y sensación de pesadez, mejorando así la calidad de vida del paciente.

El alcance del tratamiento es hasta venas menores de 3mm. Venas mayores a 3mm corresponden a cirugía vascular.

El Dr. evaluará de manera aproximada el número de sesiones de escleroterapia que necesita el paciente debido a que la medicina no es una ciencia exacta y cada paciente es fisiológicamente distinto. Debido a esto y otros factores, los resultados pueden variar.

REACCIONES Y COMPLICACIONES:
Entre las reacciones, complicaciones y riesgos conocidos están el que de inmediato puede aparecer enrojecimiento e inflamación locales con amoratamiento posterior a la intervención. Adicional a esto, dolor, comezón y sensibilidad en las áreas tratadas; pueden sentirse pequeños bultos moderadamente dolorosos, formarse coágulos en las várices inyectadas los cuales deben ser evaluados por el médico en cita de revisión. En algunas personas el tratamiento deja manchas temporales o permanentes en los sitios de inyección o a lo largo de las varices que dependen de factores genéticos y/o exposición solar. Hinchazón leve en las extremidades inferiores, aparecimiento esporádico de várices muy pequeñas, ocasionalmente úlceras en sitios de inyección las cuales sanan lentamente y dejan cicatrices antiestéticas. Frecuentemente trastornos pasajeros de la visión, raramente queloides, infección cutánea, inflamación de los sistemas venosos con formación de trombos (coágulos) y la posibilidad de reacciones alérgicas o tóxicas o paro cardiaco causado por los materiales usados lo cual puede llevar excepcionalmente a la muerte. Pueden presentarse además otros riesgos no previstos. Con toda la información tengo en cuenta y acepto las secuelas de todos los riesgos.

TRATAMIENTOS ALTERNATIVOS:
Terapia con láser endovenoso, Ablación por radiofrecuencia (RFA), Flebectomía ambulatoria, Tratamiento con láser superficial, Compresión graduada, cambios en el estilo de vida.

RESULTADOS ESPERADOS:
El resultado esperado es una disminución o mejora de las condiciones fisiológicas y visibles de las venas várices, mejorando su estética al reducir su apariencia, aliviar síntomas concernientes a ellas como dolor, hinchazón, picazón y sensación de pesadez en las piernas, mejorando la calidad de vida del paciente. Se aclara que dichos resultados varían en cada paciente de acuerdo a factores genéticos, fisiológicos y el cumplimiento o no de los cuidados y recomendaciones que sugiere el médico. Teniendo en cuenta dichas variantes, NO se garantiza un resultado estético específico después del tratamiento.

DECLARACIÓN DEL PACIENTE:
Doy fe de que se me ha dado la oportunidad de informar sobre mis enfermedades (en caso de tenerlas) y medicamentos consumidos habitualmente en caso de posibles interacciones o contraindicaciones. He tenido la oportunidad de realizar todas las preguntas necesarias con el fin de resolver mis inquietudes y considero que fueron contestadas adecuada y claramente por mi médico tratante. Estoy informado(a) sobre una revisión de rutina y la posibilidad de una cita de evaluación en caso de ser necesaria para observar la evolución del tratamiento (sin costo adicional).

Si durante el curso de este tratamiento surgen condiciones que requieran interrumpirlo o hacer procedimientos adicionales o diferentes a los que se planearon, autorizo y pido a mi médico tratante para que, según su criterio, haga lo que estime necesario según las circunstancias.

CONSENTIMIENTO:
Al firmar reconozco que he leído y entendido el presente documento. Teniendo en cuenta todo lo anterior, considero que tengo conocimientos adecuados para dar mi consentimiento y autorización para el procedimiento de escleroterapia, entendiendo y asumiendo los riesgos, reacciones, complicaciones y resultados insatisfactorios que pueden derivarse del mismo, independiente de las precauciones y cuidados que puedan tomarse para evitarlos. Me comprometo además a cumplir fielmente con las recomendaciones, instrucciones y controles, antes y después del tratamiento.

Nota aclaratoria 2: La IPS ${ips.nombre} no realizará ningún tipo de devolución de dinero una vez iniciado el tratamiento.

Al firmar este apartado, SI doy mi consentimiento libre y voluntario para proceder con el tratamiento. Autorizo para el procedimiento al ${ips.medico}. ${ips.rm}.

DISENTIMIENTO:
En caso de tener dudas sobre el procedimiento o no estar de acuerdo con su realización, el paciente puede firmar su disentimiento y NO autoriza el procedimiento.`;
}

function makeTextoSueroterapia(ips: IPSConfig) {
  return `CONSENTIMIENTO INFORMADO PARA SUEROTERAPIA DE VITAMINA C y/o COMPLEJO B
${ips.nombre} — NIT ${ips.nit}

Política de NO REUSO: "Por razones de bioseguridad y eficacia, todos los dispositivos médicos de un solo uso serán desechados adecuadamente después de su uso y no se reutilizarán bajo ninguna circunstancia."

1. OBJETIVO DEL PROCEDIMIENTO:
Mejorar el estado nutricional y de salud del paciente, proporcionando suplementos esenciales que pueden ayudar en la recuperación de diversas condiciones y mejorar el bienestar general.

2. DESCRIPCIÓN DEL PROCEDIMIENTO:
Consiste en la administración intravenosa de la vitamina de acuerdo a las indicaciones del médico. Vitamina C y Complejo B.

3. BENEFICIOS ESPERADOS:
Se me ha informado que la sueroterapia de vitamina C ó complejo B puede ayudar a mejorar mi sistema inmunológico, reducir el estrés oxidativo y apoyar la salud. Aumento en los niveles de energía. Mejora la salud de la piel, el cabello y las uñas. Reducción de la fatiga y el cansancio general.

4. RIESGOS Y EFECTOS SECUNDARIOS:
Se me ha explicado que, al igual que con cualquier tratamiento intravenoso, existen riesgos, incluyendo pero no limitándose a:

• Dolor, enrojecimiento, hematomas o edemas en el sitio de la venopunción.
• Reacciones alérgicas a la sustancia suministrada.
• Infecciones en el sitio de la inyección.
• Desbalance electrolítico.
• En el caso de la vitamina C puede agudizar los síntomas por cálculos renales.
• En raras ocasiones genera reacciones respiratorias por desbalance en el pH sanguíneo.

5. ALTERNATIVAS AL TRATAMIENTO:
Se me han informado otras alternativas de tratamiento, incluyendo la suplementación oral de vitamina C o complejo B. Ajustes en la dieta y estilo de vida. Otros tratamientos recomendados por el médico.

6. DECLARACIÓN DEL PACIENTE:
Me han explicado y comprendo satisfactoriamente la esencia y el propósito de este procedimiento, así como los posibles riesgos y complicaciones, y las otras alternativas de tratamiento. He tenido la oportunidad de hacer todas las preguntas que desee y he recibido respuestas satisfactorias.

7. CONSENTIMIENTO:
Al firmar este apartado, SI doy mi consentimiento libre y voluntario para proceder con el tratamiento. Autorizo para la realización del procedimiento bajo la prescripción del ${ips.medico}.

Nota: La IPS ${ips.nombre} (NIT ${ips.nit}) no realizará ningún tipo de devolución de dinero una vez iniciado el tratamiento.

DISENTIMIENTO:
En caso de tener dudas sobre el procedimiento o no estar de acuerdo con su realización, el paciente puede firmar su disentimiento y NO autoriza el procedimiento.`;
}

function makeTextoLaser(ips: IPSConfig) {
  return `CONSENTIMIENTO INFORMADO EN TERAPIA LÁSER PARA EL CONTROL DE VENAS VÁRICES
${ips.nombre} — NIT ${ips.nit}

Política de NO REUSO: "Por razones de bioseguridad y eficacia, todos los dispositivos médicos de un solo uso serán desechados adecuadamente después de su uso y no se reutilizarán bajo ninguna circunstancia."

1. OBJETIVO DEL PROCEDIMIENTO:
Cerrar y eliminar las venas afectadas de manera segura y eficaz, mejorando tanto la apariencia estética como el alivio de síntomas relacionados, como dolor, hinchazón y sensación de pesadez en las piernas.

2. DESCRIPCIÓN DEL PROCEDIMIENTO:
El procedimiento de terapia láser para el tratamiento de venas várices es mínimamente invasivo y suele realizarse de manera ambulatoria. Tras evaluación previa y estudios como una ecografía DOPPLER, se limpia y desinfecta la zona a tratar.

El láser genera calor, que provoca la contracción y el cierre de la vena afectada. Este calor daña específicamente la pared de la vena, causando su colapso. Una vez cerrada, la sangre es redirigida hacia venas sanas.

BENEFICIOS ESPERADOS:
Mejora en la circulación sanguínea. Se experimenta una reducción significativa del dolor, la hinchazón, la sensación de pesadez y cansancio en las piernas. Ofrece una apariencia más uniforme y saludable de las piernas. Permite regresar a las actividades diarias rápidamente y con menor incomodidad.

3. RIESGOS, COMPLICACIONES Y EFECTOS SECUNDARIOS:
• Puede haber sensibilidad o dolor en la zona tratada, aunque suele ser temporal.
• Algunas personas pueden experimentar oscurecimiento o aclaramiento temporal de la piel.
• Enrojecimiento e hinchazón leve por pocos días.
• Aunque es raro, siempre existe un pequeño riesgo de infección en el sitio de la incisión.
• En casos poco frecuentes, pueden formarse coágulos en las venas tratadas.
• Eventualmente y sólo en algunos casos puede ocurrir daño en los nervios.
• Quemaduras en la piel, si el láser no se utiliza correctamente.
• Sensación de tirantez o tensión a lo largo de la vena tratada.
• Ocasionalmente adormecimiento o sensación de hormigueo.
• Formación de coágulos en venas profundas.
• Daño a nervios adyacentes que puede provocar dolor o pérdida temporal de sensibilidad.
• En algunos casos pueden desarrollar venas várices en el futuro si no se toman medidas preventivas.

4. PIELES NO APTAS PARA ESTE TIPO DE PROCEDIMIENTO:
Se debe evitar la terapia láser para venas várices en pieles con infecciones activas, con heridas abiertas o úlceras, extremadamente sensibles, con dermatitis severa, psoriasis activa o eczema, pieles con pigmentación muy oscura o pieles propensas a desarrollar queloides o cicatrices hipertróficas, pieles tatuadas y especialmente con tatuajes oscuros.

5. ALTERNATIVAS AL TRATAMIENTO:
Escleroterapia, ablación por radiofrecuencia (RFA), microflebectomía, cirugía tradicional (stripping venoso), medias de compresión y cambios en el estilo de vida para el alivio de los síntomas.

6. RECOMENDACIONES POST PROCEDIMIENTO:
Se deben utilizar medias de compresión, caminar continuamente, evitar levantar objetos pesados, realizar ejercicios extenuantes o permanecer demasiado tiempo de pie. Usar protector solar en la zona tratada. Asistir a las citas de control para evaluar la evolución del tratamiento y detectar posibles complicaciones a tiempo.

7. DECLARACIÓN DE LA IPS:
Aunque la terapia láser para el control de venas várices tiene un alto porcentaje de efectividad, su eficacia depende de varios factores, entre ellos la gravedad de las várices y el cumplimiento de los cuidados posteriores al procedimiento, los cuales dependen del paciente y se encuentran fuera de nuestro control directo. Por lo tanto la IPS ${ips.nombre} no puede asumir un porcentaje de efectividad en los resultados y NO realizará ningún tipo de devolución de dinero una vez iniciado el tratamiento.

8. DECLARACIÓN DEL PACIENTE:
Me han explicado y comprendo satisfactoriamente la esencia y el propósito de este procedimiento, así como los posibles riesgos y complicaciones, y las otras alternativas de tratamiento. He tenido la oportunidad de hacer todas las preguntas que desee y he recibido respuestas satisfactorias.

Al firmar este apartado, SI doy mi consentimiento libre y voluntario para proceder con el tratamiento. Autorizo al ${ips.medico} (${ips.rm}) para la realización del procedimiento.

9. DISENTIMIENTO:
Tengo dudas sobre el procedimiento o no estoy de acuerdo con su realización. En ese caso, firmo mi disentimiento y NO autorizo el tratamiento.`;
}

const CHART_MENSUAL = [
  { mes: "Feb", escler: 8, suero: 5, laser: 3 },
  { mes: "Mar", escler: 12, suero: 7, laser: 5 },
  { mes: "Abr", escler: 10, suero: 9, laser: 4 },
  { mes: "May", escler: 15, suero: 11, laser: 7 },
  { mes: "Jun", escler: 18, suero: 8, laser: 9 },
  { mes: "Jul", escler: 22, suero: 13, laser: 11 },
];
const CHART_TIPOS = [
  { name: "Escleroterapia", value: 46, color: "#031CA6" },
  { name: "Sueroterapia",   value: 29, color: "#0D51D9" },
  { name: "Láser Várices",  value: 25, color: "#0D8BD9" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function genRadicado(tipo: TipoConsent, n: number) {
  const prefix = { escleroterapia: "ESC", sueroterapia: "SUE", laser: "LAS", paquete: "PAQ" }[tipo];
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}
function hoy() { return new Date().toISOString().split("T")[0]; }
function fmtFecha(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function fmtHora(iso: string) {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }); } catch { return "—"; }
}
function calcIMC(peso: string, talla: string): string {
  const p = parseFloat(peso), t = parseFloat(talla) / 100;
  if (!p || !t) return "";
  return (p / (t * t)).toFixed(1);
}
function genId() { return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`; }

// ─── TOAST ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; type: "success" | "error" | "info" | "warning"; msg: string; }
function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[400] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white
          ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : t.type === "warning" ? "bg-amber-600" : "bg-[#0D51D9]"}`}>
          {t.type === "success" ? <Check size={15}/> : t.type === "error" ? <XCircle size={15}/> : t.type === "warning" ? <AlertTriangle size={15}/> : <Bell size={15}/>}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={13} className="opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── BADGES ──────────────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: EstadoConsent }) {
  const cfg: Record<EstadoConsent, { c: string; icon: React.ReactNode; label: string }> = {
    FIRMADO:   { c: "bg-blue-50 text-blue-700 border-blue-200",       icon: <Clock size={11}/>,         label: "Firmado · Pendiente Médico" },
    PENDIENTE: { c: "bg-amber-50 text-amber-700 border-amber-200",    icon: <Clock size={11}/>,         label: "Pendiente" },
    APROBADO:  { c: "bg-emerald-50 text-emerald-700 border-emerald-200",icon: <CheckCircle size={11}/>, label: "Aprobado" },
    RECHAZADO: { c: "bg-red-50 text-red-600 border-red-200",          icon: <XCircle size={11}/>,       label: "Rechazado" },
    ANULADO:   { c: "bg-gray-100 text-gray-500 border-gray-200",      icon: <XCircle size={11}/>,       label: "Anulado" },
  };
  const { c, icon, label } = cfg[estado] ?? cfg.PENDIENTE;
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${c}`}>{icon} {label}</span>;
}

function TipoBadge({ tipo }: { tipo: TipoConsent }) {
  const cfg = {
    escleroterapia: { color: "bg-[#0D51D9]/10 text-[#0D51D9]",   icon: <Syringe size={10}/>, label: "Escleroterapia" },
    sueroterapia:   { color: "bg-[#0D8BD9]/10 text-[#0D8BD9]",   icon: <Droplets size={10}/>, label: "Sueroterapia"  },
    laser:          { color: "bg-amber-100 text-amber-700",        icon: <Zap size={10}/>,     label: "Láser Várices" },
    paquete:        { color: "bg-purple-100 text-purple-700",      icon: <Package size={10}/>, label: "Paquete"       },
  }[tipo];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>;
}

function RolBadge({ rol }: { rol: RolUsuario }) {
  const cfg: Record<RolUsuario, string> = {
    "MÉDICO":        "bg-[#0D51D9]/10 text-[#0D51D9]",
    "ADMINISTRADOR": "bg-purple-100 text-purple-700",
    "AUXILIAR":      "bg-emerald-100 text-emerald-700",
    "ENFERMERA":     "bg-pink-100 text-pink-700",
    "TÉCNICO":       "bg-amber-100 text-amber-700",
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${cfg[rol] ?? "bg-gray-100 text-gray-600"}`}>{rol}</span>;
}

// ─── SIGNATURE CANVAS ─────────────────────────────────────────────────────────
function SignatureCanvas({ label, onSave, onCancel }: { label: string; onSave: (d: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = "touches" in e ? e.touches[0] : e as MouseEvent;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#031CA6"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const p = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move  = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const p = getPos(e, canvas); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true); };
    const end   = () => { drawing.current = false; };
    canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move); canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false }); canvas.addEventListener("touchmove", move, { passive: false }); canvas.addEventListener("touchend", end);
    return () => { canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", move); canvas.removeEventListener("mouseup", end); canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", end); };
  }, []);

  const clear = () => { const c = canvasRef.current!; const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); setHasDrawn(false); };

  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0D51D9]/10 flex items-center justify-center"><Pen size={15} className="text-[#0D51D9]"/></div>
            <div><p className="font-semibold text-sm">{label}</p><p className="text-[10px] text-muted-foreground">Firme con dedo en móvil/tablet o mouse en PC</p></div>
          </div>
          <button onClick={onCancel}><X size={18} className="text-muted-foreground"/></button>
        </div>
        <div className="p-4 sm:p-5">
          <div className="border-2 border-dashed border-[#0D51D9]/30 rounded-xl overflow-hidden bg-[#f8faff]">
            <canvas ref={canvasRef} width={600} height={220} className="w-full cursor-crosshair" style={{ touchAction: "none" }}/>
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2">Dibuje su firma — funciona con dedo, lápiz táctil o mouse</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={clear} className="py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Limpiar</button>
            <button onClick={onCancel} className="py-2.5 rounded-lg border border-border text-sm font-medium">Cancelar</button>
            <button onClick={() => onSave(canvasRef.current!.toDataURL("image/png"))} disabled={!hasDrawn}
              className="py-2.5 rounded-lg bg-[#0D51D9] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#1648bf] transition-colors">
              Confirmar ✓
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FirmaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
        {value ? (
          <div className="flex items-center gap-3 p-3 border border-emerald-300 bg-emerald-50 rounded-xl">
            <img src={value} alt="firma" className="h-12 bg-white border border-emerald-200 rounded"/>
            <div className="flex-1"><p className="text-xs font-semibold text-emerald-700">Firma registrada ✓</p></div>
            <button onClick={() => onChange("")} className="text-[11px] text-red-500 hover:underline font-medium">Repetir</button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)}
            className="w-full border-2 border-dashed border-[#0D51D9]/30 rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-[#0D51D9]/5 transition-colors">
            <Pen size={22} className="text-[#0D51D9]/40"/>
            <p className="text-sm font-semibold text-[#0D51D9]">Toque aquí para firmar</p>
            <p className="text-[10px] text-muted-foreground">Funciona con dedo en tablet o mouse</p>
          </button>
        )}
      </div>
      {open && <SignatureCanvas label={label} onSave={v => { onChange(v); setOpen(false); }} onCancel={() => setOpen(false)}/>}
    </>
  );
}

// ─── FIELD HELPER ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", required = false, icon, readOnly = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; icon?: React.ReactNode; readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">{icon}</div>}
        <input readOnly={readOnly} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full border border-border rounded-lg ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30 focus:border-[#0D51D9] transition-colors
            ${readOnly ? "bg-muted text-muted-foreground cursor-default" : "bg-input-background"}`}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════
const PACIENTE_EMPTY: DatosPaciente = {
  tipoDoc: "CC", documento: "", nombre: "", telefono: "", email: "",
  direccion: "", ciudad: "", fechaNacimiento: "", fecha: hoy(),
  contactoNombre: "", contactoParentesco: "", contactoTelefono: "",
};

function StepDatosPaciente({ data, onChange }: { data: DatosPaciente; onChange: (d: DatosPaciente) => void }) {
  const ips = useIPS();
  const s = (k: keyof DatosPaciente) => (v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-5">
      <div className="p-3 bg-[#031CA6] rounded-xl flex items-center gap-3">
        <ImageWithFallback src={medfisLogo} alt="Med&Fis Logo" className="w-9 h-9 object-contain flex-shrink-0 rounded-lg bg-white p-0.5"/>
        <div>
          <p className="text-[10px] font-bold text-white uppercase tracking-wider">{ips.nombre} · NIT {ips.nit}</p>
          <p className="text-[10px] text-[#7A94C5]">{ips.medico} · {ips.rm}</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#0D51D9] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield size={11}/> Identificación</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Tipo Doc <span className="text-red-500">*</span></label>
            <select value={data.tipoDoc} onChange={e => s("tipoDoc")(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30">
              <option value="CC">CC — Cédula Ciudadanía</option><option value="CE">CE — Cédula Extranjería</option>
              <option value="PA">PA — Pasaporte</option><option value="TI">TI — Tarjeta Identidad</option><option value="RC">RC — Registro Civil</option>
            </select>
          </div>
          <Field label="No. Documento" value={data.documento} onChange={s("documento")} placeholder="Número" required icon={<Shield size={13}/>}/>
        </div>
        <div className="mt-3"><Field label="Nombre completo" value={data.nombre} onChange={s("nombre")} placeholder="Nombres y apellidos completos" required icon={<UserCheck size={13}/>}/></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field label="Fecha de nacimiento" value={data.fechaNacimiento} onChange={s("fechaNacimiento")} type="date"/>
          <Field label="Fecha de consulta" value={data.fecha} onChange={s("fecha")} type="date" required/>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-[#0D51D9] uppercase tracking-wider mb-2 flex items-center gap-1.5"><Phone size={11}/> Contacto</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Teléfono / Celular" value={data.telefono} onChange={s("telefono")} placeholder="3001234567" type="tel" icon={<Phone size={13}/>} required/>
          <Field label="Correo electrónico" value={data.email} onChange={s("email")} placeholder="correo@ejemplo.com" type="email" icon={<AtSign size={13}/>}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
          <Field label="Dirección" value={data.direccion} onChange={s("direccion")} placeholder="Cra 45 #23-10" icon={<MapPin size={13}/>}/>
          <Field label="Ciudad" value={data.ciudad} onChange={s("ciudad")} placeholder="Medellín"/>
        </div>
      </div>
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Heart size={11}/> Contacto de Emergencia</p>
        <div className="space-y-3">
          <Field label="Nombre del contacto" value={data.contactoNombre} onChange={s("contactoNombre")} placeholder="Nombre completo" icon={<Users size={13}/>} required/>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Parentesco <span className="text-red-500">*</span></label>
              <select value={data.contactoParentesco} onChange={e => s("contactoParentesco")(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30">
                <option value="">Seleccionar...</option><option value="Cónyuge">Cónyuge</option><option value="Madre">Madre</option>
                <option value="Padre">Padre</option><option value="Hijo/a">Hijo/a</option><option value="Hermano/a">Hermano/a</option>
                <option value="Amigo/a">Amigo/a</option><option value="Otro">Otro</option>
              </select>
            </div>
            <Field label="Teléfono emergencia" value={data.contactoTelefono} onChange={s("contactoTelefono")} placeholder="3001234567" type="tel" icon={<Phone size={13}/>} required/>
          </div>
        </div>
      </div>
    </div>
  );
}

const VITALES_EMPTY = {
  oximetria: "", tension: "", frecuenciaCardiaca: "", frecuenciaRespiratoria: "",
  temperatura: "", peso: "", talla: "", imc: "", glucemia: "", observaciones: "",
};

function StepVitalesEnfermera({ data, onChange, extraContent }: {
  data: typeof VITALES_EMPTY; onChange: (d: typeof VITALES_EMPTY) => void; extraContent?: React.ReactNode;
}) {
  const s = (k: keyof typeof VITALES_EMPTY) => (v: string) => {
    const updated = { ...data, [k]: v };
    if (k === "peso" || k === "talla") updated.imc = calcIMC(updated.peso, updated.talla);
    onChange(updated);
  };
  const Vital = ({ label, k, placeholder, unit, color = "border-[#0D51D9]/20" }: { label: string; k: keyof typeof VITALES_EMPTY; placeholder: string; unit: string; color?: string }) => (
    <div className={`bg-white border-2 ${color} rounded-xl p-3 text-center`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{label}</p>
      <input value={data[k]} onChange={e => s(k)(e.target.value)} placeholder={placeholder}
        className="w-full text-center text-lg font-black border-0 focus:outline-none bg-transparent py-0.5 placeholder:text-muted-foreground/30"/>
      <p className="text-[10px] text-muted-foreground font-medium">{unit}</p>
    </div>
  );
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3 bg-[#0D51D9]/8 border border-[#0D51D9]/20 rounded-xl">
        <Activity size={16} className="text-[#0D51D9] flex-shrink-0"/>
        <div>
          <p className="text-xs font-bold text-[#0D51D9]">Sección Auxiliar de Enfermería</p>
          <p className="text-[10px] text-muted-foreground">Registre los signos vitales ANTES de que el paciente lea y firme el consentimiento</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Signos Vitales</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Vital label="SpO2" k="oximetria" placeholder="98" unit="%" color="border-blue-200"/>
          <Vital label="Tensión Arterial" k="tension" placeholder="120/80" unit="mmHg" color="border-red-200"/>
          <Vital label="Frec. Cardíaca" k="frecuenciaCardiaca" placeholder="72" unit="lpm" color="border-pink-200"/>
          <Vital label="Frec. Respiratoria" k="frecuenciaRespiratoria" placeholder="16" unit="rpm" color="border-sky-200"/>
          <Vital label="Temperatura" k="temperatura" placeholder="36.5" unit="°C" color="border-orange-200"/>
          <Vital label="Glucemia" k="glucemia" placeholder="90" unit="mg/dL" color="border-yellow-200"/>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Antropometría</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Vital label="Peso" k="peso" placeholder="65" unit="kg" color="border-emerald-200"/>
          <Vital label="Talla" k="talla" placeholder="165" unit="cm" color="border-teal-200"/>
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">IMC</p>
            <p className="text-lg font-black text-emerald-700">{data.imc || "—"}</p>
            <p className="text-[10px] text-emerald-600 font-medium">kg/m²</p>
          </div>
        </div>
      </div>
      {extraContent && <div>{extraContent}</div>}
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Observaciones de Enfermería</label>
        <textarea value={data.observaciones} onChange={e => s("observaciones")(e.target.value)}
          rows={3} placeholder="Anotaciones relevantes..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30 resize-none"/>
      </div>
    </div>
  );
}

function StepCuestionario({ data, onChange }: { data: Record<string, "Si" | "No" | "">; onChange: (d: Record<string, "Si" | "No" | "">) => void }) {
  const answered = Object.values(data).filter(v => v !== "").length;
  return (
    <div className="space-y-2">
      <div className="bg-[#EFF3FB] rounded-xl p-3 mb-3 flex items-center justify-between">
        <div><p className="text-xs font-bold text-[#0D51D9]">Test Diagnóstico</p><p className="text-[10px] text-muted-foreground">Marque Sí o No</p></div>
        <span className="bg-[#0D51D9] text-white text-xs font-bold px-2.5 py-1 rounded-lg">{answered}/{CUESTIONARIO_PREGUNTAS.length}</span>
      </div>
      {CUESTIONARIO_PREGUNTAS.map((q, i) => (
        <div key={i} className="flex items-start justify-between gap-3 p-3 bg-white border border-border rounded-xl hover:border-[#0D51D9]/30 transition-colors">
          <p className="text-xs flex-1 leading-relaxed">{q}</p>
          <div className="flex gap-1.5 flex-shrink-0">
            {(["Si", "No"] as const).map(opt => (
              <button key={opt} onClick={() => onChange({ ...data, [q]: opt })}
                className={`w-10 py-1.5 rounded-lg text-xs font-bold border transition-colors
                  ${data[q] === opt ? opt === "Si" ? "bg-red-500 border-red-500 text-white" : "bg-emerald-500 border-emerald-500 text-white" : "border-border text-muted-foreground hover:border-[#0D51D9]/40"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StepLeerConsentimiento({ titulo, texto, leido, onLeido }: { titulo: string; texto: string; leido: boolean; onLeido: (v: boolean) => void }) {
  const ips = useIPS();
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handleScroll = () => { const el = scrollRef.current; if (!el) return; if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setScrolledToEnd(true); };
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <BookOpen size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
        <div><p className="text-xs font-bold text-amber-800">Lectura obligatoria del consentimiento</p><p className="text-[10px] text-amber-700 mt-0.5">El paciente debe leer el documento completo.</p></div>
      </div>
      <div className="border-2 border-[#0D51D9]/20 rounded-xl overflow-hidden">
        <div className="bg-[#031CA6] px-4 py-3">
          <p className="text-[10px] text-[#C5D5F0] font-bold uppercase tracking-wider">Consentimiento Informado</p>
          <p className="text-xs text-white font-semibold">{titulo}</p>
          <p className="text-[10px] text-[#7A94C5] mt-0.5">{ips.nombre} · NIT {ips.nit} · {ips.medico}</p>
        </div>
        <div ref={scrollRef} onScroll={handleScroll} className="h-72 overflow-y-auto p-5 bg-white text-xs leading-relaxed text-foreground whitespace-pre-line">
          {texto}
          <div className="mt-6 pt-4 border-t border-dashed border-border text-center text-[10px] text-muted-foreground">
            — Fin del documento · {ips.nombre} · {new Date().getFullYear()} —
          </div>
        </div>
        {!scrolledToEnd ? (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2"><Info size={12} className="text-amber-600"/><p className="text-[10px] text-amber-700">Desplace el texto hasta el final</p></div>
        ) : (
          <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 flex items-center gap-2"><CheckCircle size={12} className="text-emerald-600"/><p className="text-[10px] text-emerald-700">Documento leído completamente</p></div>
        )}
      </div>
      {scrolledToEnd && (
        <button onClick={() => onLeido(true)}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 font-semibold text-sm transition-all
            ${leido ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-[#0D51D9] bg-[#0D51D9]/5 text-[#0D51D9] hover:bg-[#0D51D9]/10"}`}>
          <CheckCircle size={18}/>
          {leido ? "Leído y comprendido ✓" : "Confirmar que leí y comprendí el documento"}
        </button>
      )}
    </div>
  );
}

function StepFirmaFinal({ consentido, onConsentido, firma, onFirma, nombrePaciente }: {
  consentido: boolean | null; onConsentido: (v: boolean) => void;
  firma: string; onFirma: (v: string) => void; nombrePaciente: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-[#EFF3FB] rounded-xl border border-[#0D51D9]/15">
        <Shield size={16} className="text-[#0D51D9] flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-xs font-bold text-[#0D51D9]">Decisión y Firma del Paciente</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Al firmar, se notificará automáticamente al médico para su aprobación.</p>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Decisión del Paciente</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onConsentido(true)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${consentido === true ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
            <ThumbsUp size={22} className={consentido === true ? "text-emerald-600" : "text-muted-foreground"}/>
            <div className="text-left"><p className={`text-sm font-bold ${consentido === true ? "text-emerald-700" : "text-muted-foreground"}`}>CONSIENTO</p><p className="text-[10px] text-muted-foreground">Autorizo el procedimiento</p></div>
          </button>
          <button onClick={() => onConsentido(false)} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${consentido === false ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}>
            <ThumbsDown size={22} className={consentido === false ? "text-red-600" : "text-muted-foreground"}/>
            <div className="text-left"><p className={`text-sm font-bold ${consentido === false ? "text-red-700" : "text-muted-foreground"}`}>DISIENTO</p><p className="text-[10px] text-muted-foreground">NO autorizo</p></div>
          </button>
        </div>
      </div>
      <FirmaField label={`Firma del Paciente — ${nombrePaciente || "Paciente"}`} value={firma} onChange={onFirma}/>
      {firma && consentido !== null && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${consentido ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
          {consentido ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
          {consentido ? "✓ Firmado. El médico recibirá notificación para dar su Visto Bueno." : "Disentimiento registrado. No se realizará el procedimiento."}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF VIEWER
// ═══════════════════════════════════════════════════════════════════════════════
function PDFViewer({ record, onSendEmail, onSendWhatsApp }: {
  record: ConsentRecord; onSendEmail: () => void; onSendWhatsApp: () => void;
}) {
  const ips = useIPS();
  const d = record.datos as any;
  const pac = d.paciente as DatosPaciente;
  const vitales = d.vitales as typeof VITALES_EMPTY;

  const TITULOS: Record<TipoConsent, string> = {
    escleroterapia: "ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES",
    sueroterapia:   "SUEROTERAPIA VITAMINA C Y/O COMPLEJO B",
    laser:          "TERAPIA LÁSER ND:YAG PARA CONTROL DE VENAS VÁRICES",
    paquete:        "PAQUETE COMPLETO — ESCLEROTERAPIA · SUEROTERAPIA · LÁSER ND:YAG",
  };

  return (
    <div className="bg-white p-7 max-w-[640px] mx-auto text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-[#0D51D9]">
        <div className="flex items-center gap-3">
          <ImageWithFallback src={medfisLogo} alt="Med&Fis Logo" className="w-14 h-14 object-contain"/>
          <div><p className="font-black text-2xl text-[#031CA6] tracking-tight">{ips.nombre}</p><p className="text-[10px] text-muted-foreground font-mono">NIT {ips.nit}</p><p className="text-[10px] text-muted-foreground">{ips.ciudad}</p></div>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-[#0D51D9] font-bold">{record.radicado}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFecha(record.fecha)}</p>
          <div className="mt-1 flex flex-col items-end gap-1"><StatusBadge estado={record.estado}/></div>
        </div>
      </div>

      {record.estado === "APROBADO" && (
        <div className="mb-4 p-3 bg-emerald-50 border-2 border-emerald-400 rounded-xl flex items-center gap-3">
          <CalendarCheck size={18} className="text-emerald-600"/>
          <div>
            <p className="text-xs font-bold text-emerald-800">✓ VISTO BUENO MÉDICO — PROCEDER CON CITA DE CONSULTA</p>
            {record.aprobadoPor && <p className="text-[10px] text-emerald-700">Aprobado por: {record.aprobadoPor} · {record.fechaAprobacion ? fmtFecha(record.fechaAprobacion) : ""}</p>}
          </div>
        </div>
      )}

      {record.estado === "RECHAZADO" && record.motivoRechazo && (
        <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-xl">
          <p className="text-xs font-bold text-red-800">✗ RECHAZADO POR EL MÉDICO</p>
          <p className="text-[10px] text-red-700 mt-1">Motivo: {record.motivoRechazo}</p>
        </div>
      )}

      <p className="text-center font-black text-sm uppercase tracking-wide text-[#031CA6] mb-1">CONSENTIMIENTO INFORMADO</p>
      <p className="text-center text-xs font-bold text-[#0D51D9] mb-5">{TITULOS[record.tipo]}</p>

      {record.tipo === "paquete" && (
        <div className="mb-4 flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0D51D9]/10 text-[#0D51D9] rounded-full text-[10px] font-bold"><Syringe size={10}/> Escleroterapia</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#0D8BD9]/10 text-[#0D8BD9] rounded-full text-[10px] font-bold"><Droplets size={10}/> Sueroterapia</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold"><Zap size={10}/> Láser ND:YAG</span>
        </div>
      )}

      <div className="mb-4 p-3 bg-[#EFF3FB] rounded-xl">
        <p className="text-[9px] font-bold text-[#0D51D9] uppercase tracking-wider mb-2">Datos del Paciente</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs font-bold">{pac?.nombre}</p>
            <p className="text-[10px] text-muted-foreground font-mono">{pac?.tipoDoc}: {pac?.documento}</p>
            {pac?.fechaNacimiento && <p className="text-[10px] text-muted-foreground">Nac: {fmtFecha(pac.fechaNacimiento)}</p>}
            <p className="text-[10px] text-muted-foreground">Tel: {pac?.telefono}</p>
            {pac?.email && <p className="text-[10px] text-muted-foreground">{pac.email}</p>}
            {pac?.direccion && <p className="text-[10px] text-muted-foreground">{pac.direccion}{pac.ciudad ? `, ${pac.ciudad}` : ""}</p>}
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Médico Tratante</p>
            <p className="text-xs font-bold">{ips.medico}</p>
            <p className="text-[10px] text-muted-foreground">{ips.rm}</p>
            <p className="text-[10px] text-muted-foreground">Fecha: {fmtFecha(record.fecha)}</p>
            {record.creadoPor && <p className="text-[10px] text-muted-foreground">Registrado por: {record.creadoPor}</p>}
            {pac?.contactoNombre && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg">
                <p className="text-[9px] font-bold text-red-700 uppercase">Emergencia:</p>
                <p className="text-[10px]">{pac.contactoNombre} ({pac.contactoParentesco})</p>
                <p className="text-[10px]">{pac.contactoTelefono}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {vitales && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Signos Vitales — Enfermería</p>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[["SpO2", vitales.oximetria + "%"], ["T.A.", vitales.tension], ["F.C.", vitales.frecuenciaCardiaca + " lpm"], ["F.R.", vitales.frecuenciaRespiratoria + " rpm"], ["Temp.", vitales.temperatura + "°C"]].map(([l,v]) => (
              <div key={l} className="bg-[#EFF3FB] rounded-lg p-2 text-center"><p className="text-[8px] text-muted-foreground font-bold">{l}</p><p className="text-[10px] font-bold">{v || "—"}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[["Peso", vitales.peso + " kg"], ["Talla", vitales.talla + " cm"], ["IMC", vitales.imc + " kg/m²"]].map(([l,v]) => (
              <div key={l} className="bg-emerald-50 rounded-lg p-2 text-center"><p className="text-[8px] text-muted-foreground font-bold">{l}</p><p className="text-[10px] font-bold text-emerald-700">{v || "—"}</p></div>
            ))}
          </div>
          {vitales.observaciones && <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg"><p className="text-[9px] font-bold text-blue-700 uppercase">Obs. Enfermería:</p><p className="text-[10px]">{vitales.observaciones}</p></div>}
        </div>
      )}

      {(record.tipo === "escleroterapia" || record.tipo === "paquete") && d.cuestionario && Object.keys(d.cuestionario).length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Syringe size={9}/> Test Diagnóstico</p>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(d.cuestionario).map(([pregunta, resp]: [string, any]) => (
              <div key={pregunta} className="flex items-start gap-1.5 p-1.5 bg-[#F8FAFF] rounded text-[9px]">
                <span className={`font-bold flex-shrink-0 px-1 rounded text-[9px] ${resp === "Si" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>{resp}</span>
                <span className="text-muted-foreground leading-tight">{pregunta.substring(0, 60)}{pregunta.length > 60 ? "..." : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(record.tipo === "sueroterapia" || record.tipo === "paquete") && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Droplets size={9}/> Prescripción — Sueroterapia</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="bg-[#EFF3FB] rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Vitamina C</p><p className="text-xs font-bold">{d.dosis_vitC || "—"}</p></div>
            <div className="bg-[#EFF3FB] rounded-lg p-2 text-center"><p className="text-[9px] text-muted-foreground">Complejo B</p><p className="text-xs font-bold">{d.dosis_compB || "—"}</p></div>
          </div>
          {d.trazabilidad && (
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(d.trazabilidad).map(([k, v]) => (
                <div key={k} className="bg-[#F8FAFF] border border-border rounded p-1.5 text-center">
                  <p className="text-[8px] text-muted-foreground">{k === "nacl" ? "NaCl 0.9%" : k === "vitC" ? "Vit C" : k === "compB" ? "Comp B" : k === "pericraneal" ? "Pericran." : k}</p>
                  <p className="text-[9px] font-mono font-bold">{v as string || "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(record.tipo === "laser" || record.tipo === "paquete") && d.parametros?.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Zap size={9}/> Parámetros ND:YAG</p>
          <table className="w-full text-[9px] border border-border rounded-lg overflow-hidden">
            <thead><tr className="bg-[#031CA6] text-[#C5D5F0]">{["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases"].map(h => <th key={h} className="px-1.5 py-1.5 text-left font-semibold">{h}</th>)}</tr></thead>
            <tbody>
              {d.parametros.map((row: LaserRow, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"}>
                  {[row.fototipo,row.pieza,row.modo,row.frecuencia,row.fluencia,row.energia,row.area,row.pases].map((v, j) => <td key={j} className="px-1.5 py-1 border-t border-border font-mono">{v || "—"}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 pt-5 border-t-2 border-dashed border-border">
        <p className="text-[9px] text-center text-muted-foreground mb-4 font-medium">El paciente declara haber LEÍDO, COMPRENDIDO y tomado su decisión de manera LIBRE y VOLUNTARIA.</p>
        <div className="flex justify-center mb-3">
          <div className="text-center w-56">
            {d.firmaConsentimiento ? (
              <img src={d.firmaConsentimiento} alt="firma" className="w-full h-20 object-contain border-2 border-[#0D51D9]/20 rounded-xl bg-[#f8faff] mb-2"/>
            ) : (
              <div className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl mb-2 flex items-center justify-center"><p className="text-[9px] text-muted-foreground">Firma pendiente</p></div>
            )}
            <div className="border-t border-foreground/40 pt-2">
              <p className="text-[10px] font-bold">{pac?.nombre}</p>
              <p className="text-[9px] text-muted-foreground">{pac?.tipoDoc}: {pac?.documento}</p>
              <p className="text-[9px] text-muted-foreground">Firma del Paciente</p>
            </div>
          </div>
        </div>
        <div className={`mt-3 p-3 rounded-xl text-center text-xs font-bold border ${d.consentido === true ? "bg-emerald-50 border-emerald-300 text-emerald-800" : d.consentido === false ? "bg-red-50 border-red-300 text-red-800" : "bg-muted text-muted-foreground border-border"}`}>
          {d.consentido === true ? "✓ PACIENTE CONSINTIÓ — AUTORIZA LA REALIZACIÓN DEL PROCEDIMIENTO" : d.consentido === false ? "✗ PACIENTE DISENTIÓ — NO AUTORIZA" : "Decisión no registrada"}
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="text-center">
            <div className="h-12 border-b border-foreground/30 mb-1"/>
            <p className="text-[9px] font-bold">{ips.medico}</p>
            <p className="text-[9px] text-muted-foreground">{ips.rm}</p>
            <p className="text-[9px] text-muted-foreground">Médico Responsable</p>
          </div>
          <div className="text-center">
            <div className="h-12 border-b border-foreground/30 mb-1"/>
            <p className="text-[9px] font-bold">Auxiliar de Enfermería</p>
            <p className="text-[9px] text-muted-foreground">{ips.nombre}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <p className="text-[8px] text-muted-foreground">Documento digital · {ips.nombre} · NIT {ips.nit} · {new Date().toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" })}</p>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={onSendWhatsApp} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20ba5a] transition-colors"><MessageSquare size={16}/> WhatsApp</button>
        <button onClick={onSendEmail} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors"><Mail size={16}/> Email</button>
      </div>
      <div className="flex gap-2 mt-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"><Printer size={14}/> Imprimir</button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted"><Download size={14}/> Descargar PDF</button>
      </div>
    </div>
  );
}

function PDFModal({ record, onClose, addToast }: { record: ConsentRecord; onClose: () => void; addToast: (t: "success"|"error"|"info"|"warning", m: string) => void }) {
  const ips = useIPS();
  const d = record.datos as any;
  const pac = d.paciente as DatosPaciente;
  const handleWA = () => {
    const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac?.nombre},\n\n📋 Radicado: ${record.radicado}\n📅 Fecha: ${fmtFecha(record.fecha)}\n✅ Estado: ${record.estado}\n\n_${ips.nombre} · NIT ${ips.nit}_`);
    window.open(`https://wa.me/57${pac?.telefono?.replace(/[^0-9]/g,"")}?text=${msg}`, "_blank");
    addToast("info", "Abriendo WhatsApp...");
  };
  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-end sm:items-center justify-center sm:p-3">
      <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[95vh] sm:max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-border rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-[#0D51D9]"/>
            <div><p className="font-bold text-sm">{record.radicado}</p><div className="flex items-center gap-2 flex-wrap"><StatusBadge estado={record.estado}/><TipoBadge tipo={record.tipo}/></div></div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} className="text-muted-foreground"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">
          <PDFViewer record={record} onSendEmail={() => addToast("success", `Email enviado`)} onSendWhatsApp={handleWA}/>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// WIZARD HELPERS
// ═══════════════════════════════════════════════════════════════════════════════
function WizardHeader({ steps, current, titulo, icon }: { steps: string[]; current: number; titulo: string; icon: React.ReactNode }) {
  return (
    <div className="flex-shrink-0 px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0D51D9]/10 flex items-center justify-center text-[#0D51D9] flex-shrink-0">{icon}</div>
        <div className="min-w-0">
          <p className="font-bold text-sm truncate">{titulo}</p>
          <p className="text-[10px] text-muted-foreground">Paso {current}/{steps.length}: <span className="hidden xs:inline">{steps[current - 1]}</span></p>
        </div>
      </div>
      <div className="flex gap-1">{steps.map((_, i) => <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < current ? "bg-[#0D51D9]" : "bg-border"}`}/>)}</div>
    </div>
  );
}

function NavButtons({ step, total, onBack, onNext, onFinish, canNext = true, finishing = false }: {
  step: number; total: number; onBack: () => void; onNext: () => void; onFinish: () => void; canNext?: boolean; finishing?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-border flex-shrink-0">
      {step > 1 && <button onClick={onBack} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors"><ChevronLeft size={15}/> <span className="hidden sm:inline">Anterior</span></button>}
      <div className="flex-1"/>
      {step < total ? (
        <button onClick={onNext} disabled={!canNext} className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#1648bf] transition-colors">Siguiente <ChevronRight size={15}/></button>
      ) : (
        <button onClick={onFinish} disabled={!canNext || finishing} className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors">
          {finishing ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Guardando...</> : <><CheckCircle size={15}/> <span className="hidden sm:inline">Guardar y </span>Notificar Médico</>}
        </button>
      )}
    </div>
  );
}

function FormWrapper({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-end sm:items-center justify-center sm:p-3">
      <div className="bg-background rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl h-[95vh] sm:max-h-[96vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 pt-4 flex-shrink-0">
          <div className="w-10 h-1 bg-border rounded-full mx-auto sm:hidden"/>
          <div className="hidden sm:block"/>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} className="text-muted-foreground"/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PDFWrapper({ onCancel, children, titulo }: { onCancel: () => void; children: React.ReactNode; titulo: string }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-end sm:items-center justify-center sm:p-3">
      <div className="bg-gray-50 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl h-[95vh] sm:max-h-[96vh] flex flex-col">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-border rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/><p className="font-bold text-sm text-emerald-700">{titulo}</p></div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} className="text-muted-foreground"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-3 sm:p-4">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM ESCLEROTERAPIA
// ═══════════════════════════════════════════════════════════════════════════════
function FormEscleroterapia({ onSave, onCancel, addToast, nextId, userName }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void; nextId: number; userName: string;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales — Enfermería", "Cuestionario Médico", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState({ ...VITALES_EMPTY });
  const [cuest, setCuest] = useState<Record<string, "Si"|"No"|"">>({});
  const [leido, setLeido] = useState(false);
  const [firma, setFirma] = useState("");
  const [consentido, setConsentido] = useState<boolean | null>(null);
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "" && pac.contactoNombre.trim() !== "" && pac.contactoTelefono.trim() !== "";
    if (step === 4) return leido;
    if (step === 5) return firma !== "" && consentido !== null;
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const r: ConsentRecord = {
        id: genId(), tipo: "escleroterapia", radicado: genRadicado("escleroterapia", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", pendienteMedico: true, creadoPor: userName,
        datos: { paciente: pac, cuestionario: cuest, vitales, firmaConsentimiento: firma, consentido },
      };
      setRecord(r); onSave(r);
      addToast("success", `Consentimiento firmado · Médico notificado para aprobación`);
      setSaving(false); setStep(6);
    }, 900);
  };

  if (step === 6 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Firmado — Médico notificado para Visto Bueno">
      <PDFViewer record={record} onSendEmail={() => addToast("success", "Email enviado")} onSendWhatsApp={() => { window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`*${ips.nombre}* - Radicado: ${record.radicado}`)}`, "_blank"); addToast("info", "Abriendo WhatsApp..."); }}/>
    </PDFWrapper>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales}/>;
    if (step === 3) return <StepCuestionario data={cuest} onChange={setCuest}/>;
    if (step === 4) return <StepLeerConsentimiento titulo="Escleroterapia de Várices" texto={makeTextoEscleroterapia(ips)} leido={leido} onLeido={setLeido}/>;
    if (step === 5) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firma={firma} onFirma={setFirma} nombrePaciente={pac.nombre}/>;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Escleroterapia de Várices" icon={<Syringe size={18}/>}/>
      <div className="overflow-y-auto flex-1 px-5 pb-2">{content()}</div>
      <NavButtons step={step} total={5} onBack={() => setStep(s => s-1)} onNext={() => setStep(s => s+1)} onFinish={handleSave} canNext={canNext()} finishing={saving}/>
    </FormWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM SUEROTERAPIA
// ═══════════════════════════════════════════════════════════════════════════════
function FormSueroterapia({ onSave, onCancel, addToast, nextId, userName }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void; nextId: number; userName: string;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales + Prescripción", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState({ ...VITALES_EMPTY });
  const [dosis_vitC, setDosisVitC] = useState("");
  const [dosis_compB, setDosisCompB] = useState("");
  const [viaPrescripcion, setViaPrescripcion] = useState("Intravenosa");
  const [traz, setTraz] = useState({ nacl: "", vitC: "", compB: "", jeringa: "", pericraneal: "", macrogotero: "" });
  const [leido, setLeido] = useState(false);
  const [firma, setFirma] = useState("");
  const [consentido, setConsentido] = useState<boolean | null>(null);
  const [record, setRecord] = useState<ConsentRecord | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "" && pac.contactoNombre.trim() !== "" && pac.contactoTelefono.trim() !== "";
    if (step === 3) return leido;
    if (step === 4) return firma !== "" && consentido !== null;
    return true;
  };

  const PrescripcionExtra = (
    <div className="space-y-4 mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-2 p-2 bg-[#0D8BD9]/10 border border-[#0D8BD9]/30 rounded-xl"><Droplets size={14} className="text-[#0D8BD9]"/><p className="text-xs font-bold text-[#0D8BD9]">Prescripción Médica — Sueroterapia</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3 cc"/>
        <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4 cc"/>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Vía de Administración</label>
        <select value={viaPrescripcion} onChange={e => setViaPrescripcion(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30">
          <option>Intravenosa</option><option>Intramuscular</option><option>Subcutánea</option>
        </select>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trazabilidad M/DM — Lotes</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {([["NaCl 0.9%","nacl"],["Vitamina C","vitC"],["Complejo B","compB"],["Jeringa 3ml","jeringa"],["Pericraneal","pericraneal"],["Macrogotero","macrogotero"]] as [string, keyof typeof traz][]).map(([label,key]) => (
            <div key={key}><label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label><input value={traz[key]} onChange={e => setTraz({...traz,[key]:e.target.value})} placeholder="No. lote" className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none font-mono"/></div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const r: ConsentRecord = {
        id: genId(), tipo: "sueroterapia", radicado: genRadicado("sueroterapia", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", pendienteMedico: true, creadoPor: userName,
        datos: { paciente: pac, vitales, dosis_vitC, dosis_compB, viaPrescripcion, trazabilidad: traz, firmaConsentimiento: firma, consentido } as any,
      };
      setRecord(r); onSave(r);
      addToast("success", "Consentimiento firmado · Médico notificado");
      setSaving(false); setStep(5);
    }, 900);
  };

  if (step === 5 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Firmado — Médico notificado para Visto Bueno">
      <PDFViewer record={record} onSendEmail={() => addToast("success","Email enviado")} onSendWhatsApp={() => { window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`*${ips.nombre}* - Radicado: ${record.radicado}`)}`, "_blank"); addToast("info","Abriendo WhatsApp..."); }}/>
    </PDFWrapper>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} extraContent={PrescripcionExtra}/>;
    if (step === 3) return <StepLeerConsentimiento titulo="Sueroterapia Vitamina C / Complejo B" texto={makeTextoSueroterapia(ips)} leido={leido} onLeido={setLeido}/>;
    if (step === 4) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firma={firma} onFirma={setFirma} nombrePaciente={pac.nombre}/>;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Sueroterapia Vit C / Complejo B" icon={<Droplets size={18}/>}/>
      <div className="overflow-y-auto flex-1 px-5 pb-2">{content()}</div>
      <NavButtons step={step} total={4} onBack={() => setStep(s => s-1)} onNext={() => setStep(s => s+1)} onFinish={handleSave} canNext={canNext()} finishing={saving}/>
    </FormWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM LASER
// ═══════════════════════════════════════════════════════════════════════════════
function FormLaser({ onSave, onCancel, addToast, nextId, userName }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void; nextId: number; userName: string;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales + Parámetros", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState({ ...VITALES_EMPTY });
  const [params, setParams] = useState<LaserRow[]>([{ fototipo:"", pieza:"", modo:"", frecuencia:"", fluencia:"", energia:"", area:"", pases:"" }]);
  const [leido, setLeido] = useState(false);
  const [firma, setFirma] = useState("");
  const [consentido, setConsentido] = useState<boolean|null>(null);
  const [record, setRecord] = useState<ConsentRecord|null>(null);
  const [saving, setSaving] = useState(false);

  const updRow = (i: number, k: keyof LaserRow, v: string) => setParams(p => p.map((r, idx) => idx===i ? {...r,[k]:v} : r));
  const addRow = () => setParams(p => [...p,{fototipo:"",pieza:"",modo:"",frecuencia:"",fluencia:"",energia:"",area:"",pases:""}]);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "" && pac.contactoNombre.trim() !== "" && pac.contactoTelefono.trim() !== "";
    if (step === 3) return leido;
    if (step === 4) return firma !== "" && consentido !== null;
    return true;
  };

  const ParamsExtra = (
    <div className="space-y-3 mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex-1 mr-2"><Zap size={14} className="text-amber-600"/><p className="text-xs font-bold text-amber-800">Parámetros ND:YAG</p></div>
        <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0D51D9] text-white text-xs font-medium hover:bg-[#1648bf]"><Plus size={12}/> Fila</button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[10px]">
          <thead><tr className="bg-[#031CA6] text-[#C5D5F0]">{["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases",""].map(h => <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
          <tbody>
            {params.map((row, i) => (
              <tr key={i} className={i%2===0?"bg-white":"bg-[#F8FAFF]"}>
                {(["fototipo","pieza","modo","frecuencia","fluencia","energia","area","pases"] as (keyof LaserRow)[]).map(k => (
                  <td key={k} className="px-1 py-1"><input value={row[k]} onChange={e => updRow(i,k,e.target.value)} className="w-full min-w-[44px] border border-transparent focus:border-[#0D51D9]/40 rounded px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono"/></td>
                ))}
                <td className="px-1 py-1">{params.length > 1 && <button onClick={() => setParams(p => p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={10}/></button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const r: ConsentRecord = {
        id: genId(), tipo: "laser", radicado: genRadicado("laser", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", pendienteMedico: true, creadoPor: userName,
        datos: { paciente: pac, vitales, parametros: params, firmaConsentimiento: firma, consentido },
      };
      setRecord(r); onSave(r);
      addToast("success","Consentimiento firmado · Médico notificado");
      setSaving(false); setStep(5);
    }, 900);
  };

  if (step === 5 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Firmado — Médico notificado para Visto Bueno">
      <PDFViewer record={record} onSendEmail={() => addToast("success","Email enviado")} onSendWhatsApp={() => { window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`*${ips.nombre}* - Radicado: ${record.radicado}`)}`, "_blank"); addToast("info","Abriendo WhatsApp..."); }}/>
    </PDFWrapper>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} extraContent={ParamsExtra}/>;
    if (step === 3) return <StepLeerConsentimiento titulo="Terapia Láser ND:YAG" texto={makeTextoLaser(ips)} leido={leido} onLeido={setLeido}/>;
    if (step === 4) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firma={firma} onFirma={setFirma} nombrePaciente={pac.nombre}/>;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Terapia Láser ND:YAG" icon={<Zap size={18}/>}/>
      <div className="overflow-y-auto flex-1 px-5 pb-2">{content()}</div>
      <NavButtons step={step} total={4} onBack={() => setStep(s => s-1)} onNext={() => setStep(s => s+1)} onFinish={handleSave} canNext={canNext()} finishing={saving}/>
    </FormWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM PAQUETE COMPLETO
// ═══════════════════════════════════════════════════════════════════════════════
function FormPaquete({ onSave, onCancel, addToast, nextId, userName }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void; nextId: number; userName: string;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente","Vitales + Cuestionario","Suero + Láser","Leer · Escleroterapia","Leer · Sueroterapia","Leer · Láser","Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState({ ...VITALES_EMPTY });
  const [cuest, setCuest] = useState<Record<string, "Si"|"No"|"">>({});
  const [dosis_vitC, setDosisVitC] = useState("");
  const [dosis_compB, setDosisCompB] = useState("");
  const [viaPrescripcion, setViaPrescripcion] = useState("Intravenosa");
  const [traz, setTraz] = useState({ nacl: "", vitC: "", compB: "", jeringa: "", pericraneal: "", macrogotero: "" });
  const [params, setParams] = useState<LaserRow[]>([{ fototipo:"", pieza:"", modo:"", frecuencia:"", fluencia:"", energia:"", area:"", pases:"" }]);
  const [leido1, setLeido1] = useState(false);
  const [leido2, setLeido2] = useState(false);
  const [leido3, setLeido3] = useState(false);
  const [firma, setFirma] = useState("");
  const [consentido, setConsentido] = useState<boolean|null>(null);
  const [record, setRecord] = useState<ConsentRecord|null>(null);
  const [saving, setSaving] = useState(false);

  const updRow = (i: number, k: keyof LaserRow, v: string) => setParams(p => p.map((r, idx) => idx===i ? {...r,[k]:v} : r));

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "" && pac.contactoNombre.trim() !== "" && pac.contactoTelefono.trim() !== "";
    if (step === 4) return leido1;
    if (step === 5) return leido2;
    if (step === 6) return leido3;
    if (step === 7) return firma !== "" && consentido !== null;
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const datos: DatosPaquete = { paciente: pac, vitales, cuestionario: cuest, dosis_vitC, dosis_compB, viaPrescripcion, trazabilidad: traz, parametros: params, firmaConsentimiento: firma, consentido };
      const r: ConsentRecord = {
        id: genId(), tipo: "paquete", radicado: genRadicado("paquete", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", pendienteMedico: true, creadoPor: userName, datos,
      };
      setRecord(r); onSave(r);
      addToast("success", "Paquete Completo firmado — Médico notificado para Visto Bueno");
      setSaving(false); setStep(8);
    }, 1200);
  };

  if (step === 8 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Paquete Completo — Médico notificado para Visto Bueno">
      <PDFViewer record={record} onSendEmail={() => addToast("success","Email enviado")} onSendWhatsApp={() => { window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${encodeURIComponent(`*${ips.nombre}* - Radicado: ${record.radicado}`)}`, "_blank"); addToast("info","Abriendo WhatsApp..."); }}/>
    </PDFWrapper>
  );

  const SueroLaserExtra = (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-2.5 bg-[#0D8BD9]/10 border border-[#0D8BD9]/30 rounded-xl"><Droplets size={15} className="text-[#0D8BD9]"/><p className="text-xs font-bold text-[#0D8BD9]">Prescripción — Sueroterapia</p></div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3 cc"/>
          <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4 cc"/>
        </div>
        <div><label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Vía</label><select value={viaPrescripcion} onChange={e => setViaPrescripcion(e.target.value)} className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none"><option>Intravenosa</option><option>Intramuscular</option><option>Subcutánea</option></select></div>
        <div><p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lotes</p><div className="grid grid-cols-2 gap-2">{([["NaCl 0.9%","nacl"],["Vitamina C","vitC"],["Complejo B","compB"],["Jeringa 3ml","jeringa"],["Pericraneal","pericraneal"],["Macrogotero","macrogotero"]] as [string, keyof typeof traz][]).map(([label,key]) => (<div key={key}><label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label><input value={traz[key]} onChange={e => setTraz({...traz,[key]:e.target.value})} placeholder="No. lote" className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none font-mono"/></div>))}</div></div>
      </div>
      <div className="border-t border-border pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex-1 mr-2"><Zap size={15} className="text-amber-600"/><p className="text-xs font-bold text-amber-800">Parámetros ND:YAG</p></div>
          <button onClick={() => setParams(p => [...p,{fototipo:"",pieza:"",modo:"",frecuencia:"",fluencia:"",energia:"",area:"",pases:""}])} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0D51D9] text-white text-xs font-medium"><Plus size={12}/> Fila</button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-[10px]">
            <thead><tr className="bg-[#031CA6] text-[#C5D5F0]">{["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases",""].map(h => <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{params.map((row, i) => (<tr key={i} className={i%2===0?"bg-white":"bg-[#F8FAFF]"}>{(["fototipo","pieza","modo","frecuencia","fluencia","energia","area","pases"] as (keyof LaserRow)[]).map(k => (<td key={k} className="px-1 py-1"><input value={row[k]} onChange={e => updRow(i,k,e.target.value)} className="w-full min-w-[44px] border border-transparent focus:border-[#0D51D9]/40 rounded px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono"/></td>))}<td className="px-1 py-1">{params.length > 1 && <button onClick={() => setParams(p => p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={10}/></button>}</td></tr>))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return <div className="space-y-6"><StepVitalesEnfermera data={vitales} onChange={setVitales}/><div className="border-t border-border pt-5"><div className="flex items-center gap-2 p-2.5 bg-[#0D51D9]/8 border border-[#0D51D9]/20 rounded-xl mb-4"><Syringe size={14} className="text-[#0D51D9]"/><p className="text-xs font-bold text-[#0D51D9]">Cuestionario — Escleroterapia</p></div><StepCuestionario data={cuest} onChange={setCuest}/></div></div>;
    if (step === 3) return SueroLaserExtra;
    if (step === 4) return <div><div className="flex items-center gap-2 mb-3 p-2 bg-[#0D51D9]/8 rounded-lg"><Syringe size={14} className="text-[#0D51D9]"/><p className="text-xs font-bold text-[#0D51D9]">1 de 3 — Escleroterapia</p></div><StepLeerConsentimiento titulo="Escleroterapia de Várices" texto={makeTextoEscleroterapia(ips)} leido={leido1} onLeido={setLeido1}/></div>;
    if (step === 5) return <div><div className="flex items-center gap-2 mb-3 p-2 bg-[#0D8BD9]/10 rounded-lg"><Droplets size={14} className="text-[#0D8BD9]"/><p className="text-xs font-bold text-[#0D8BD9]">2 de 3 — Sueroterapia</p></div><StepLeerConsentimiento titulo="Sueroterapia Vitamina C / Complejo B" texto={makeTextoSueroterapia(ips)} leido={leido2} onLeido={setLeido2}/></div>;
    if (step === 6) return <div><div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg"><Zap size={14} className="text-amber-600"/><p className="text-xs font-bold text-amber-700">3 de 3 — Láser ND:YAG</p></div><StepLeerConsentimiento titulo="Terapia Láser ND:YAG" texto={makeTextoLaser(ips)} leido={leido3} onLeido={setLeido3}/></div>;
    if (step === 7) return (
      <div className="space-y-4">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl"><p className="text-xs font-bold text-purple-800 flex items-center gap-2"><Package size={14}/> Firma única — 3 consentimientos</p><p className="text-[10px] text-purple-700 mt-1">Al firmar, el médico recibirá una notificación para dar su Visto Bueno antes de proceder con la cita.</p></div>
        <div className="grid grid-cols-3 gap-2">
          {[{c:"bg-[#0D51D9]/10 text-[#0D51D9] border-[#0D51D9]/30",icon:<Syringe size={12}/>,l:"Escler.",ok:leido1},{c:"bg-[#0D8BD9]/10 text-[#0D8BD9] border-[#0D8BD9]/30",icon:<Droplets size={12}/>,l:"Suero.",ok:leido2},{c:"bg-amber-100 text-amber-700 border-amber-300",icon:<Zap size={12}/>,l:"Láser",ok:leido3}].map(({c,icon,l,ok}) => (
            <div key={l} className={`flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-semibold ${c}`}>{icon}{l}{ok && <Check size={10} className="ml-auto"/>}</div>
          ))}
        </div>
        <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firma={firma} onFirma={setFirma} nombrePaciente={pac.nombre}/>
      </div>
    );
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Paquete Completo — 3 Procedimientos" icon={<Package size={18}/>}/>
      <div className="overflow-y-auto flex-1 px-5 pb-2">{content()}</div>
      <NavButtons step={step} total={7} onBack={() => setStep(s => s-1)} onNext={() => setStep(s => s+1)} onFinish={handleSave} canNext={canNext()} finishing={saving}/>
    </FormWrapper>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MODAL APROBACIÓN MÉDICA — Visto Bueno
// ═══════════════════════════════════════════════════════════════════════════════
function AprobacionModal({ record, medicoNombre, onAprobar, onRechazar, onClose }: {
  record: ConsentRecord; medicoNombre: string;
  onAprobar: (id: string) => void; onRechazar: (id: string, motivo: string) => void; onClose: () => void;
}) {
  const [vista, setVista] = useState<"detalle" | "rechazar">("detalle");
  const [motivo, setMotivo] = useState("");
  const d = record.datos as any;
  const pac = d.paciente;

  return (
    <div className="fixed inset-0 bg-black/80 z-[250] flex items-end sm:items-center justify-center sm:p-3">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center"><BellRing size={17} className="text-amber-600"/></div>
            <div><p className="font-bold text-sm">Visto Bueno Médico</p><p className="text-[10px] text-muted-foreground">Consentimiento firmado por paciente · Requiere aprobación</p></div>
          </div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground"/></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Info del consentimiento */}
          <div className="p-3 bg-[#EFF3FB] rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">{pac?.nombre}</p>
              <TipoBadge tipo={record.tipo}/>
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">{record.radicado} · {fmtFecha(record.fecha)}</p>
            <p className="text-[10px] text-muted-foreground">Tel: {pac?.telefono}</p>
            {record.creadoPor && <p className="text-[10px] text-muted-foreground">Registrado por: {record.creadoPor}</p>}
          </div>

          {/* Decisión del paciente */}
          <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${d.consentido === true ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
            {d.consentido === true ? <><ThumbsUp size={14}/> PACIENTE CONSINTIÓ</> : <><ThumbsDown size={14}/> PACIENTE DISENTIÓ</>}
          </div>

          {/* Firma */}
          {d.firmaConsentimiento && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Firma del Paciente</p>
              <img src={d.firmaConsentimiento} alt="firma" className="h-16 border-2 border-[#0D51D9]/20 rounded-xl bg-[#f8faff] p-1"/>
            </div>
          )}

          {/* Vitales resumen */}
          {d.vitales && (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Signos Vitales</p>
              <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5">
                {[["SpO2", d.vitales.oximetria + "%"], ["T.A.", d.vitales.tension], ["F.C.", d.vitales.frecuenciaCardiaca + " lpm"], ["Peso", d.vitales.peso + " kg"], ["Talla", d.vitales.talla + " cm"], ["IMC", d.vitales.imc]].map(([l,v]) => (
                  <div key={l} className="bg-[#EFF3FB] rounded-lg p-2 text-center"><p className="text-[8px] text-muted-foreground font-bold">{l}</p><p className="text-[10px] font-bold">{v || "—"}</p></div>
                ))}
              </div>
            </div>
          )}

          {vista === "rechazar" && (
            <div className="space-y-2 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-xs font-bold text-red-800">Motivo de Rechazo</p>
              <textarea value={motivo} onChange={e => setMotivo(e.target.value)} rows={3} placeholder="Indique el motivo por el cual no aprueba el procedimiento..."
                className="w-full border border-red-300 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"/>
            </div>
          )}
        </div>

        <div className="px-5 pb-5 border-t border-border pt-4 flex-shrink-0">
          <p className="text-[10px] text-muted-foreground text-center mb-3">{medicoNombre} · Médico Responsable</p>
          {vista === "detalle" ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setVista("rechazar")} className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-red-300 text-red-700 font-semibold text-sm hover:bg-red-50 transition-colors">
                <XSquare size={16}/> Rechazar
              </button>
              <button onClick={() => onAprobar(record.id)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 transition-colors">
                <CalendarCheck size={16}/> Dar Visto Bueno
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setVista("detalle")} className="py-3 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
              <button onClick={() => { if (motivo.trim()) onRechazar(record.id, motivo); }} disabled={!motivo.trim()}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 disabled:opacity-40 transition-colors">
                <XSquare size={16}/> Confirmar Rechazo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PANEL DE NOTIFICACIONES
// ═══════════════════════════════════════════════════════════════════════════════
function NotificationPanel({ notifs, onClose, onMarkRead, onMarkAllRead, onOpenConsent }: {
  notifs: Notificacion[]; onClose: () => void;
  onMarkRead: (id: string) => void; onMarkAllRead: () => void;
  onOpenConsent: (id: string) => void;
}) {
  const noLeidas = notifs.filter(n => !n.leida).length;
  return (
    <div className="fixed inset-0 z-[200]" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="absolute right-2 sm:right-4 top-14 w-[calc(100vw-16px)] sm:w-80 bg-white rounded-2xl shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-[#031CA6]">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-[#0D51D9]"/>
            <p className="text-sm font-bold text-white">Notificaciones</p>
            {noLeidas > 0 && <span className="bg-red-500 text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">{noLeidas}</span>}
          </div>
          <div className="flex items-center gap-2">
            {noLeidas > 0 && <button onClick={onMarkAllRead} className="text-[10px] text-[#7A94C5] hover:text-white transition-colors font-medium">Leer todo</button>}
            <button onClick={onClose}><X size={15} className="text-[#7A94C5]"/></button>
          </div>
        </div>
        <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
          {notifs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><Bell size={28} className="mx-auto mb-2 opacity-30"/><p className="text-sm">Sin notificaciones</p></div>
          ) : (
            notifs.slice().reverse().map(n => (
              <div key={n.id} onClick={() => { onMarkRead(n.id); if (n.consentId) onOpenConsent(n.consentId); }}
                className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${!n.leida ? "bg-[#EFF3FB]" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${n.tipo === "NUEVO_CONSENTIMIENTO" ? "bg-amber-100" : n.tipo === "APROBADO" ? "bg-emerald-100" : n.tipo === "RECHAZADO" ? "bg-red-100" : "bg-[#0D51D9]/10"}`}>
                    {n.tipo === "NUEVO_CONSENTIMIENTO" ? <BellRing size={14} className="text-amber-600"/> : n.tipo === "APROBADO" ? <CheckSquare size={14} className="text-emerald-600"/> : n.tipo === "RECHAZADO" ? <XSquare size={14} className="text-red-600"/> : <Bell size={14} className="text-[#0D51D9]"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold ${!n.leida ? "text-foreground" : "text-muted-foreground"}`}>{n.titulo}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{n.mensaje}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">{fmtHora(n.fecha)}</p>
                  </div>
                  {!n.leida && <div className="w-2 h-2 bg-[#0D51D9] rounded-full flex-shrink-0 mt-1"/>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GESTIÓN DE STAFF — Solo ADMINISTRADOR (CRUD completo)
// ═══════════════════════════════════════════════════════════════════════════════
function StaffPage({ usuarios, onAddUser, onToggleActivo, onEditUser, onChangePassword, addToast }: {
  usuarios: Usuario[];
  onAddUser: (u: Usuario) => void;
  onToggleActivo: (id: string) => void;
  onEditUser: (u: Usuario) => void;
  onChangePassword: (userId: string, pwd: string) => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [pwdUser, setPwdUser] = useState<Usuario | null>(null);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<RolUsuario>("AUXILIAR");
  const [password, setPassword] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmNewPwd, setConfirmNewPwd] = useState("");
  const [q, setQ] = useState("");

  const filtered = usuarios.filter(u =>
    q === "" ||
    u.nombre.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()) ||
    u.rol.toLowerCase().includes(q.toLowerCase())
  );

  const ROL_OPTS: { value: RolUsuario; label: string }[] = [
    { value: "MÉDICO",        label: "MÉDICO — Aprueba consentimientos y ve citas" },
    { value: "AUXILIAR",      label: "AUXILIAR — Crea consentimientos" },
    { value: "ENFERMERA",     label: "ENFERMERA — Crea consentimientos y toma vitales" },
    { value: "TÉCNICO",       label: "TÉCNICO — Crea consentimientos (Láser)" },
    { value: "ADMINISTRADOR", label: "ADMINISTRADOR — Control total del sistema" },
  ];

  const handleAdd = () => {
    if (!nombre.trim() || !email.trim() || !password.trim()) { addToast("error", "Completar todos los campos requeridos"); return; }
    if (password !== confirmPwd) { addToast("error", "Las contraseñas no coinciden"); return; }
    if (password.length < 6) { addToast("error", "La contraseña debe tener al menos 6 caracteres"); return; }
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase())) { addToast("error", "Ya existe un usuario con ese correo"); return; }
    const nuevo: Usuario = { id: genId(), nombre: nombre.trim(), email: email.trim().toLowerCase(), rol, password, activo: true, createdAt: hoy() };
    onAddUser(nuevo);
    addToast("success", `Usuario ${nombre} creado correctamente`);
    setNombre(""); setEmail(""); setPassword(""); setConfirmPwd(""); setRol("AUXILIAR"); setShowForm(false);
  };

  const handleEdit = () => {
    if (!editingUser) return;
    if (!nombre.trim() || !email.trim()) { addToast("error", "Nombre y correo son requeridos"); return; }
    if (usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== editingUser.id)) {
      addToast("error", "Ese correo ya está en uso"); return;
    }
    onEditUser({ ...editingUser, nombre: nombre.trim(), email: email.trim().toLowerCase(), rol });
    addToast("success", `Usuario ${nombre.trim()} actualizado`);
    setEditingUser(null); setNombre(""); setEmail(""); setRol("AUXILIAR");
  };

  const openEdit = (u: Usuario) => {
    setEditingUser(u); setNombre(u.nombre); setEmail(u.email); setRol(u.rol);
    setShowForm(false); setPwdUser(null);
  };

  const openPwd = (u: Usuario) => {
    setPwdUser(u); setNewPwd(""); setConfirmNewPwd("");
    setShowForm(false); setEditingUser(null);
  };

  const handleChangePwd = () => {
    if (!pwdUser) return;
    if (newPwd.length < 6) { addToast("error", "La contraseña debe tener al menos 6 caracteres"); return; }
    if (newPwd !== confirmNewPwd) { addToast("error", "Las contraseñas no coinciden"); return; }
    onChangePassword(pwdUser.id, newPwd);
    setPwdUser(null); setNewPwd(""); setConfirmNewPwd("");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Gestión de Personal</h1>
          <p className="text-sm text-muted-foreground">{usuarios.length} usuarios · {usuarios.filter(u=>u.activo).length} activos</p>
        </div>
        <button onClick={() => { setShowForm(true); setEditingUser(null); setPwdUser(null); setNombre(""); setEmail(""); setPassword(""); setConfirmPwd(""); setRol("AUXILIAR"); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors">
          <UserPlus size={16}/> Agregar Usuario
        </button>
      </div>

      <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-start gap-2">
        <Shield size={14} className="text-purple-700 mt-0.5 flex-shrink-0"/>
        <p className="text-[11px] text-purple-800 font-semibold">Solo el <strong>Administrador</strong> puede agregar, editar, cambiar contraseñas y activar/desactivar personal del sistema.</p>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div className="bg-card border-2 border-[#0D51D9]/30 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm flex items-center gap-2"><UserPlus size={16} className="text-[#0D51D9]"/> Nuevo Usuario del Sistema</p>
            <button onClick={() => setShowForm(false)}><X size={16} className="text-muted-foreground"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Dr. Nombre Apellido" required icon={<UserCheck size={13}/>}/>
            <Field label="Correo electrónico" value={email} onChange={setEmail} placeholder="usuario@medfis.com" type="email" required icon={<AtSign size={13}/>}/>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Rol en el Sistema <span className="text-red-500">*</span></label>
            <select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30">
              {ROL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="Min. 6 caracteres" required icon={<Lock size={13}/>}/>
            <Field label="Confirmar contraseña" value={confirmPwd} onChange={setConfirmPwd} type="password" placeholder="Repetir contraseña" required icon={<Lock size={13}/>}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
            <button onClick={handleAdd} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors">
              <Save size={14}/> Crear Usuario
            </button>
          </div>
        </div>
      )}

      {/* Formulario editar usuario */}
      {editingUser && (
        <div className="bg-card border-2 border-amber-300 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm flex items-center gap-2"><Edit3 size={16} className="text-amber-600"/> Editar: {editingUser.nombre}</p>
            <button onClick={() => setEditingUser(null)}><X size={16} className="text-muted-foreground"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nombre completo" value={nombre} onChange={setNombre} placeholder="Nombre completo" required icon={<UserCheck size={13}/>}/>
            <Field label="Correo electrónico" value={email} onChange={setEmail} placeholder="correo@medfis.com" type="email" required icon={<AtSign size={13}/>}/>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Rol</label>
            <select value={rol} onChange={e => setRol(e.target.value as RolUsuario)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-amber-300">
              {ROL_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
            <button onClick={handleEdit} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-amber-500 text-white text-sm font-semibold hover:bg-amber-600 transition-colors">
              <Save size={14}/> Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* Formulario cambiar contraseña */}
      {pwdUser && (
        <div className="bg-card border-2 border-red-300 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="font-bold text-sm flex items-center gap-2"><Lock size={16} className="text-red-600"/> Cambiar Contraseña — {pwdUser.nombre}</p>
            <button onClick={() => setPwdUser(null)}><X size={16} className="text-muted-foreground"/></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Nueva contraseña" value={newPwd} onChange={setNewPwd} type="password" placeholder="Min. 6 caracteres" required icon={<Lock size={13}/>}/>
            <Field label="Confirmar contraseña" value={confirmNewPwd} onChange={setConfirmNewPwd} type="password" placeholder="Repetir contraseña" required icon={<Lock size={13}/>}/>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPwdUser(null)} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
            <button onClick={handleChangePwd} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors">
              <Save size={14}/> Cambiar Contraseña
            </button>
          </div>
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, email o rol..."
          className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30"/>
      </div>

      {/* Lista de usuarios */}
      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className={`bg-card rounded-2xl border border-border p-4 flex items-center gap-4 transition-all ${!u.activo ? "opacity-55" : ""} ${editingUser?.id===u.id||pwdUser?.id===u.id?"border-[#0D51D9]":""}`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-black text-sm ${u.activo?"bg-[#0D51D9]":"bg-gray-400"}`}>
              {u.nombre.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{u.nombre}</p>
                <RolBadge rol={u.rol}/>
                {!u.activo && <span className="text-[9px] bg-gray-200 text-gray-600 font-bold px-1.5 py-0.5 rounded-full">INACTIVO</span>}
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">{u.email}</p>
              <p className="text-[9px] text-muted-foreground">Desde: {fmtFecha(u.createdAt)}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap justify-end">
              <button onClick={() => openEdit(u)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors">
                <Edit3 size={10}/> Editar
              </button>
              <button onClick={() => openPwd(u)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-colors">
                <Lock size={10}/> Contraseña
              </button>
              {u.rol !== "ADMINISTRADOR" && (
                <button onClick={() => { onToggleActivo(u.id); addToast(u.activo ? "warning" : "success", `${u.activo ? "Desactivado" : "Activado"}: ${u.nombre}`); }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-colors border ${u.activo ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"}`}>
                  {u.activo ? <><Lock size={10}/> Desactivar</> : <><Unlock size={10}/> Activar</>}
                </button>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-sm text-center text-muted-foreground py-8">Sin resultados para "{q}"</p>}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN STATS PAGE — Estadísticas completas para el Administrador
// ═══════════════════════════════════════════════════════════════════════════════
function AdminStatsPage({ records, usuarios }: { records: ConsentRecord[]; usuarios: Usuario[] }) {
  const total       = records.length;
  const firmados    = records.filter(r => r.estado === "FIRMADO").length;
  const aprobados   = records.filter(r => r.estado === "APROBADO").length;
  const rechazados  = records.filter(r => r.estado === "RECHAZADO").length;
  const anulados    = records.filter(r => r.estado === "ANULADO").length;
  const pendientes  = records.filter(r => r.pendienteMedico && r.estado === "FIRMADO").length;
  const hoyCount    = records.filter(r => r.fecha === hoy()).length;
  const pacientesUnicos = new Set(records.map(r => r.pacienteDoc)).size;
  const staff       = usuarios.length;
  const staffActivo = usuarios.filter(u => u.activo).length;

  const porTipo = [
    { tipo: "Escleroterapia", count: records.filter(r=>r.tipo==="escleroterapia").length, color:"#0D51D9" },
    { tipo: "Sueroterapia",   count: records.filter(r=>r.tipo==="sueroterapia").length,   color:"#0D8BD9" },
    { tipo: "Láser ND:YAG",   count: records.filter(r=>r.tipo==="laser").length,          color:"#F59E0B" },
    { tipo: "Paquete",        count: records.filter(r=>r.tipo==="paquete").length,         color:"#8B5CF6" },
  ];

  const porEstado = [
    { name: "Aprobados",  value: aprobados,  fill: "#10b981" },
    { name: "Firmados",   value: firmados,   fill: "#3b82f6" },
    { name: "Rechazados", value: rechazados, fill: "#ef4444" },
    { name: "Anulados",   value: anulados,   fill: "#6b7280" },
  ].filter(e => e.value > 0);

  // Últimos 7 días
  const last7: { dia: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("es-CO", { weekday: "short", day: "numeric" });
    last7.push({ dia: label, count: records.filter(r => r.fecha === key).length });
  }

  // Por creador
  const porCreador: Record<string, number> = {};
  records.forEach(r => { if (r.creadoPor) porCreador[r.creadoPor] = (porCreador[r.creadoPor] || 0) + 1; });
  const creadorList = Object.entries(porCreador).sort((a,b)=>b[1]-a[1]).slice(0,5);

  const KPI = ({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`bg-card rounded-2xl border border-border p-4 border-l-4`} style={{ borderLeftColor: color }}>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black mt-1" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground">Control total del sistema · {new Date().toLocaleDateString("es-CO", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</p>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPI label="Consentimientos" value={total} sub={`${hoyCount} hoy`} color="#0D51D9"/>
        <KPI label="Pacientes únicos" value={pacientesUnicos} sub="documentos distintos" color="#8B5CF6"/>
        <KPI label="Aprobados" value={aprobados} sub={total>0?`${Math.round(aprobados/total*100)}% del total`:"-"} color="#10b981"/>
        <KPI label="Pendientes médico" value={pendientes} sub={pendientes>0?"⚠ Requieren Visto Bueno":"Al día"} color={pendientes>0?"#f59e0b":"#10b981"}/>
      </div>

      {/* Tendencia semanal */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-sm font-bold mb-3">Consentimientos — Últimos 7 días</p>
        <div className="flex items-end gap-2 h-28">
          {last7.map((d, i) => {
            const max = Math.max(...last7.map(x=>x.count), 1);
            const pct = (d.count / max) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold text-muted-foreground">{d.count > 0 ? d.count : ""}</span>
                <div className="w-full rounded-t-md transition-all" style={{ height:`${Math.max(pct, 4)}%`, background: d.count>0?"#0D51D9":"#e5e7eb" }}/>
                <span className="text-[8px] text-muted-foreground text-center leading-tight">{d.dia}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Por tipo */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-sm font-bold">Por tipo de procedimiento</p>
          {porTipo.map(t => (
            <div key={t.tipo}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium">{t.tipo}</span>
                <span className="text-xs font-bold">{t.count}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: total>0?`${(t.count/total)*100}%`:"0%", background: t.color }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Por estado */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <p className="text-sm font-bold">Por estado</p>
          {porEstado.length === 0 && <p className="text-xs text-muted-foreground">Sin datos aún</p>}
          {porEstado.map(e => (
            <div key={e.name} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: e.fill }}/>
              <div className="flex-1">
                <div className="flex justify-between text-xs mb-0.5">
                  <span>{e.name}</span>
                  <span className="font-bold">{e.value} ({total>0?Math.round(e.value/total*100):0}%)</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div className="h-full rounded-full" style={{ width:`${total>0?(e.value/total)*100:0}%`, background:e.fill }}/>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top creadores */}
      {creadorList.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-bold mb-3">Top creadores de consentimientos</p>
          <div className="space-y-2">
            {creadorList.map(([nombre, count], i) => (
              <div key={nombre} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#0D51D9]/10 text-[#0D51D9] text-[10px] font-black flex items-center justify-center">{i+1}</span>
                <span className="flex-1 text-xs font-medium">{nombre}</span>
                <span className="text-xs font-bold text-[#0D51D9]">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff summary */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-sm font-bold mb-3">Resumen del Personal</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-[#0D51D9]/5 rounded-xl">
            <p className="text-2xl font-black text-[#0D51D9]">{staff}</p>
            <p className="text-[10px] text-muted-foreground">Total Staff</p>
          </div>
          <div className="text-center p-3 bg-emerald-50 rounded-xl">
            <p className="text-2xl font-black text-emerald-600">{staffActivo}</p>
            <p className="text-[10px] text-muted-foreground">Activos</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-xl">
            <p className="text-2xl font-black text-red-500">{staff - staffActivo}</p>
            <p className="text-[10px] text-muted-foreground">Inactivos</p>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {(["MÉDICO","AUXILIAR","ENFERMERA","TÉCNICO","ADMINISTRADOR"] as RolUsuario[]).map(r => {
            const cnt = usuarios.filter(u => u.rol === r).length;
            if (cnt === 0) return null;
            return (
              <div key={r} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2"><RolBadge rol={r}/></span>
                <span className="font-bold">{cnt} usuario{cnt!==1?"s":""}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN CHANGE OWN PASSWORD MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function AdminChangePwdModal({ user, onSave, onClose }: { user: Usuario; onSave: (newPwd: string) => void; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr]         = useState("");

  const handleSave = () => {
    setErr("");
    if (current !== user.password) { setErr("La contraseña actual es incorrecta"); return; }
    if (newPwd.length < 6)         { setErr("La nueva contraseña debe tener al menos 6 caracteres"); return; }
    if (newPwd !== confirm)        { setErr("Las contraseñas nuevas no coinciden"); return; }
    onSave(newPwd);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center"><KeyRound size={15} className="text-indigo-600"/></div>
            <div><p className="font-bold text-sm">Cambiar mi Contraseña</p><p className="text-[10px] text-muted-foreground">Administrador: {user.nombre}</p></div>
          </div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground"/></button>
        </div>
        <div className="p-5 space-y-4">
          {err && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">{err}</div>}
          <Field label="Contraseña actual" value={current} onChange={setCurrent} type="password" placeholder="Tu contraseña actual" required icon={<Lock size={13}/>}/>
          <Field label="Nueva contraseña" value={newPwd} onChange={setNewPwd} type="password" placeholder="Min. 6 caracteres" required icon={<Lock size={13}/>}/>
          <Field label="Confirmar nueva contraseña" value={confirm} onChange={setConfirm} type="password" placeholder="Repetir nueva contraseña" required icon={<Lock size={13}/>}/>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={handleSave} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors"><Save size={14}/> Cambiar Contraseña</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IPS SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function IPSSettingsModal({ ips, onSave, onClose }: { ips: IPSConfig; onSave: (c: IPSConfig) => void; onClose: () => void }) {
  const [form, setForm] = useState<IPSConfig>({ ...ips });
  const s = (k: keyof IPSConfig) => (v: string) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="fixed inset-0 bg-black/70 z-[300] flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-[#0D51D9]/10 flex items-center justify-center"><Settings size={15} className="text-[#0D51D9]"/></div><div><p className="font-bold text-sm">Configuración IPS</p><p className="text-[10px] text-muted-foreground">Constantes del sistema — solo Administrador</p></div></div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl"><p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1.5"><AlertTriangle size={11}/> Estos valores aparecen en todos los consentimientos y PDFs</p></div>
          <Field label="Nombre de la IPS" value={form.nombre} onChange={s("nombre")} placeholder="Nombre de la clínica" required/>
          <Field label="NIT" value={form.nit} onChange={s("nit")} placeholder="000000000" icon={<FileText size={13}/>} required/>
          <Field label="Médico Responsable" value={form.medico} onChange={s("medico")} placeholder="Dr. Nombre Apellido" icon={<Stethoscope size={13}/>} required/>
          <Field label="Registro Médico (RM)" value={form.rm} onChange={s("rm")} placeholder="RM 0000000"/>
          <Field label="Ciudad / Sede" value={form.ciudad} onChange={s("ciudad")} placeholder="Ciudad, País" icon={<MapPin size={13}/>}/>
          <div className="p-3 bg-[#EFF3FB] rounded-xl text-[10px] text-muted-foreground space-y-0.5">
            <p className="font-bold text-foreground text-xs mb-1">Vista previa del encabezado:</p>
            <p className="font-bold text-[#0D51D9]">{form.nombre || "Nombre IPS"}</p>
            <p>NIT {form.nit || "000000000"}</p>
            <p>{form.medico || "Médico"} · {form.rm || "RM"}</p>
            <p className="text-[9px]">{form.ciudad || "Ciudad"}</p>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={() => { onSave(form); onClose(); }} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors"><Save size={14}/> Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin, usuarios }: { onLogin: (u: Usuario) => void; usuarios: Usuario[] }) {
  const ips = useIPS();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    setTimeout(() => {
      const user = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.activo);
      if (user) onLogin(user);
      else {
        const exists = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (exists && !exists.activo) setError("Este usuario está inactivo. Contacte al Administrador.");
        else setError("Credenciales incorrectas. Verifique su email y contraseña.");
      }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#031CA6] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white mb-4 shadow-lg">
            <ImageWithFallback src={medfisLogo} alt="Med&Fis Logo" className="w-16 h-16 object-contain"/>
          </div>
          <h1 className="text-2xl font-black text-white">{ips.nombre}</h1>
          <p className="text-[#C5D5F0] text-sm mt-1">Sistema de Consentimientos Informados</p>
          <p className="text-[#7A94C5] text-[10px] mt-0.5 font-mono">NIT {ips.nit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold mb-5">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="usuario@medfis.com" required/>
            <Field label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="••••••••" required/>
            {error && <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium"><XCircle size={14}/> {error}</div>}
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#0D51D9] text-white font-semibold text-sm disabled:opacity-60 hover:bg-[#1648bf] transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Verificando...</> : "Ingresar"}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Accesos de prueba:</p>
            {usuarios.filter(u => u.activo).slice(0, 4).map(u => (
              <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); }} className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors mb-1">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-semibold">{u.nombre}</p>
                  <RolBadge rol={u.rol}/>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{u.email} · {u.password}</p>
              </button>
            ))}
          </div>
        </div>
        {/* Autoría y derechos reservados */}
        <div className="mt-6 text-center space-y-0.5">
          <p className="text-[10px] text-[#7A94C5]">Desarrollado por <span className="font-bold text-white">JM Ingeniero</span></p>
          <p className="text-[9px] text-[#5571A0]">© {new Date().getFullYear()} Todos los derechos reservados · Uso exclusivo {ips.nombre}</p>
          <p className="text-[9px] text-[#5571A0]">Nos reservamos el derecho de admisión</p>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, onPage, user, onLogout, records, mobileOpen, onClose, onSettings, onChangePwd, notifCount }: {
  page: AppPage; onPage: (p: AppPage) => void; user: Usuario; onLogout: () => void;
  records: ConsentRecord[]; mobileOpen: boolean; onClose: () => void; onSettings: () => void;
  onChangePwd: () => void;
  notifCount: number;
}) {
  const ips = useIPS();
  const pendientes = records.filter(r => r.pendienteMedico).length;
  const nav = [
    { id: "dashboard" as AppPage, label: "Dashboard",            icon: <LayoutDashboard size={17}/>, badge: user.rol === "MÉDICO" ? pendientes : 0 },
    { id: "historial" as AppPage, label: "Historial",            icon: <ClipboardList size={17}/>   },
    { id: "form"      as AppPage, label: "Nuevo Consentimiento", icon: <Plus size={17}/>             },
  ];
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#031CA6] z-50 flex flex-col transition-transform duration-300 ${mobileOpen?"translate-x-0":"-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center p-0.5"><ImageWithFallback src={medfisLogo} alt="Med&Fis Logo" className="w-full h-full object-contain"/></div>
            <div><p className="font-black text-white text-sm">{ips.nombre}</p><p className="text-[10px] text-[#7A94C5] font-mono">NIT {ips.nit}</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => { onPage(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative ${page===item.id?"bg-[#0D51D9] text-white":"text-[#C5D5F0] hover:bg-white/8"}`}>
              {item.icon} {item.label}
              {(item.badge ?? 0) > 0 && <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{item.badge}</span>}
            </button>
          ))}
          {user.rol === "ADMINISTRADOR" && (<>
            <button onClick={() => { onPage("admin"); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${page==="admin"?"bg-[#0D51D9] text-white":"text-[#C5D5F0] hover:bg-white/8"}`}>
              <BarChart2 size={17}/> Panel Admin
            </button>
            <button onClick={() => { onPage("staff"); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${page==="staff"?"bg-[#0D51D9] text-white":"text-[#C5D5F0] hover:bg-white/8"}`}>
              <UserCog size={17}/> Gestión de Staff
            </button>
          </>)}
        </nav>
        <div className="px-3 pb-5 border-t border-white/8 pt-4 space-y-1">
          {user.rol === "ADMINISTRADOR" && <button onClick={onSettings} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C5D5F0] hover:bg-white/8 text-sm font-medium transition-colors"><Settings size={15}/> Config. IPS</button>}
          {user.rol === "ADMINISTRADOR" && <button onClick={onChangePwd} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C5D5F0] hover:bg-white/8 text-sm font-medium transition-colors"><Lock size={15}/> Mi Contraseña</button>}
          <div className="px-3 py-2">
            <p className="text-[10px] text-white font-semibold truncate">{user.nombre}</p>
            <p className="text-[10px] text-[#7A94C5]">{user.rol}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C5D5F0] hover:bg-white/8 text-sm font-medium transition-colors"><LogOut size={15}/> Cerrar Sesión</button>
          <div className="px-3 pt-2 border-t border-white/8 mt-1">
            <p className="text-[9px] text-[#5571A0]">Dev: <span className="text-[#7A94C5] font-semibold">JM Ingeniero</span></p>
            <p className="text-[9px] text-[#5571A0]">© {new Date().getFullYear()} · Derechos reservados</p>
          </div>
        </div>
      </aside>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ records, onNewForm, user, onViewRecord, onAprobar, onRechazar, addToast }: {
  records: ConsentRecord[]; onNewForm: (t: TipoConsent) => void; user: Usuario;
  onViewRecord: (r: ConsentRecord) => void;
  onAprobar: (id: string) => void; onRechazar: (id: string, motivo: string) => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void;
}) {
  const [aprobandoRecord, setAprobandoRecord] = useState<ConsentRecord | null>(null);
  const firmados  = records.filter(r => r.estado === "FIRMADO").length;
  const aprobados = records.filter(r => r.estado === "APROBADO").length;
  const pendientesAprobacion = records.filter(r => r.pendienteMedico && r.estado === "FIRMADO");
  const hoyCount  = records.filter(r => r.fecha === hoy()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bienvenido/a, {user.nombre} · {user.rol}</p>
      </div>

      {/* COLA DE APROBACIÓN MÉDICA */}
      {pendientesAprobacion.length > 0 && (
        <div className={`rounded-2xl p-4 border-2 ${user.rol === "MÉDICO" ? "bg-amber-50 border-amber-400" : "bg-blue-50 border-blue-300"}`}>
          <div className="flex items-center gap-2 mb-3">
            <BellRing size={16} className={user.rol === "MÉDICO" ? "text-amber-600 animate-pulse" : "text-blue-600"}/>
            <p className={`text-sm font-bold ${user.rol === "MÉDICO" ? "text-amber-800" : "text-blue-800"}`}>
              {user.rol === "MÉDICO" ? "⚕ Consentimientos pendientes de Visto Bueno" : "Consentimientos pendientes de aprobación médica"}
            </p>
            <span className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 animate-pulse ${user.rol === "MÉDICO" ? "bg-amber-500 text-white" : "bg-blue-500 text-white"}`}>{pendientesAprobacion.length}</span>
          </div>
          {user.rol === "MÉDICO" && (
            <div className="mb-2 p-2 bg-amber-100 border border-amber-300 rounded-lg">
              <p className="text-[10px] text-amber-900 font-semibold">⚠ Debe revisar y dar Visto Bueno antes de proceder con la cita de consulta</p>
            </div>
          )}
          <div className="space-y-2">
            {pendientesAprobacion.map(r => {
              const d = r.datos as any;
              const pac = d.paciente;
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-200 hover:border-amber-400 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    {r.tipo==="escleroterapia"?<Syringe size={14} className="text-amber-700"/>:r.tipo==="sueroterapia"?<Droplets size={14} className="text-amber-700"/>:r.tipo==="laser"?<Zap size={14} className="text-amber-700"/>:<Package size={14} className="text-amber-700"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{r.pacienteNombre}</p>
                    <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                    {r.creadoPor && <p className="text-[10px] text-muted-foreground">Por: {r.creadoPor}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <TipoBadge tipo={r.tipo}/>
                    <button onClick={() => onViewRecord(r)} className="p-1.5 rounded-lg bg-[#0D51D9]/10 text-[#0D51D9] hover:bg-[#0D51D9]/20 transition-colors"><Eye size={13}/></button>
                    {user.rol === "MÉDICO" && (
                      <button onClick={() => setAprobandoRecord(r)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors">
                        <CalendarCheck size={11}/> Visto Bueno
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total",          value: records.length,              icon:<FileText size={18}/>,    color:"text-[#0D51D9]", bg:"bg-[#0D51D9]/10" },
          { label:"Firmados",       value: firmados,                    icon:<Clock size={18}/>,        color:"text-blue-600",  bg:"bg-blue-50"      },
          { label:"Aprobados",      value: aprobados,                   icon:<CheckCircle size={18}/>,  color:"text-emerald-600",bg:"bg-emerald-50"   },
          { label:"Hoy",            value: hoyCount,                    icon:<Activity size={18}/>,     color:"text-amber-600", bg:"bg-amber-50"      },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Crear nuevo */}
      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Crear Nuevo Consentimiento</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { tipo:"escleroterapia" as TipoConsent, label:"Escleroterapia", sub:"Inyección de Várices",  icon:<Syringe size={24}/>,  color:"bg-[#0D51D9]", light:"bg-[#0D51D9]/8 hover:bg-[#0D51D9]/12 border-[#0D51D9]/20" },
            { tipo:"sueroterapia"   as TipoConsent, label:"Sueroterapia",   sub:"Vit C / Complejo B IV", icon:<Droplets size={24}/>, color:"bg-[#0D8BD9]", light:"bg-[#0D8BD9]/8 hover:bg-[#0D8BD9]/12 border-[#0D8BD9]/20" },
            { tipo:"laser"          as TipoConsent, label:"Láser Várices",  sub:"Terapia ND:YAG",        icon:<Zap size={24}/>,      color:"bg-amber-500", light:"bg-amber-50 hover:bg-amber-100 border-amber-200"           },
            { tipo:"paquete"        as TipoConsent, label:"Paquete",        sub:"Los 3 procedimientos",  icon:<Package size={24}/>,  color:"bg-purple-600",light:"bg-purple-50 hover:bg-purple-100 border-purple-200"         },
          ]).map(item => (
            <button key={item.tipo} onClick={() => onNewForm(item.tipo)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all hover:scale-[1.02] active:scale-95 ${item.light}`}>
              <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm`}>{item.icon}</div>
              <div><p className="text-sm font-bold">{item.label}</p><p className="text-[10px] text-muted-foreground">{item.sub}</p></div>
            </button>
          ))}
        </div>
      </div>

      {/* Últimos registros */}
      {records.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Últimos Consentimientos</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {records.slice(-6).reverse().map((r, i, arr) => (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${i<arr.length-1?"border-b border-border":""} ${r.pendienteMedico && r.estado === "FIRMADO" ? "border-l-4 border-l-amber-400":""} ${r.estado === "APROBADO" ? "border-l-4 border-l-emerald-500" : ""}`}
                onClick={() => onViewRecord(r)}>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {r.tipo==="escleroterapia"?<Syringe size={14} className="text-[#0D51D9]"/>:r.tipo==="sueroterapia"?<Droplets size={14} className="text-[#0D8BD9]"/>:r.tipo==="laser"?<Zap size={14} className="text-amber-600"/>:<Package size={14} className="text-purple-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{r.pacienteNombre}</p>
                  <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.pendienteMedico && r.estado === "FIRMADO" && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>}
                  <StatusBadge estado={r.estado}/>
                  <Eye size={13} className="text-muted-foreground"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {records.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Tendencia Mensual</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={CHART_MENSUAL}>
                <defs><linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0D51D9" stopOpacity={0.15}/><stop offset="95%" stopColor="#0D51D9" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F4"/>
                <XAxis dataKey="mes" tick={{ fontSize:10 }}/><YAxis tick={{ fontSize:10 }}/>
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }}/>
                <Area type="monotone" dataKey="escler" stroke="#0D51D9" fill="url(#gE)" strokeWidth={2} name="Escleroterapia"/>
                <Area type="monotone" dataKey="suero"  stroke="#0D8BD9" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Sueroterapia"/>
                <Area type="monotone" dataKey="laser"  stroke="#F59E0B" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Láser"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Distribución por Tipo</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart><Pie data={CHART_TIPOS} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">{CHART_TIPOS.map(entry => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ fontSize:11, borderRadius:8 }}/></PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">{CHART_TIPOS.map(t => (<div key={t.name} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: t.color }}/><span className="text-[10px] text-muted-foreground">{t.name}</span></div>))}</div>
          </div>
        </div>
      )}

      {/* Modal aprobación */}
      {aprobandoRecord && (
        <AprobacionModal
          record={aprobandoRecord}
          medicoNombre={user.nombre}
          onAprobar={(id) => { onAprobar(id); setAprobandoRecord(null); addToast("success", "Visto Bueno otorgado — Cita habilitada"); }}
          onRechazar={(id, motivo) => { onRechazar(id, motivo); setAprobandoRecord(null); addToast("warning", "Consentimiento rechazado"); }}
          onClose={() => setAprobandoRecord(null)}
        />
      )}
    </div>
  );
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
function HistorialPage({ records, onView, onDelete, onAprobar, onRechazar, addToast, user }: {
  records: ConsentRecord[]; onView: (r: ConsentRecord) => void;
  onDelete: (id: string) => void; onAprobar: (id: string) => void; onRechazar: (id: string, motivo: string) => void;
  addToast: (t: "success"|"error"|"info"|"warning", m: string) => void; user: Usuario;
}) {
  const ips = useIPS();
  const [q, setQ]         = useState("");
  const [fTipo, setFTipo] = useState<"todos"|TipoConsent>("todos");
  const [fEst, setFEst]   = useState<"todos"|EstadoConsent>("todos");
  const [aprobandoRecord, setAprobandoRecord] = useState<ConsentRecord | null>(null);

  const filtered = records.filter(r => {
    const matchQ = q==="" || r.pacienteNombre.toLowerCase().includes(q.toLowerCase()) || r.radicado.toLowerCase().includes(q.toLowerCase()) || r.pacienteDoc.includes(q);
    return matchQ && (fTipo==="todos"||r.tipo===fTipo) && (fEst==="todos"||r.estado===fEst);
  }).reverse();

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div><h1 className="text-xl font-bold">Historial de Consentimientos</h1><p className="text-sm text-muted-foreground">{filtered.length} registros encontrados</p></div>
        {user.rol !== "ADMINISTRADOR" && (
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1.5 rounded-xl font-semibold"><Eye size={11}/> Solo lectura</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row flex-wrap gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, radicado o cédula..."
            className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30"/>
        </div>
        <div className="flex gap-2">
          <select value={fTipo} onChange={e => setFTipo(e.target.value as any)} className="flex-1 border border-border rounded-xl px-2.5 py-2.5 text-sm bg-card focus:outline-none">
            <option value="todos">Todos tipos</option><option value="escleroterapia">Escleroterapia</option><option value="sueroterapia">Sueroterapia</option><option value="laser">Láser</option><option value="paquete">Paquete</option>
          </select>
          <select value={fEst} onChange={e => setFEst(e.target.value as any)} className="flex-1 border border-border rounded-xl px-2.5 py-2.5 text-sm bg-card focus:outline-none">
            <option value="todos">Todos estados</option><option value="FIRMADO">Firmado</option><option value="APROBADO">Aprobado</option><option value="RECHAZADO">Rechazado</option><option value="ANULADO">Anulado</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><FileText size={36} className="mx-auto mb-3 opacity-30"/><p className="font-semibold">Sin registros</p><p className="text-sm">No se encontraron consentimientos</p></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const d = r.datos as any;
            const pac = d.paciente;
            return (
              <div key={r.id} className={`bg-card rounded-2xl border border-border p-3 sm:p-4 transition-colors hover:border-[#0D51D9]/30 ${r.pendienteMedico && r.estado === "FIRMADO" ? "border-l-4 border-l-amber-400" : ""} ${r.estado === "APROBADO" ? "border-l-4 border-l-emerald-500" : ""} ${r.estado === "RECHAZADO" ? "border-l-4 border-l-red-400" : ""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {r.tipo==="escleroterapia"?<Syringe size={15} className="text-[#0D51D9]"/>:r.tipo==="sueroterapia"?<Droplets size={15} className="text-[#0D8BD9]"/>:r.tipo==="laser"?<Zap size={15} className="text-amber-600"/>:<Package size={15} className="text-purple-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.pacienteNombre}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{r.radicado} · {fmtFecha(r.fecha)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <StatusBadge estado={r.estado}/>
                        <TipoBadge tipo={r.tipo}/>
                      </div>
                    </div>
                    {r.pendienteMedico && r.estado === "FIRMADO" && <span className="inline-block text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full mb-1">⏳ PENDIENTE MÉDICO</span>}
                    {r.estado === "APROBADO" && <span className="inline-block text-[9px] bg-emerald-100 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full mb-1">✓ CITA HABILITADA</span>}
                    {pac?.telefono && <p className="text-[10px] text-muted-foreground">Tel: {pac.telefono}</p>}
                    {r.creadoPor && <p className="text-[10px] text-muted-foreground hidden sm:block">Por: {r.creadoPor}</p>}
                    {r.aprobadoPor && <p className="text-[10px] text-emerald-700 font-semibold">✓ {r.aprobadoPor}</p>}
                    {r.motivoRechazo && <p className="text-[10px] text-red-600 truncate">✕ {r.motivoRechazo}</p>}
                    {/* Botones en fila para mobile */}
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <button onClick={() => onView(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#0D51D9] text-white text-[10px] font-semibold hover:bg-[#1648bf] transition-colors"><Eye size={11}/> PDF</button>
                      {r.pendienteMedico && r.estado === "FIRMADO" && user.rol === "MÉDICO" && (
                        <button onClick={() => setAprobandoRecord(r)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold hover:bg-emerald-700 transition-colors"><CalendarCheck size={11}/> Visto Bueno</button>
                      )}
                      <button onClick={() => { const d2 = r.datos as any; const p = d2.paciente; const msg = encodeURIComponent(`*${ips.nombre}* - Radicado: ${r.radicado}\nEstado: ${r.estado}`); window.open(`https://wa.me/57${(p?.telefono||"").replace(/[^0-9]/g,"")}?text=${msg}`,"_blank"); addToast("info","Abriendo WhatsApp..."); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#25D366] text-white text-[10px] font-semibold hover:bg-[#20ba5a] transition-colors"><MessageSquare size={11}/> WA</button>
                      {user.rol === "ADMINISTRADOR" && (
                        <button onClick={() => { onDelete(r.id); addToast("info","Consentimiento anulado"); }} className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors" title="Anular (solo Administrador)"><Trash2 size={12}/></button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {aprobandoRecord && (
        <AprobacionModal
          record={aprobandoRecord} medicoNombre={user.nombre}
          onAprobar={(id) => { onAprobar(id); setAprobandoRecord(null); addToast("success", "Visto Bueno otorgado"); }}
          onRechazar={(id, motivo) => { onRechazar(id, motivo); setAprobandoRecord(null); addToast("warning", "Consentimiento rechazado"); }}
          onClose={() => setAprobandoRecord(null)}
        />
      )}
    </div>
  );
}

function TipoSelectorPage({ onSelect }: { onSelect: (t: TipoConsent) => void }) {
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold">Nuevo Consentimiento</h1><p className="text-sm text-muted-foreground">Seleccione el tipo de procedimiento</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { tipo:"escleroterapia" as TipoConsent, label:"Escleroterapia",  sub:"Inyección de Várices MMII",         icon:<Syringe size={28}/>,  color:"border-[#0D51D9] bg-[#0D51D9]/5", iconBg:"bg-[#0D51D9]" },
          { tipo:"sueroterapia"   as TipoConsent, label:"Sueroterapia",    sub:"Vitamina C y/o Complejo B IV/IM",   icon:<Droplets size={28}/>, color:"border-[#0D8BD9] bg-[#0D8BD9]/5", iconBg:"bg-[#0D8BD9]" },
          { tipo:"laser"          as TipoConsent, label:"Láser Várices",   sub:"Terapia ND:YAG Control Venas",      icon:<Zap size={28}/>,      color:"border-amber-400 bg-amber-50",    iconBg:"bg-amber-500"  },
          { tipo:"paquete"        as TipoConsent, label:"Paquete Completo",sub:"Los 3 consentimientos en una sesión",icon:<Package size={28}/>,  color:"border-purple-400 bg-purple-50",  iconBg:"bg-purple-600" },
        ]).map(o => (
          <button key={o.tipo} onClick={() => onSelect(o.tipo)} className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${o.color}`}>
            <div className={`w-14 h-14 rounded-2xl ${o.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>{o.icon}</div>
            <div className="flex-1"><p className="font-bold text-base">{o.label}</p><p className="text-xs text-muted-foreground mt-0.5">{o.sub}</p></div>
            <ChevronRight size={18} className="text-muted-foreground"/>
          </button>
        ))}
      </div>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
        <p className="text-xs font-bold text-blue-800 flex items-center gap-2 mb-1"><Info size={14}/> Flujo de aprobación</p>
        <div className="text-[10px] text-blue-700 space-y-0.5">
          <p>1. Enfermera registra vitales y hace firmar el consentimiento al paciente</p>
          <p>2. El médico recibe una notificación automática con los datos del paciente</p>
          <p>3. El médico revisa y otorga el Visto Bueno para proceder con la cita</p>
          <p>4. Solo tras la aprobación médica se habilita la cita de consulta</p>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [ips, setIps] = useState<IPSConfig>(() => {
    try { const saved = localStorage.getItem("medfis_ips_config"); return saved ? JSON.parse(saved) : DEFAULT_IPS; } catch { return DEFAULT_IPS; }
  });

  const saveIPS = (config: IPSConfig) => { setIps(config); localStorage.setItem("medfis_ips_config", JSON.stringify(config)); addToast("success", "Configuración IPS guardada"); };

  const [usuarios,      setUsuarios]      = useState<Usuario[]>(() => {
    try { const saved = localStorage.getItem("medfis_usuarios"); return saved ? JSON.parse(saved) : USUARIOS_INICIALES; } catch { return USUARIOS_INICIALES; }
  });
  const [user,          setUser]          = useState<Usuario | null>(null);
  const [page,          setPage]          = useState<AppPage>("dashboard");
  const [records,       setRecords]       = useState<ConsentRecord[]>(() => {
    try { const s = localStorage.getItem("medfis_records"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [activeForm,    setActiveForm]    = useState<TipoConsent | null>(null);
  const [viewRecord,    setViewRecord]    = useState<ConsentRecord | null>(null);
  const [toasts,        setToasts]        = useState<ToastMsg[]>([]);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [showSettings,  setShowSettings]  = useState(false);
  const [notificaciones,setNotificaciones]= useState<Notificacion[]>(() => {
    try { const s = localStorage.getItem("medfis_notificaciones"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showChangePwd, setShowChangePwd] = useState(false);
  const getInitialId = (): number => {
    try { const s = localStorage.getItem("medfis_records"); const a = s ? JSON.parse(s) : []; return a.length + 1; } catch { return 1; }
  };
  const nextIdRef = useRef<number>(getInitialId());

  const addToast = useCallback((type: "success"|"error"|"info"|"warning", msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  }, []);

  const addNotificacion = useCallback((n: Omit<Notificacion, "id" | "leida" | "fecha">) => {
    const notif: Notificacion = { ...n, id: genId(), leida: false, fecha: new Date().toISOString() };
    setNotificaciones(prev => [...prev, notif]);
  }, []);

  const handleSave = (r: ConsentRecord) => {
    setRecords(prev => {
      const updated = [...prev, r];
      localStorage.setItem("medfis_records", JSON.stringify(updated));
      return updated;
    });
    nextIdRef.current += 1;
    setActiveForm(null);
    setPage("historial");
    const baseMsg = `${r.pacienteNombre} · ${r.tipo} · Radicado: ${r.radicado}. Revise y otorgue el Visto Bueno.`;
    const notifMedico: Notificacion = { id: genId(), tipo: "NUEVO_CONSENTIMIENTO", titulo: "Consentimiento pendiente de Visto Bueno", mensaje: baseMsg, consentId: r.id, leida: false, fecha: new Date().toISOString(), paraRol: "MÉDICO" };
    const notifAdmin:  Notificacion = { id: genId(), tipo: "NUEVO_CONSENTIMIENTO", titulo: `Nuevo consentimiento — ${r.pacienteNombre}`, mensaje: `Registrado por: ${r.creadoPor ?? "—"} · ${r.radicado} · Pendiente aprobación médica.`, consentId: r.id, leida: false, fecha: new Date().toISOString(), paraRol: "ADMINISTRADOR" };
    setNotificaciones(prev => {
      const updated = [...prev, notifMedico, notifAdmin];
      localStorage.setItem("medfis_notificaciones", JSON.stringify(updated));
      return updated;
    });
    addToast("success", `Consentimiento ${r.radicado} guardado`);
  };

  const handleAprobar = (id: string) => {
    setRecords(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, estado: "APROBADO" as EstadoConsent, pendienteMedico: false, aprobadoPor: user?.nombre, fechaAprobacion: hoy() } : r);
      localStorage.setItem("medfis_records", JSON.stringify(updated));
      return updated;
    });
    const r = records.find(x => x.id === id);
    if (r) {
      const notif: Notificacion = { id: genId(), tipo: "APROBADO", titulo: "Visto Bueno otorgado", mensaje: `${r.pacienteNombre} — ${r.radicado} aprobado. La cita puede proceder.`, consentId: r.id, leida: false, fecha: new Date().toISOString(), paraRol: "TODOS" };
      setNotificaciones(prev => { const updated = [...prev, notif]; localStorage.setItem("medfis_notificaciones", JSON.stringify(updated)); return updated; });
    }
  };

  const handleRechazar = (id: string, motivo: string) => {
    setRecords(prev => {
      const updated = prev.map(r => r.id === id ? { ...r, estado: "RECHAZADO" as EstadoConsent, pendienteMedico: false, motivoRechazo: motivo } : r);
      localStorage.setItem("medfis_records", JSON.stringify(updated));
      return updated;
    });
    const r = records.find(x => x.id === id);
    if (r) {
      const notif: Notificacion = { id: genId(), tipo: "RECHAZADO", titulo: "Consentimiento rechazado", mensaje: `${r.pacienteNombre} — ${r.radicado}. Motivo: ${motivo}`, consentId: r.id, leida: false, fecha: new Date().toISOString(), paraRol: "TODOS" };
      setNotificaciones(prev => { const updated = [...prev, notif]; localStorage.setItem("medfis_notificaciones", JSON.stringify(updated)); return updated; });
    }
  };

  const handleDelete = (id: string) => {
    setRecords(prev => {
      const updated = prev.map(r => r.id===id ? {...r, estado:"ANULADO" as EstadoConsent, pendienteMedico:false} : r);
      localStorage.setItem("medfis_records", JSON.stringify(updated));
      return updated;
    });
    addToast("info","Consentimiento anulado");
  };

  const handleAddUser = (u: Usuario) => {
    const updated = [...usuarios, u];
    setUsuarios(updated);
    localStorage.setItem("medfis_usuarios", JSON.stringify(updated));
  };

  const handleEditUser = (updatedUser: Usuario) => {
    const list = usuarios.map(u => u.id === updatedUser.id ? updatedUser : u);
    setUsuarios(list);
    localStorage.setItem("medfis_usuarios", JSON.stringify(list));
    if (user?.id === updatedUser.id) setUser(updatedUser);
  };

  const handleChangeUserPassword = (userId: string, newPassword: string) => {
    const list = usuarios.map(u => u.id === userId ? { ...u, password: newPassword } : u);
    setUsuarios(list);
    localStorage.setItem("medfis_usuarios", JSON.stringify(list));
    addToast("success", "Contraseña actualizada correctamente");
  };

  const handleToggleActivo = (id: string) => {
    const target = usuarios.find(u => u.id === id);
    if (target?.rol === "ADMINISTRADOR") { addToast("error", "No se puede desactivar al Administrador"); return; }
    const updated = usuarios.map(u => u.id === id ? { ...u, activo: !u.activo } : u);
    setUsuarios(updated);
    localStorage.setItem("medfis_usuarios", JSON.stringify(updated));
  };

  const notifCount    = notificaciones.filter(n => !n.leida && (n.paraRol === "TODOS" || n.paraRol === user?.rol)).length;
  const myNotifs      = notificaciones.filter(n => n.paraRol === "TODOS" || n.paraRol === user?.rol);

  // Simulación polling backend (Spring Boot WebSocket)
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      /* En producción: conectar a WS STOMP → ws://localhost:8080/ws/notificaciones
       * client.subscribe('/user/queue/notificaciones', msg => { addNotificacion(JSON.parse(msg.body)); });
       */
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return (
    <IPSContext.Provider value={ips}>
      <LoginPage onLogin={u => { setUser(u); addToast("success", `Bienvenido/a, ${u.nombre}`); }} usuarios={usuarios}/>
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))}/>
    </IPSContext.Provider>
  );

  return (
    <IPSContext.Provider value={ips}>
      <div className="min-h-screen bg-background flex">
        <Sidebar page={page} onPage={setPage} user={user}
          onLogout={() => { setUser(null); setPage("dashboard"); addToast("info","Sesión cerrada"); }}
          records={records} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
          onSettings={() => setShowSettings(true)} onChangePwd={() => setShowChangePwd(true)} notifCount={notifCount}/>

        <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">
          {/* Topbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border sticky top-0 z-30">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-muted"><Menu size={18}/></button>
            <p className="font-bold text-sm lg:hidden">{ips.nombre}</p>
            <div className="hidden lg:block"/>
            <div className="flex items-center gap-3">
              {/* Bell de notificaciones */}
              <button onClick={() => setShowNotifs(v => !v)} className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                <Bell size={18} className="text-muted-foreground"/>
                {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">{notifCount}</span>}
              </button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0D51D9] flex items-center justify-center text-white text-xs font-bold">{user.nombre.charAt(0)}</div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold leading-tight truncate max-w-[120px]">{user.nombre.split(" ")[0]}</p>
                  <p className="text-[9px] text-muted-foreground">{user.rol}</p>
                </div>
              </div>
            </div>
          </div>

          <main className="flex-1 p-3 sm:p-5 lg:p-6 max-w-5xl mx-auto w-full">
            {page==="dashboard" && (
              <DashboardPage records={records} onNewForm={t => { setActiveForm(t); setPage("form"); }}
                user={user} onViewRecord={setViewRecord} onAprobar={handleAprobar} onRechazar={handleRechazar} addToast={addToast}/>
            )}
            {page==="form" && !activeForm && <TipoSelectorPage onSelect={t => setActiveForm(t)}/>}
            {page==="historial" && (
              <HistorialPage records={records} onView={setViewRecord} onDelete={handleDelete}
                onAprobar={handleAprobar} onRechazar={handleRechazar} addToast={addToast} user={user}/>
            )}
            {page==="admin" && user.rol === "ADMINISTRADOR" && (
              <AdminStatsPage records={records} usuarios={usuarios}/>
            )}
            {page==="staff" && user.rol === "ADMINISTRADOR" && (
              <StaffPage
                usuarios={usuarios}
                onAddUser={handleAddUser}
                onToggleActivo={handleToggleActivo}
                onEditUser={handleEditUser}
                onChangePassword={handleChangeUserPassword}
                addToast={addToast}
              />
            )}
          </main>
        </div>

        {/* Formularios */}
        {activeForm==="escleroterapia" && <FormEscleroterapia onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current} userName={user.nombre}/>}
        {activeForm==="sueroterapia"   && <FormSueroterapia   onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current} userName={user.nombre}/>}
        {activeForm==="laser"          && <FormLaser           onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current} userName={user.nombre}/>}
        {activeForm==="paquete"        && <FormPaquete         onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current} userName={user.nombre}/>}

        {viewRecord && <PDFModal record={viewRecord} onClose={() => setViewRecord(null)} addToast={addToast}/>}
        {showSettings && user.rol === "ADMINISTRADOR" && <IPSSettingsModal ips={ips} onSave={saveIPS} onClose={() => setShowSettings(false)}/>}
        {showChangePwd && user.rol === "ADMINISTRADOR" && (
          <AdminChangePwdModal
            user={user}
            onSave={(newPwd) => { handleChangeUserPassword(user.id, newPwd); setShowChangePwd(false); }}
            onClose={() => setShowChangePwd(false)}
          />
        )}
        {showNotifs && (
          <NotificationPanel
            notifs={myNotifs}
            onClose={() => setShowNotifs(false)}
            onMarkRead={id => setNotificaciones(prev => prev.map(n => n.id === id ? {...n, leida: true} : n))}
            onMarkAllRead={() => setNotificaciones(prev => prev.map(n => ({...n, leida: true})))}
            onOpenConsent={id => { const r = records.find(x => x.id === id); if (r) { setViewRecord(r); setShowNotifs(false); } }}
          />
        )}

        <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))}/>
      </div>
    </IPSContext.Provider>
  );
}
