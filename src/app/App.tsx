import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  FileText, LogOut, Plus, Search, Eye, Trash2, Download,
  Send, CheckCircle, Clock, XCircle, Mail, MessageSquare,
  Pen, ChevronRight, ChevronLeft, Bell, Menu, X,
  Shield, LayoutDashboard, Check, Phone, Stethoscope,
  Package, Syringe, Zap, Droplets, Printer,
  ThumbsUp, ThumbsDown, ClipboardList, BookOpen,
  Activity, MapPin, AtSign, UserCheck, AlertTriangle,
  Info, Users, Heart, Settings, Save
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── TIPOS IPS ────────────────────────────────────────────────────────────────
interface IPSConfig {
  nombre: string;
  nit: string;
  medico: string;
  rm: string;
  ciudad: string;
}

const DEFAULT_IPS: IPSConfig = {
  nombre: "Med&Fis",
  nit: "901102930",
  medico: "Dr. Rafael Eduardo Marrero Padilla",
  rm: "RM 3880525",
  ciudad: "Medellín, Colombia",
};

// ─── CONTEXTO IPS ─────────────────────────────────────────────────────────────
const IPSContext = createContext<IPSConfig>(DEFAULT_IPS);
const useIPS = () => useContext(IPSContext);

// ─── TIPOS APP ────────────────────────────────────────────────────────────────
type AppPage = "login" | "dashboard" | "form" | "historial";
type TipoConsent = "escleroterapia" | "sueroterapia" | "laser" | "paquete";
type EstadoConsent = "FIRMADO" | "PENDIENTE" | "ANULADO";

interface Usuario { id: string; nombre: string; email: string; rol: string; password: string; }

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
  frecuencia: string; fluencia: string; energia: string;
  area: string; pases: string;
}

interface DatosPaquete {
  paciente: DatosPaciente;
  vitales: DatosVitales;
  cuestionario: Record<string, "Si" | "No" | "">;
  dosis_vitC: string; dosis_compB: string; viaPrescripcion: string;
  trazabilidad: { nacl: string; vitC: string; compB: string; jeringa: string; pericraneal: string; macrogotero: string; };
  parametros: LaserRow[];
  firmaConsentimiento: string;
  consentido: boolean | null;
}

interface DatosEscleroterapia {
  paciente: DatosPaciente; cuestionario: Record<string, "Si" | "No" | "">;
  vitales: DatosVitales; firmaConsentimiento: string; consentido: boolean | null;
}

interface DatosSueroterapia {
  paciente: DatosPaciente; vitales: DatosVitales;
  dosis_vitC: string; dosis_compB: string; viaPrescripcion: string;
  trazabilidad: { nacl: string; vitC: string; compB: string; jeringa: string; pericraneal: string; macrogotero: string; };
  firmaConsentimiento: string; consentido: boolean | null;
}

interface DatosLaser {
  paciente: DatosPaciente; vitales: DatosVitales;
  parametros: LaserRow[]; firmaConsentimiento: string; consentido: boolean | null;
}

interface ConsentRecord {
  id: string; tipo: TipoConsent; radicado: string; fecha: string;
  pacienteNombre: string; pacienteDoc: string; pacienteTel: string;
  estado: EstadoConsent; enviado_email: boolean; enviado_whatsapp: boolean; pendienteMedico: boolean;
  datos: DatosEscleroterapia | DatosSueroterapia | DatosLaser | DatosPaquete;
}

// ─── MOCK USUARIOS ────────────────────────────────────────────────────────────
const USUARIOS: Usuario[] = [
  { id: "1", nombre: "Dr. Rafael Eduardo Marrero Padilla", email: "rafael.marrero@medfis.com", rol: "MÉDICO",        password: "medico123"   },
  { id: "2", nombre: "Administrador Med&Fis",               email: "admin@medfis.com",          rol: "ADMINISTRADOR", password: "admin123"    },
  { id: "3", nombre: "Auxiliar Recepción",                  email: "auxiliar@medfis.com",        rol: "AUXILIAR",      password: "auxiliar123" },
];

// ─── CUESTIONARIO ─────────────────────────────────────────────────────────────
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

// ─── TEXTOS CONSENTIMIENTO (funciones para IPS dinámico) ──────────────────────
function makeTextoEscleroterapia(ips: IPSConfig) {
  return `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES, en las instalaciones de la IPS ${ips.nombre} (NIT ${ips.nit}), bajo la responsabilidad del ${ips.medico} (${ips.rm}).

INFORMACIÓN DEL PROCEDIMIENTO:
La escleroterapia es un procedimiento médico utilizado para el tratamiento de várices y arañas vasculares (telangiectasias) de los miembros inferiores. Consiste en la inyección de una solución esclerosante (Polidocanol) directamente en el interior del vaso afectado, lo que produce la inflamación y cierre de este.

BENEFICIOS ESPERADOS:
• Eliminación o reducción notable de las várices y telangiectasias tratadas.
• Mejoría estética y funcional de los miembros inferiores.
• Alivio de síntomas como pesadez, cansancio y dolor en piernas.

RIESGOS Y POSIBLES COMPLICACIONES:
• Hiperpigmentación cutánea (manchas oscuras) temporal o permanente.
• Neovascularización (aparición de nuevos vasos pequeños).
• Reacción alérgica al esclerosante (rara pero posible).
• Tromboflebitis superficial (inflamación de la vena tratada).
• Ulceración cutánea en casos muy raros.
• Dolor o ardor en el sitio de inyección durante y después del procedimiento.

ALTERNATIVAS TERAPÉUTICAS:
• Cirugía de várices (fleboextracción).
• Tratamiento con láser endovenoso.
• Uso de medias de compresión (tratamiento conservador).
• Abstención de tratamiento.

OBLIGACIONES DEL PACIENTE POST-PROCEDIMIENTO:
• Usar medias de compresión durante el tiempo indicado por el médico.
• Evitar exposición solar directa en zonas tratadas por mínimo 30 días.
• Caminar diariamente al menos 30 minutos.
• Evitar baños calientes, saunas y ejercicio intenso por 48-72 horas.
• Consultar inmediatamente si presenta inflamación excesiva, úlceras o reacción alérgica.

El paciente declara que ha recibido suficiente información sobre el procedimiento, ha tenido la oportunidad de realizar preguntas que han sido respondidas de manera satisfactoria. Autoriza la realización del procedimiento de manera libre, voluntaria y sin coacción alguna.`;
}

function makeTextoSueroterapia(ips: IPSConfig) {
  return `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de SUEROTERAPIA DE VITAMINA C Y/O COMPLEJO B, en las instalaciones de la IPS ${ips.nombre} (NIT ${ips.nit}), bajo la responsabilidad del ${ips.medico} (${ips.rm}).

INFORMACIÓN DEL PROCEDIMIENTO:
La sueroterapia vitamínica consiste en la administración endovenosa o intramuscular de vitaminas (Vitamina C y/o Complejo B) diluidas en solución salina (NaCl 0.9%), con el objetivo de suplementar deficiencias nutricionales, mejorar el estado general del paciente y apoyar funciones metabólicas específicas.

VITAMINA C (Ácido Ascórbico):
Antioxidante potente, favorece la síntesis de colágeno, mejora la inmunidad, apoya la cicatrización de tejidos y tiene propiedades antiinflamatorias.

COMPLEJO B (B1, B6, B12):
Esencial para el metabolismo energético, función neurológica, producción de glóbulos rojos y síntesis de neurotransmisores.

POSIBLES RIESGOS:
• Dolor o inflamación en el sitio de punción.
• Reacción alérgica (poco frecuente).
• Sensación de calor o rubefacción durante la infusión.
• Mareo o náuseas leves (muy raros).
• Extravasación del suero (en caso de punción defectuosa).

CONTRAINDICACIONES RELATIVAS:
• Cálculos renales por oxalato — dosis altas de Vitamina C.
• Déficit de G6PD — hemólisis con dosis altas de Vitamina C.
• Hipercoagulabilidad — evaluar individualmente.

El paciente declara que ha sido informado de manera clara sobre el procedimiento, sus beneficios, riesgos y alternativas. Autoriza la realización del procedimiento de manera libre, voluntaria y sin coacción alguna.`;
}

function makeTextoLaser(ips: IPSConfig) {
  return `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de TERAPIA LÁSER ND:YAG PARA EL CONTROL DE VENAS VÁRICES, en las instalaciones de la IPS ${ips.nombre} (NIT ${ips.nit}), bajo la responsabilidad del ${ips.medico} (${ips.rm}).

INFORMACIÓN DEL PROCEDIMIENTO:
La terapia láser con equipo Nd:YAG (longitud de onda 1064 nm) es un tratamiento utilizado para el control de venas varicosas y telangiectasias. El láser emite energía que es absorbida selectivamente por la hemoglobina del vaso, generando calor que colapsa y cierra la vena sin dañar el tejido circundante.

FOTOTIPOS DE PIEL (Fitzpatrick):
• Fototipo I-II: Piel muy clara — parámetros menores.
• Fototipo III-IV: Piel morena — parámetros intermedios.
• Fototipo V-VI: Piel oscura — mayor precaución y ajuste de parámetros.

BENEFICIOS ESPERADOS:
• Reducción o eliminación de venas tratadas.
• Procedimiento sin incisiones, mínimo tiempo de recuperación.
• Mejora estética y funcional de los miembros inferiores.

RIESGOS Y POSIBLES EFECTOS SECUNDARIOS:
• Eritema (enrojecimiento) temporal en el área tratada.
• Edema (inflamación) leve post-tratamiento.
• Cambios pigmentarios temporales.
• Costras o ampollas superficiales (raras, energías altas).
• Dolor durante el procedimiento (sensación de calor intenso puntual).
• Resultado incompleto que requiera sesiones adicionales.

INSTRUCCIONES POST-TRATAMIENTO:
• Aplicar compresas frías si hay sensación de calor excesivo.
• Evitar exposición solar directa por 30 días. Usar protector solar FPS 50+.
• No aplicar calor local (saunas, baños calientes) por 72 horas.
• Usar medias de compresión según indicación médica.

El paciente declara haber leído y comprendido este documento en su totalidad y autoriza voluntariamente la realización del procedimiento descrito.`;
}

// ─── CHARTS DATA ──────────────────────────────────────────────────────────────
const CHART_MENSUAL = [
  { mes: "Feb", escler: 8, suero: 5, laser: 3 },
  { mes: "Mar", escler: 12, suero: 7, laser: 5 },
  { mes: "Abr", escler: 10, suero: 9, laser: 4 },
  { mes: "May", escler: 15, suero: 11, laser: 7 },
  { mes: "Jun", escler: 18, suero: 8, laser: 9 },
  { mes: "Jul", escler: 22, suero: 13, laser: 11 },
];
const CHART_TIPOS = [
  { name: "Escleroterapia", value: 46, color: "#1A56DB" },
  { name: "Sueroterapia",   value: 29, color: "#00B896" },
  { name: "Láser Várices",  value: 25, color: "#F59E0B" },
];

// ─── UTILS ───────────────────────────────────────────────────────────────────
function genRadicado(tipo: TipoConsent, n: number) {
  const prefix = { escleroterapia: "ESC", sueroterapia: "SUE", laser: "LAS", paquete: "PAQ" }[tipo];
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}
function hoy() { return new Date().toISOString().split("T")[0]; }
function fmtFecha(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T12:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}
function calcIMC(peso: string, talla: string): string {
  const p = parseFloat(peso);
  const t = parseFloat(talla) / 100;
  if (!p || !t) return "";
  return (p / (t * t)).toFixed(1);
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; type: "success" | "error" | "info"; msg: string; }
function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white
          ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-[#1A56DB]"}`}>
          {t.type === "success" ? <Check size={15}/> : t.type === "error" ? <XCircle size={15}/> : <Bell size={15}/>}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={13} className="opacity-70"/></button>
        </div>
      ))}
    </div>
  );
}

// ─── BADGES ──────────────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: EstadoConsent }) {
  const c = { FIRMADO: "bg-emerald-50 text-emerald-700 border-emerald-200", PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200", ANULADO: "bg-red-50 text-red-600 border-red-200" }[estado];
  const icon = { FIRMADO: <CheckCircle size={11}/>, PENDIENTE: <Clock size={11}/>, ANULADO: <XCircle size={11}/> }[estado];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${c}`}>{icon} {estado}</span>;
}

function TipoBadge({ tipo }: { tipo: TipoConsent }) {
  const cfg = {
    escleroterapia: { color: "bg-[#1A56DB]/10 text-[#1A56DB]",   icon: <Syringe size={10}/>, label: "Escleroterapia" },
    sueroterapia:   { color: "bg-[#00B896]/10 text-[#00B896]",   icon: <Droplets size={10}/>, label: "Sueroterapia"  },
    laser:          { color: "bg-amber-100 text-amber-700",        icon: <Zap size={10}/>,     label: "Láser Várices" },
    paquete:        { color: "bg-purple-100 text-purple-700",      icon: <Package size={10}/>, label: "Paquete"       },
  }[tipo];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>;
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
    ctx.strokeStyle = "#0C1A35"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); drawing.current = true; const p = getPos(e, canvas); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move  = (e: MouseEvent | TouchEvent) => { e.preventDefault(); if (!drawing.current) return; const p = getPos(e, canvas); ctx.lineTo(p.x, p.y); ctx.stroke(); setHasDrawn(true); };
    const end   = () => { drawing.current = false; };
    canvas.addEventListener("mousedown", start); canvas.addEventListener("mousemove", move); canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false }); canvas.addEventListener("touchmove", move, { passive: false }); canvas.addEventListener("touchend", end);
    return () => { canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", move); canvas.removeEventListener("mouseup", end); canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", end); };
  }, []);

  const clear = () => { const c = canvasRef.current!; const ctx = c.getContext("2d")!; ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); setHasDrawn(false); };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center"><Pen size={15} className="text-[#1A56DB]"/></div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-[10px] text-muted-foreground">Firme con dedo en tablet o mouse en PC</p>
            </div>
          </div>
          <button onClick={onCancel}><X size={18} className="text-muted-foreground"/></button>
        </div>
        <div className="p-5">
          <div className="border-2 border-dashed border-[#1A56DB]/30 rounded-xl overflow-hidden bg-[#f8faff]">
            <canvas ref={canvasRef} width={600} height={240} className="w-full cursor-crosshair" style={{ touchAction: "none" }}/>
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2">Optimizado para tablet — dedo o lápiz táctil</p>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button onClick={clear} className="py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted">Limpiar</button>
            <button onClick={onCancel} className="py-2.5 rounded-lg border border-border text-sm font-medium">Cancelar</button>
            <button onClick={() => onSave(canvasRef.current!.toDataURL("image/png"))} disabled={!hasDrawn}
              className="py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#1648bf] transition-colors">
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
            className="w-full border-2 border-dashed border-[#1A56DB]/30 rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-[#1A56DB]/5 transition-colors">
            <Pen size={22} className="text-[#1A56DB]/40"/>
            <p className="text-sm font-semibold text-[#1A56DB]">Toque aquí para firmar</p>
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
          className={`w-full border border-border rounded-lg ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB] transition-colors
            ${readOnly ? "bg-muted text-muted-foreground cursor-default" : "bg-input-background"}`}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 1 — DATOS DEL PACIENTE
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
      <div className="p-3 bg-[#0C1A35] rounded-xl flex items-center gap-3">
        <Stethoscope size={18} className="text-[#1A56DB] flex-shrink-0"/>
        <div>
          <p className="text-[10px] font-bold text-white uppercase tracking-wider">{ips.nombre} · NIT {ips.nit}</p>
          <p className="text-[10px] text-[#8899BB]">{ips.medico} · {ips.rm}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#1A56DB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield size={11}/> Identificación del Paciente
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
              Tipo Doc <span className="text-red-500">*</span>
            </label>
            <select value={data.tipoDoc} onChange={e => s("tipoDoc")(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
              <option value="CC">CC — Cédula Ciudadanía</option>
              <option value="CE">CE — Cédula Extranjería</option>
              <option value="PA">PA — Pasaporte</option>
              <option value="TI">TI — Tarjeta Identidad</option>
              <option value="RC">RC — Registro Civil</option>
            </select>
          </div>
          <Field label="No. Documento" value={data.documento} onChange={s("documento")} placeholder="Número" required icon={<Shield size={13}/>}/>
        </div>
        <div className="mt-3">
          <Field label="Nombre completo" value={data.nombre} onChange={s("nombre")} placeholder="Nombres y apellidos completos" required icon={<UserCheck size={13}/>}/>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Fecha de nacimiento" value={data.fechaNacimiento} onChange={s("fechaNacimiento")} type="date"/>
          <Field label="Fecha de consulta" value={data.fecha} onChange={s("fecha")} type="date" required/>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-[#1A56DB] uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Phone size={11}/> Datos de Contacto
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Teléfono / Celular" value={data.telefono} onChange={s("telefono")} placeholder="3001234567" type="tel" icon={<Phone size={13}/>} required/>
          <Field label="Correo electrónico" value={data.email} onChange={s("email")} placeholder="correo@ejemplo.com" type="email" icon={<AtSign size={13}/>}/>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Field label="Dirección de residencia" value={data.direccion} onChange={s("direccion")} placeholder="Cra 45 #23-10" icon={<MapPin size={13}/>}/>
          <Field label="Ciudad" value={data.ciudad} onChange={s("ciudad")} placeholder="Medellín"/>
        </div>
      </div>

      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Heart size={11}/> Contacto de Emergencia
        </p>
        <div className="space-y-3">
          <Field label="Nombre del contacto" value={data.contactoNombre} onChange={s("contactoNombre")} placeholder="Nombre completo" icon={<Users size={13}/>} required/>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
                Parentesco <span className="text-red-500">*</span>
              </label>
              <select value={data.contactoParentesco} onChange={e => s("contactoParentesco")(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
                <option value="">Seleccionar...</option>
                <option value="Cónyuge">Cónyuge</option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Hijo/a">Hijo/a</option>
                <option value="Hermano/a">Hermano/a</option>
                <option value="Amigo/a">Amigo/a</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <Field label="Teléfono de emergencia" value={data.contactoTelefono} onChange={s("contactoTelefono")} placeholder="3001234567" type="tel" icon={<Phone size={13}/>} required/>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP 2 — VITALES
// ═══════════════════════════════════════════════════════════════════════════════
const VITALES_EMPTY: DatosVitales = {
  oximetria: "", tension: "", frecuenciaCardiaca: "", frecuenciaRespiratoria: "",
  temperatura: "", peso: "", talla: "", imc: "", glucemia: "", observaciones: "",
};

function StepVitalesEnfermera({ data, onChange, extraContent }: {
  data: DatosVitales; onChange: (d: DatosVitales) => void; extraContent?: React.ReactNode;
}) {
  const s = (k: keyof DatosVitales) => (v: string) => {
    const updated = { ...data, [k]: v };
    if (k === "peso" || k === "talla") updated.imc = calcIMC(updated.peso, updated.talla);
    onChange(updated);
  };

  const Vital = ({ label, k, placeholder, unit, color = "border-[#1A56DB]/20" }: {
    label: string; k: keyof DatosVitales; placeholder: string; unit: string; color?: string;
  }) => (
    <div className={`bg-white border-2 ${color} rounded-xl p-3 text-center`}>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">{label}</p>
      <input value={data[k]} onChange={e => s(k)(e.target.value)} placeholder={placeholder}
        className="w-full text-center text-lg font-black border-0 focus:outline-none bg-transparent py-0.5 placeholder:text-muted-foreground/30"/>
      <p className="text-[10px] text-muted-foreground font-medium">{unit}</p>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 p-3 bg-[#1A56DB]/8 border border-[#1A56DB]/20 rounded-xl">
        <Activity size={16} className="text-[#1A56DB] flex-shrink-0"/>
        <div>
          <p className="text-xs font-bold text-[#1A56DB]">Sección Auxiliar de Enfermería</p>
          <p className="text-[10px] text-muted-foreground">Registre los signos vitales ANTES de que el paciente lea y firme el consentimiento</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Signos Vitales</p>
        <div className="grid grid-cols-3 gap-2">
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
        <div className="grid grid-cols-3 gap-2">
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
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Observaciones de Enfermería
        </label>
        <textarea value={data.observaciones} onChange={e => s("observaciones")(e.target.value)}
          rows={3} placeholder="Anotaciones relevantes: alergias observadas, condición del paciente..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 resize-none"/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP — CUESTIONARIO
// ═══════════════════════════════════════════════════════════════════════════════
function StepCuestionario({ data, onChange }: { data: Record<string, "Si" | "No" | "">; onChange: (d: Record<string, "Si" | "No" | "">) => void }) {
  const answered = Object.values(data).filter(v => v !== "").length;
  return (
    <div className="space-y-2">
      <div className="bg-[#EEF2F8] rounded-xl p-3 mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-[#1A56DB]">Test Diagnóstico / Pronóstico / Contraindicantes</p>
          <p className="text-[10px] text-muted-foreground">Marque Sí o No para cada pregunta</p>
        </div>
        <span className="bg-[#1A56DB] text-white text-xs font-bold px-2.5 py-1 rounded-lg">{answered}/{CUESTIONARIO_PREGUNTAS.length}</span>
      </div>
      {CUESTIONARIO_PREGUNTAS.map((q, i) => (
        <div key={`q-${i}`} className="flex items-start justify-between gap-3 p-3 bg-white border border-border rounded-xl hover:border-[#1A56DB]/30 transition-colors">
          <p className="text-xs flex-1 leading-relaxed">{q}</p>
          <div className="flex gap-1.5 flex-shrink-0">
            {(["Si", "No"] as const).map(opt => (
              <button key={opt} onClick={() => onChange({ ...data, [q]: opt })}
                className={`w-10 py-1.5 rounded-lg text-xs font-bold border transition-colors
                  ${data[q] === opt
                    ? opt === "Si" ? "bg-red-500 border-red-500 text-white" : "bg-emerald-500 border-emerald-500 text-white"
                    : "border-border text-muted-foreground hover:border-[#1A56DB]/40"}`}>
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP — LEER CONSENTIMIENTO
// ═══════════════════════════════════════════════════════════════════════════════
function StepLeerConsentimiento({ titulo, texto, leido, onLeido }: {
  titulo: string; texto: string; leido: boolean; onLeido: (v: boolean) => void;
}) {
  const ips = useIPS();
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current; if (!el) return;
    if (el.scrollHeight - el.scrollTop <= el.clientHeight + 50) setScrolledToEnd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
        <BookOpen size={16} className="text-amber-600 flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-xs font-bold text-amber-800">Lectura obligatoria del consentimiento</p>
          <p className="text-[10px] text-amber-700 mt-0.5">El paciente debe leer el documento completo. Desplace hasta el final para habilitar la firma.</p>
        </div>
      </div>

      <div className="border-2 border-[#1A56DB]/20 rounded-xl overflow-hidden">
        <div className="bg-[#0C1A35] px-4 py-3">
          <p className="text-[10px] text-[#C8D6EF] font-bold uppercase tracking-wider">Consentimiento Informado</p>
          <p className="text-xs text-white font-semibold">{titulo}</p>
          <p className="text-[10px] text-[#8899BB] mt-0.5">{ips.nombre} · NIT {ips.nit} · {ips.medico}</p>
        </div>
        <div ref={scrollRef} onScroll={handleScroll}
          className="h-72 overflow-y-auto p-5 bg-white text-xs leading-relaxed text-foreground whitespace-pre-line">
          {texto}
          <div className="mt-6 pt-4 border-t border-dashed border-border text-center text-[10px] text-muted-foreground">
            — Fin del documento · {ips.nombre} · {new Date().getFullYear()} —
          </div>
        </div>
        {!scrolledToEnd ? (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2">
            <Info size={12} className="text-amber-600"/><p className="text-[10px] text-amber-700">Desplace el texto hasta el final para habilitar la firma</p>
          </div>
        ) : (
          <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-600"/><p className="text-[10px] text-emerald-700">Documento leído completamente</p>
          </div>
        )}
      </div>

      {scrolledToEnd && (
        <button onClick={() => onLeido(true)}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 font-semibold text-sm transition-all
            ${leido ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-[#1A56DB] bg-[#1A56DB]/5 text-[#1A56DB] hover:bg-[#1A56DB]/10"}`}>
          <CheckCircle size={18}/>
          {leido ? "Leído y comprendido ✓" : "Confirmar que leí y comprendí el documento"}
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP — FIRMA FINAL
// ═══════════════════════════════════════════════════════════════════════════════
function StepFirmaFinal({ consentido, onConsentido, firma, onFirma, nombrePaciente }: {
  consentido: boolean | null; onConsentido: (v: boolean) => void;
  firma: string; onFirma: (v: string) => void; nombrePaciente: string;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-[#EEF2F8] rounded-xl border border-[#1A56DB]/15">
        <Shield size={16} className="text-[#1A56DB] flex-shrink-0 mt-0.5"/>
        <div>
          <p className="text-xs font-bold text-[#1A56DB]">Decisión y Firma del Paciente</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Al firmar, el documento quedará disponible para revisión del médico en el dashboard.</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Decisión del Paciente</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onConsentido(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${consentido === true ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
            <ThumbsUp size={22} className={consentido === true ? "text-emerald-600" : "text-muted-foreground"}/>
            <div className="text-left">
              <p className={`text-sm font-bold ${consentido === true ? "text-emerald-700" : "text-muted-foreground"}`}>CONSIENTO</p>
              <p className="text-[10px] text-muted-foreground">Autorizo el procedimiento</p>
            </div>
          </button>
          <button onClick={() => onConsentido(false)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${consentido === false ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}>
            <ThumbsDown size={22} className={consentido === false ? "text-red-600" : "text-muted-foreground"}/>
            <div className="text-left">
              <p className={`text-sm font-bold ${consentido === false ? "text-red-700" : "text-muted-foreground"}`}>DISIENTO</p>
              <p className="text-[10px] text-muted-foreground">NO autorizo</p>
            </div>
          </button>
        </div>
      </div>

      <FirmaField label={`Firma del Paciente — ${nombrePaciente || "Paciente"}`} value={firma} onChange={onFirma}/>

      {firma && consentido !== null && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2
          ${consentido ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
          {consentido ? <CheckCircle size={14}/> : <AlertTriangle size={14}/>}
          {consentido ? "El consentimiento se guardará y se notificará al médico." : "El disentimiento quedará registrado. No se realizará el procedimiento."}
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
  const vitales = d.vitales as DatosVitales;

  const TITULOS: Record<TipoConsent, string> = {
    escleroterapia: "ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES",
    sueroterapia:   "SUEROTERAPIA VITAMINA C Y/O COMPLEJO B",
    laser:          "TERAPIA LÁSER ND:YAG PARA CONTROL DE VENAS VÁRICES",
    paquete:        "PAQUETE COMPLETO — ESCLEROTERAPIA · SUEROTERAPIA · LÁSER ND:YAG",
  };

  return (
    <div className="bg-white p-7 max-w-[640px] mx-auto text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="flex items-start justify-between pb-4 mb-4 border-b-2 border-[#1A56DB]">
        <div>
          <p className="font-black text-2xl text-[#1A56DB] tracking-tight">{ips.nombre}</p>
          <p className="text-[10px] text-muted-foreground font-mono">NIT {ips.nit}</p>
          <p className="text-[10px] text-muted-foreground">{ips.ciudad}</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-mono text-[#1A56DB] font-bold">{record.radicado}</p>
          <p className="text-[10px] text-muted-foreground">{fmtFecha(record.fecha)}</p>
          <div className="mt-1"><StatusBadge estado={record.estado}/></div>
        </div>
      </div>

      <p className="text-center font-black text-sm uppercase tracking-wide text-[#0C1A35] mb-1">CONSENTIMIENTO INFORMADO</p>
      <p className="text-center text-xs font-bold text-[#1A56DB] mb-5">{TITULOS[record.tipo]}</p>

      {record.tipo === "paquete" && (
        <div className="mb-4 flex items-center gap-2 flex-wrap justify-center">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#1A56DB]/10 text-[#1A56DB] rounded-full text-[10px] font-bold"><Syringe size={10}/> Escleroterapia</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-[#00B896]/10 text-[#00B896] rounded-full text-[10px] font-bold"><Droplets size={10}/> Sueroterapia</span>
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold"><Zap size={10}/> Láser ND:YAG</span>
        </div>
      )}

      <div className="mb-4 p-3 bg-[#EEF2F8] rounded-xl">
        <p className="text-[9px] font-bold text-[#1A56DB] uppercase tracking-wider mb-2">Datos del Paciente</p>
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
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Signos Vitales — Registro Enfermería</p>
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[["SpO2", vitales.oximetria + "%"], ["T.A.", vitales.tension], ["F.C.", vitales.frecuenciaCardiaca + " lpm"], ["F.R.", vitales.frecuenciaRespiratoria + " rpm"], ["Temp.", vitales.temperatura + "°C"]].map(([l,v]) => (
              <div key={l} className="bg-[#EEF2F8] rounded-lg p-2 text-center">
                <p className="text-[8px] text-muted-foreground font-bold">{l}</p>
                <p className="text-[10px] font-bold">{v || "—"}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[["Peso", vitales.peso + " kg"], ["Talla", vitales.talla + " cm"], ["IMC", vitales.imc + " kg/m²"]].map(([l,v]) => (
              <div key={l} className="bg-emerald-50 rounded-lg p-2 text-center">
                <p className="text-[8px] text-muted-foreground font-bold">{l}</p>
                <p className="text-[10px] font-bold text-emerald-700">{v || "—"}</p>
              </div>
            ))}
          </div>
          {vitales.glucemia && (
            <div className="mt-1 bg-yellow-50 rounded-lg p-2 flex items-center gap-2">
              <p className="text-[9px] font-bold text-muted-foreground">Glucemia:</p>
              <p className="text-[10px] font-bold">{vitales.glucemia} mg/dL</p>
            </div>
          )}
          {vitales.observaciones && (
            <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-[9px] font-bold text-blue-700 uppercase">Obs. Enfermería:</p>
              <p className="text-[10px]">{vitales.observaciones}</p>
            </div>
          )}
        </div>
      )}

      {(record.tipo === "escleroterapia" || record.tipo === "paquete") && d.cuestionario && Object.keys(d.cuestionario).length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Syringe size={9}/> Test Diagnóstico — Escleroterapia</p>
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
            <div className="bg-[#EEF2F8] rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Vitamina C</p>
              <p className="text-xs font-bold">{d.dosis_vitC || "—"}</p>
            </div>
            <div className="bg-[#EEF2F8] rounded-lg p-2 text-center">
              <p className="text-[9px] text-muted-foreground">Complejo B</p>
              <p className="text-xs font-bold">{d.dosis_compB || "—"}</p>
            </div>
          </div>
          {d.trazabilidad && (
            <>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Trazabilidad M/DM (Lotes)</p>
              <div className="grid grid-cols-3 gap-1">
                {Object.entries(d.trazabilidad).map(([k, v]) => (
                  <div key={k} className="bg-[#F8FAFF] border border-border rounded p-1.5 text-center">
                    <p className="text-[8px] text-muted-foreground capitalize">{k === "nacl" ? "NaCl 0.9%" : k === "vitC" ? "Vit C" : k === "compB" ? "Comp B" : k === "pericraneal" ? "Pericran." : k}</p>
                    <p className="text-[9px] font-mono font-bold">{v as string || "—"}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {(record.tipo === "laser" || record.tipo === "paquete") && d.parametros?.length > 0 && (
        <div className="mb-4">
          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1"><Zap size={9}/> Parámetros ND:YAG — Láser</p>
          <table className="w-full text-[9px] border border-border rounded-lg overflow-hidden">
            <thead><tr className="bg-[#0C1A35] text-[#C8D6EF]">
              {["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases"].map(h => (
                <th key={h} className="px-1.5 py-1.5 text-left font-semibold">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {d.parametros.map((row: LaserRow, i: number) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"}>
                  {[row.fototipo,row.pieza,row.modo,row.frecuencia,row.fluencia,row.energia,row.area,row.pases].map((v, j) => (
                    <td key={j} className="px-1.5 py-1 border-t border-border font-mono">{v || "—"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-5 pt-5 border-t-2 border-dashed border-border">
        <p className="text-[9px] text-center text-muted-foreground mb-4 font-medium">
          El paciente declara haber LEÍDO, COMPRENDIDO y tomado su decisión de manera LIBRE y VOLUNTARIA sobre el procedimiento descrito.
        </p>
        <div className="flex justify-center mb-3">
          <div className="text-center w-56">
            {d.firmaConsentimiento ? (
              <img src={d.firmaConsentimiento} alt="firma" className="w-full h-20 object-contain border-2 border-[#1A56DB]/20 rounded-xl bg-[#f8faff] mb-2"/>
            ) : (
              <div className="w-full h-20 border-2 border-dashed border-muted-foreground/30 rounded-xl mb-2 flex items-center justify-center">
                <p className="text-[9px] text-muted-foreground">Firma pendiente</p>
              </div>
            )}
            <div className="border-t border-foreground/40 pt-2">
              <p className="text-[10px] font-bold">{pac?.nombre}</p>
              <p className="text-[9px] text-muted-foreground">{pac?.tipoDoc}: {pac?.documento}</p>
              <p className="text-[9px] text-muted-foreground">Firma del Paciente</p>
            </div>
          </div>
        </div>

        <div className={`mt-3 p-3 rounded-xl text-center text-xs font-bold border
          ${d.consentido === true  ? "bg-emerald-50 border-emerald-300 text-emerald-800"
          : d.consentido === false ? "bg-red-50 border-red-300 text-red-800"
          :                          "bg-muted text-muted-foreground border-border"}`}>
          {d.consentido === true  ? "✓ PACIENTE CONSINTIÓ — AUTORIZA LA REALIZACIÓN DEL PROCEDIMIENTO"
          : d.consentido === false ? "✗ PACIENTE DISENTIÓ — NO AUTORIZA LA REALIZACIÓN DEL PROCEDIMIENTO"
          :                          "Decisión no registrada"}
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
            <p className="text-[9px] text-muted-foreground">Responsable del Procedimiento</p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border text-center">
        <p className="text-[8px] text-muted-foreground">Documento digital certificado · {ips.nombre} · NIT {ips.nit} · {new Date().toLocaleDateString("es-CO", { day:"2-digit", month:"long", year:"numeric" })}</p>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={onSendWhatsApp}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] text-white text-sm font-semibold hover:bg-[#20ba5a] transition-colors">
          <MessageSquare size={16}/> WhatsApp
        </button>
        <button onClick={onSendEmail}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors">
          <Mail size={16}/> Email
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">
          <Printer size={14}/> Imprimir
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">
          <Download size={14}/> Descargar PDF
        </button>
      </div>
    </div>
  );
}

function PDFModal({ record, onClose, addToast }: {
  record: ConsentRecord; onClose: () => void;
  addToast: (t: "success"|"error"|"info", m: string) => void;
}) {
  const ips = useIPS();
  const handleWA = () => {
    const d = record.datos as any;
    const pac = d.paciente as DatosPaciente;
    const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac?.nombre},\n\nSu consentimiento fue registrado exitosamente.\n\n📋 Radicado: ${record.radicado}\n📅 Fecha: ${fmtFecha(record.fecha)}\n✅ Estado: ${record.estado}\n\n_${ips.nombre} · NIT ${ips.nit}_`);
    const tel = pac?.telefono.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/57${tel}?text=${msg}`, "_blank");
    addToast("info", "Abriendo WhatsApp...");
  };
  const handleEmail = () => { addToast("success", `Email enviado a ${record.pacienteNombre}`); };

  return (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-3">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[94vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-border rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileText size={16} className="text-[#1A56DB]"/>
            <div>
              <p className="font-bold text-sm">{record.radicado}</p>
              <div className="flex items-center gap-2"><StatusBadge estado={record.estado}/><TipoBadge tipo={record.tipo}/></div>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} className="text-muted-foreground"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">
          <PDFViewer record={record} onSendEmail={handleEmail} onSendWhatsApp={handleWA}/>
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
    <div className="flex-shrink-0 px-5 pt-5 pb-3">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#1A56DB]/10 flex items-center justify-center text-[#1A56DB]">{icon}</div>
        <div>
          <p className="font-bold text-sm">{titulo}</p>
          <p className="text-[10px] text-muted-foreground">Paso {current}/{steps.length}: {steps[current - 1]}</p>
        </div>
      </div>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${i < current ? "bg-[#1A56DB]" : "bg-border"}`}/>
        ))}
      </div>
    </div>
  );
}

function NavButtons({ step, total, onBack, onNext, onFinish, canNext = true, finishing = false }: {
  step: number; total: number; onBack: () => void; onNext: () => void; onFinish: () => void;
  canNext?: boolean; finishing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
      {step > 1 && (
        <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <ChevronLeft size={15}/> Anterior
        </button>
      )}
      <div className="flex-1"/>
      {step < total ? (
        <button onClick={onNext} disabled={!canNext}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#1648bf] transition-colors">
          Siguiente <ChevronRight size={15}/>
        </button>
      ) : (
        <button onClick={onFinish} disabled={!canNext || finishing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors">
          {finishing ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/> Guardando...</> : <><CheckCircle size={15}/> Guardar y Enviar</>}
        </button>
      )}
    </div>
  );
}

function FormWrapper({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-xl max-h-[96vh] flex flex-col">
        <div className="flex items-center justify-end px-5 pt-4 flex-shrink-0">
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X size={16} className="text-muted-foreground"/>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PDFWrapper({ onCancel, children, titulo }: { onCancel: () => void; children: React.ReactNode; titulo: string }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-3">
      <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[96vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-border rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-2"><CheckCircle size={16} className="text-emerald-600"/><p className="font-bold text-sm text-emerald-700">{titulo}</p></div>
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted"><X size={16} className="text-muted-foreground"/></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FORM ESCLEROTERAPIA
// ═══════════════════════════════════════════════════════════════════════════════
function FormEscleroterapia({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info", m: string) => void; nextId: number;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales — Enfermería", "Cuestionario Médico", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState<DatosVitales>({ ...VITALES_EMPTY });
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
        id: String(Date.now()), tipo: "escleroterapia", radicado: genRadicado("escleroterapia", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos: { paciente: pac, cuestionario: cuest, vitales, firmaConsentimiento: firma, consentido },
      };
      setRecord(r); onSave(r);
      addToast("success", `Consentimiento Escleroterapia firmado · Médico notificado`);
      setSaving(false); setStep(6);
    }, 900);
  };

  if (step === 6 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Consentimiento Guardado — Médico Notificado">
      <PDFViewer record={record} onSendEmail={() => addToast("success", `Email enviado a ${pac.nombre}`)} onSendWhatsApp={() => {
        const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac.nombre},\n\nSu consentimiento fue registrado.\n\n📋 Radicado: ${record.radicado}\n✅ Estado: FIRMADO\n\n_${ips.nombre}_`);
        window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${msg}`, "_blank");
        addToast("info", "Abriendo WhatsApp...");
      }}/>
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
function FormSueroterapia({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info", m: string) => void; nextId: number;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales + Prescripción", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState<DatosVitales>({ ...VITALES_EMPTY });
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
      <div className="flex items-center gap-2 p-2 bg-[#00B896]/10 border border-[#00B896]/30 rounded-xl">
        <Droplets size={14} className="text-[#00B896]"/>
        <p className="text-xs font-bold text-[#00B896]">Prescripción Médica — Sueroterapia</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3 cc"/>
        <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4 cc"/>
      </div>
      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Vía de Administración</label>
        <select value={viaPrescripcion} onChange={e => setViaPrescripcion(e.target.value)}
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
          <option>Intravenosa</option><option>Intramuscular</option><option>Subcutánea</option>
        </select>
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trazabilidad M/DM — Números de Lote</p>
        <div className="grid grid-cols-2 gap-2">
          {([["NaCl 0.9%","nacl"],["Vitamina C","vitC"],["Complejo B","compB"],["Jeringa 3ml","jeringa"],["Pericraneal","pericraneal"],["Macrogotero","macrogotero"]] as [string, keyof typeof traz][]).map(([label,key]) => (
            <div key={key}>
              <label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label>
              <input value={traz[key]} onChange={e => setTraz({...traz,[key]:e.target.value})} placeholder="No. lote"
                className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none focus:ring-1 focus:ring-[#1A56DB]/30 font-mono"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const r: ConsentRecord = {
        id: String(Date.now()), tipo: "sueroterapia", radicado: genRadicado("sueroterapia", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos: { paciente: pac, vitales, dosis_vitC, dosis_compB, viaPrescripcion, trazabilidad: traz, firmaConsentimiento: firma, consentido } as any,
      };
      setRecord(r); onSave(r);
      addToast("success", "Consentimiento Sueroterapia firmado · Médico notificado");
      setSaving(false); setStep(5);
    }, 900);
  };

  if (step === 5 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Consentimiento Guardado">
      <PDFViewer record={record} onSendEmail={() => addToast("success",`Email enviado a ${pac.nombre}`)} onSendWhatsApp={() => {
        const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac.nombre},\n\nSu consentimiento fue registrado.\n📋 Radicado: ${record.radicado}\n_${ips.nombre}_`);
        window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
        addToast("info","Abriendo WhatsApp...");
      }}/>
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
function FormLaser({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info", m: string) => void; nextId: number;
}) {
  const ips = useIPS();
  const STEPS = ["Datos del Paciente", "Vitales + Parámetros", "Leer Consentimiento", "Firma del Paciente"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState<DatosVitales>({ ...VITALES_EMPTY });
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
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-xl flex-1 mr-2">
          <Zap size={14} className="text-amber-600"/>
          <p className="text-xs font-bold text-amber-800">Parámetros ND:YAG — Técnico Láser</p>
        </div>
        <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1A56DB] text-white text-xs font-medium hover:bg-[#1648bf]">
          <Plus size={12}/> Fila
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[10px]">
          <thead><tr className="bg-[#0C1A35] text-[#C8D6EF]">
            {["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases",""].map(h => (
              <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {params.map((row, i) => (
              <tr key={i} className={i%2===0?"bg-white":"bg-[#F8FAFF]"}>
                {(["fototipo","pieza","modo","frecuencia","fluencia","energia","area","pases"] as (keyof LaserRow)[]).map(k => (
                  <td key={k} className="px-1 py-1">
                    <input value={row[k]} onChange={e => updRow(i,k,e.target.value)}
                      className="w-full min-w-[44px] border border-transparent focus:border-[#1A56DB]/40 rounded px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono"/>
                  </td>
                ))}
                <td className="px-1 py-1">
                  {params.length > 1 && <button onClick={() => setParams(p => p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={10}/></button>}
                </td>
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
        id: String(Date.now()), tipo: "laser", radicado: genRadicado("laser", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos: { paciente: pac, vitales, parametros: params, firmaConsentimiento: firma, consentido },
      };
      setRecord(r); onSave(r);
      addToast("success","Consentimiento Láser firmado · Médico notificado");
      setSaving(false); setStep(5);
    }, 900);
  };

  if (step === 5 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Consentimiento Guardado">
      <PDFViewer record={record} onSendEmail={() => addToast("success",`Email enviado a ${pac.nombre}`)} onSendWhatsApp={() => {
        const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac.nombre},\n📋 Radicado: ${record.radicado}\n_${ips.nombre}_`);
        window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${msg}`,"_blank");
        addToast("info","Abriendo WhatsApp...");
      }}/>
    </PDFWrapper>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} extraContent={ParamsExtra}/>;
    if (step === 3) return <StepLeerConsentimiento titulo="Terapia Láser ND:YAG Venas Várices" texto={makeTextoLaser(ips)} leido={leido} onLeido={setLeido}/>;
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
// FLUJO: 1-Datos → 2-Vitales+Cuestionario → 3-Prescripción Suero+Parámetros Láser
//        → 4-Leer Escleroterapia → 5-Leer Sueroterapia → 6-Leer Láser → 7-Firma → 8-PDF
// ═══════════════════════════════════════════════════════════════════════════════
function FormPaquete({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success"|"error"|"info", m: string) => void; nextId: number;
}) {
  const ips = useIPS();

  const STEPS = [
    "Datos del Paciente",
    "Vitales + Cuestionario",
    "Sueroterapia + Láser",
    "Leer · Escleroterapia",
    "Leer · Sueroterapia",
    "Leer · Láser ND:YAG",
    "Firma del Paciente",
  ];

  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ ...PACIENTE_EMPTY });
  const [vitales, setVitales] = useState<DatosVitales>({ ...VITALES_EMPTY });
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
  const addRow = () => setParams(p => [...p,{fototipo:"",pieza:"",modo:"",frecuencia:"",fluencia:"",energia:"",area:"",pases:""}]);

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
      const datos: DatosPaquete = {
        paciente: pac, vitales, cuestionario: cuest,
        dosis_vitC, dosis_compB, viaPrescripcion, trazabilidad: traz,
        parametros: params, firmaConsentimiento: firma, consentido,
      };
      const r: ConsentRecord = {
        id: String(Date.now()), tipo: "paquete", radicado: genRadicado("paquete", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos,
      };
      setRecord(r); onSave(r);
      addToast("success", `Paquete Completo firmado — 3 consentimientos · Médico notificado`);
      setSaving(false); setStep(8);
    }, 1200);
  };

  if (step === 8 && record) return (
    <PDFWrapper onCancel={onCancel} titulo="Paquete Completo Guardado — Médico Notificado">
      <PDFViewer record={record}
        onSendEmail={() => addToast("success", `Email enviado a ${pac.nombre}`)}
        onSendWhatsApp={() => {
          const msg = encodeURIComponent(`*${ips.nombre}* — Paquete Completo de Consentimientos\n\nEstimado/a ${pac.nombre},\n\nSus 3 consentimientos han sido registrados.\n\n📋 Radicado: ${record.radicado}\n📅 Fecha: ${fmtFecha(record.fecha)}\n✅ Estado: FIRMADO\n\n• Escleroterapia\n• Sueroterapia\n• Láser ND:YAG\n\n_${ips.nombre} · NIT ${ips.nit}_`);
          window.open(`https://wa.me/57${pac.telefono.replace(/\D/g,"")}?text=${msg}`, "_blank");
          addToast("info", "Abriendo WhatsApp...");
        }}
      />
    </PDFWrapper>
  );

  const SueroLaserExtra = (
    <div className="space-y-6">
      {/* Prescripción Sueroterapia */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 p-2.5 bg-[#00B896]/10 border border-[#00B896]/30 rounded-xl">
          <Droplets size={15} className="text-[#00B896]"/>
          <p className="text-xs font-bold text-[#00B896]">Prescripción Médica — Sueroterapia</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3 cc"/>
          <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4 cc"/>
        </div>
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Vía de Administración</label>
          <select value={viaPrescripcion} onChange={e => setViaPrescripcion(e.target.value)}
            className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
            <option>Intravenosa</option><option>Intramuscular</option><option>Subcutánea</option>
          </select>
        </div>
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trazabilidad — Números de Lote</p>
          <div className="grid grid-cols-2 gap-2">
            {([["NaCl 0.9%","nacl"],["Vitamina C","vitC"],["Complejo B","compB"],["Jeringa 3ml","jeringa"],["Pericraneal","pericraneal"],["Macrogotero","macrogotero"]] as [string, keyof typeof traz][]).map(([label,key]) => (
              <div key={key}>
                <label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label>
                <input value={traz[key]} onChange={e => setTraz({...traz,[key]:e.target.value})} placeholder="No. lote"
                  className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none focus:ring-1 focus:ring-[#1A56DB]/30 font-mono"/>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex-1 mr-2">
            <Zap size={15} className="text-amber-600"/>
            <p className="text-xs font-bold text-amber-800">Parámetros ND:YAG — Técnico Láser</p>
          </div>
          <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1A56DB] text-white text-xs font-medium hover:bg-[#1648bf]">
            <Plus size={12}/> Fila
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-[10px]">
            <thead><tr className="bg-[#0C1A35] text-[#C8D6EF]">
              {["Fototipo","Pieza","Modo","Hz","J/cm²","mJ","cm²","Pases",""].map(h => (
                <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {params.map((row, i) => (
                <tr key={i} className={i%2===0?"bg-white":"bg-[#F8FAFF]"}>
                  {(["fototipo","pieza","modo","frecuencia","fluencia","energia","area","pases"] as (keyof LaserRow)[]).map(k => (
                    <td key={k} className="px-1 py-1">
                      <input value={row[k]} onChange={e => updRow(i,k,e.target.value)}
                        className="w-full min-w-[44px] border border-transparent focus:border-[#1A56DB]/40 rounded px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono"/>
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    {params.length > 1 && <button onClick={() => setParams(p => p.filter((_,idx)=>idx!==i))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={10}/></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const content = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac}/>;
    if (step === 2) return (
      <div className="space-y-6">
        <StepVitalesEnfermera data={vitales} onChange={setVitales}/>
        <div className="border-t border-border pt-5">
          <div className="flex items-center gap-2 p-2.5 bg-[#1A56DB]/8 border border-[#1A56DB]/20 rounded-xl mb-4">
            <Syringe size={14} className="text-[#1A56DB]"/>
            <p className="text-xs font-bold text-[#1A56DB]">Cuestionario — Escleroterapia</p>
          </div>
          <StepCuestionario data={cuest} onChange={setCuest}/>
        </div>
      </div>
    );
    if (step === 3) return SueroLaserExtra;
    if (step === 4) return (
      <div>
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#1A56DB]/8 rounded-lg">
          <Syringe size={14} className="text-[#1A56DB]"/><p className="text-xs font-bold text-[#1A56DB]">1 de 3 — Escleroterapia</p>
        </div>
        <StepLeerConsentimiento titulo="Escleroterapia de Várices" texto={makeTextoEscleroterapia(ips)} leido={leido1} onLeido={setLeido1}/>
      </div>
    );
    if (step === 5) return (
      <div>
        <div className="flex items-center gap-2 mb-3 p-2 bg-[#00B896]/10 rounded-lg">
          <Droplets size={14} className="text-[#00B896]"/><p className="text-xs font-bold text-[#00B896]">2 de 3 — Sueroterapia</p>
        </div>
        <StepLeerConsentimiento titulo="Sueroterapia Vitamina C / Complejo B" texto={makeTextoSueroterapia(ips)} leido={leido2} onLeido={setLeido2}/>
      </div>
    );
    if (step === 6) return (
      <div>
        <div className="flex items-center gap-2 mb-3 p-2 bg-amber-50 rounded-lg">
          <Zap size={14} className="text-amber-600"/><p className="text-xs font-bold text-amber-700">3 de 3 — Láser ND:YAG</p>
        </div>
        <StepLeerConsentimiento titulo="Terapia Láser ND:YAG Venas Várices" texto={makeTextoLaser(ips)} leido={leido3} onLeido={setLeido3}/>
      </div>
    );
    if (step === 7) return (
      <div className="space-y-4">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
          <p className="text-xs font-bold text-purple-800 flex items-center gap-2"><Package size={14}/> Firma única para los 3 consentimientos</p>
          <p className="text-[10px] text-purple-700 mt-1">Al firmar, el paciente autoriza (o deniega) los procedimientos de Escleroterapia, Sueroterapia y Láser ND:YAG en una única sesión.</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[{c:"bg-[#1A56DB]/10 text-[#1A56DB] border-[#1A56DB]/30",icon:<Syringe size={12}/>,l:"Escler.",ok:leido1},
            {c:"bg-[#00B896]/10 text-[#00B896] border-[#00B896]/30",icon:<Droplets size={12}/>,l:"Suero.",ok:leido2},
            {c:"bg-amber-100 text-amber-700 border-amber-300",icon:<Zap size={12}/>,l:"Láser",ok:leido3}
          ].map(({c,icon,l,ok}) => (
            <div key={l} className={`flex items-center gap-1.5 p-2 rounded-lg border text-[10px] font-semibold ${c}`}>
              {icon}{l}{ok && <Check size={10} className="ml-auto"/>}
            </div>
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
// IPS SETTINGS MODAL — Solo ADMINISTRADOR
// ═══════════════════════════════════════════════════════════════════════════════
function IPSSettingsModal({ ips, onSave, onClose }: {
  ips: IPSConfig; onSave: (c: IPSConfig) => void; onClose: () => void;
}) {
  const [form, setForm] = useState<IPSConfig>({ ...ips });
  const s = (k: keyof IPSConfig) => (v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center"><Settings size={15} className="text-[#1A56DB]"/></div>
            <div>
              <p className="font-bold text-sm">Configuración IPS</p>
              <p className="text-[10px] text-muted-foreground">Constantes del sistema — solo Administrador</p>
            </div>
          </div>
          <button onClick={onClose}><X size={18} className="text-muted-foreground"/></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-[10px] text-amber-800 font-semibold flex items-center gap-1.5">
              <AlertTriangle size={11}/> Estos valores aparecen en todos los consentimientos y documentos PDF
            </p>
          </div>
          <Field label="Nombre de la IPS" value={form.nombre} onChange={s("nombre")} placeholder="Nombre de la clínica" required/>
          <Field label="NIT" value={form.nit} onChange={s("nit")} placeholder="000000000" icon={<FileText size={13}/>} required/>
          <Field label="Médico Responsable" value={form.medico} onChange={s("medico")} placeholder="Dr. Nombre Apellido" icon={<Stethoscope size={13}/>} required/>
          <Field label="Registro Médico (RM)" value={form.rm} onChange={s("rm")} placeholder="RM 0000000"/>
          <Field label="Ciudad / Sede" value={form.ciudad} onChange={s("ciudad")} placeholder="Ciudad, País" icon={<MapPin size={13}/>}/>

          <div className="p-3 bg-[#EEF2F8] rounded-xl text-[10px] text-muted-foreground space-y-0.5">
            <p className="font-bold text-foreground text-xs mb-1">Vista previa del encabezado:</p>
            <p className="font-bold text-[#1A56DB]">{form.nombre || "Nombre IPS"}</p>
            <p>NIT {form.nit || "000000000"}</p>
            <p>{form.medico || "Médico"} · {form.rm || "RM"}</p>
            <p className="text-[9px]">{form.ciudad || "Ciudad"}</p>
          </div>
        </div>
        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted">Cancelar</button>
          <button onClick={() => { onSave(form); onClose(); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold hover:bg-[#1648bf] transition-colors">
            <Save size={14}/> Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const ips = useIPS();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    setTimeout(() => {
      const user = USUARIOS.find(u => u.email === email && u.password === password);
      if (user) onLogin(user);
      else setError("Credenciales incorrectas. Verifique su email y contraseña.");
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0C1A35] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A56DB] mb-4">
            <Stethoscope size={30} className="text-white"/>
          </div>
          <h1 className="text-2xl font-black text-white">{ips.nombre}</h1>
          <p className="text-[#C8D6EF] text-sm mt-1">Sistema de Consentimientos Informados</p>
          <p className="text-[#8899BB] text-[10px] mt-0.5 font-mono">NIT {ips.nit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold mb-5">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="usuario@medfis.com" required/>
            <Field label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="••••••••" required/>
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                <XCircle size={14}/> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm disabled:opacity-60 hover:bg-[#1648bf] transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Verificando...</> : "Ingresar"}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Accesos de prueba:</p>
            {USUARIOS.map(u => (
              <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); }}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors mb-1">
                <p className="text-[10px] font-semibold">{u.nombre} <span className="text-muted-foreground font-normal">— {u.rol}</span></p>
                <p className="text-[10px] text-muted-foreground font-mono">{u.email} · {u.password}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, onPage, user, onLogout, records, mobileOpen, onClose, onSettings }: {
  page: AppPage; onPage: (p: AppPage) => void; user: Usuario; onLogout: () => void;
  records: ConsentRecord[]; mobileOpen: boolean; onClose: () => void; onSettings: () => void;
}) {
  const ips = useIPS();
  const pendientes = records.filter(r => r.pendienteMedico).length;
  const nav = [
    { id: "dashboard" as AppPage, label: "Dashboard",           icon: <LayoutDashboard size={17}/> },
    { id: "historial" as AppPage, label: "Historial",           icon: <ClipboardList size={17}/> },
    { id: "form"      as AppPage, label: "Nuevo Consentimiento",icon: <Plus size={17}/> },
  ];
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose}/>}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#0C1A35] z-50 flex flex-col transition-transform duration-300 ${mobileOpen?"translate-x-0":"-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A56DB] flex items-center justify-center"><Stethoscope size={18} className="text-white"/></div>
            <div><p className="font-black text-white text-sm">{ips.nombre}</p><p className="text-[10px] text-[#8899BB] font-mono">NIT {ips.nit}</p></div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => { onPage(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative
                ${page===item.id?"bg-[#1A56DB] text-white":"text-[#C8D6EF] hover:bg-white/8"}`}>
              {item.icon} {item.label}
              {item.id==="dashboard" && pendientes > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{pendientes}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="px-3 pb-5 border-t border-white/8 pt-4 space-y-1">
          {user.rol === "ADMINISTRADOR" && (
            <button onClick={onSettings}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C8D6EF] hover:bg-white/8 text-sm font-medium transition-colors">
              <Settings size={15}/> Configuración IPS
            </button>
          )}
          <div className="px-3 py-2">
            <p className="text-[10px] text-white font-semibold truncate">{user.nombre}</p>
            <p className="text-[10px] text-[#8899BB]">{user.rol}</p>
          </div>
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C8D6EF] hover:bg-white/8 text-sm font-medium transition-colors">
            <LogOut size={15}/> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardPage({ records, onNewForm, user, onViewRecord, onMarkReviewed, addToast }: {
  records: ConsentRecord[]; onNewForm: (t: TipoConsent) => void; user: Usuario;
  onViewRecord: (r: ConsentRecord) => void; onMarkReviewed: (id: string) => void;
  addToast: (t: "success"|"error"|"info", m: string) => void;
}) {
  const firmados      = records.filter(r => r.estado === "FIRMADO").length;
  const pendientesMed = records.filter(r => r.pendienteMedico);
  const hoyCount      = records.filter(r => r.fecha === hoy()).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bienvenido/a, {user.nombre} · {user.rol}</p>
      </div>

      {pendientesMed.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-amber-600"/>
            <p className="text-sm font-bold text-amber-800">Firmas pendientes de revisión médica</p>
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-2.5 py-0.5 animate-pulse">{pendientesMed.length}</span>
          </div>
          <div className="space-y-2">
            {pendientesMed.slice(0,5).map(r => {
              const d = r.datos as any;
              const pac = d.paciente as DatosPaciente;
              return (
                <div key={r.id} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-amber-200 hover:border-amber-400 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    {r.tipo==="escleroterapia"?<Syringe size={14} className="text-amber-700"/>:r.tipo==="sueroterapia"?<Droplets size={14} className="text-amber-700"/>:r.tipo==="laser"?<Zap size={14} className="text-amber-700"/>:<Package size={14} className="text-amber-700"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold truncate">{r.pacienteNombre}</p>
                    <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                    {pac?.telefono && <p className="text-[10px] text-muted-foreground">Tel: {pac.telefono}</p>}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <TipoBadge tipo={r.tipo}/>
                    <button onClick={() => onViewRecord(r)} className="p-1.5 rounded-lg bg-[#1A56DB]/10 text-[#1A56DB] hover:bg-[#1A56DB]/20 transition-colors"><Eye size={13}/></button>
                    {(user.rol==="MÉDICO"||user.rol==="ADMINISTRADOR") && (
                      <button onClick={() => { onMarkReviewed(r.id); addToast("success",`Firma de ${r.pacienteNombre} marcada como revisada`); }}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold hover:bg-emerald-200 transition-colors">
                        <Check size={10}/> Revisado
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {pendientesMed.length > 5 && <p className="text-[10px] text-amber-700 text-center font-medium">+{pendientesMed.length-5} más en el Historial</p>}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label:"Total",             value: records.length,       icon:<FileText size={18}/>,   color:"text-[#1A56DB]", bg:"bg-[#1A56DB]/10" },
          { label:"Firmados",          value: firmados,             icon:<CheckCircle size={18}/>, color:"text-emerald-600",bg:"bg-emerald-50"    },
          { label:"Hoy",               value: hoyCount,             icon:<Clock size={18}/>,       color:"text-amber-600", bg:"bg-amber-50"       },
          { label:"Pendientes Médico", value: pendientesMed.length, icon:<Bell size={18}/>,        color:"text-red-600",   bg:"bg-red-50"         },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-black">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Crear Nuevo Consentimiento</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { tipo:"escleroterapia" as TipoConsent, label:"Escleroterapia", sub:"Inyección de Várices",    icon:<Syringe size={24}/>,  color:"bg-[#1A56DB]", light:"bg-[#1A56DB]/8 hover:bg-[#1A56DB]/12 border-[#1A56DB]/20" },
            { tipo:"sueroterapia"   as TipoConsent, label:"Sueroterapia",   sub:"Vit C / Complejo B IV",   icon:<Droplets size={24}/>, color:"bg-[#00B896]", light:"bg-[#00B896]/8 hover:bg-[#00B896]/12 border-[#00B896]/20" },
            { tipo:"laser"          as TipoConsent, label:"Láser Várices",  sub:"Terapia ND:YAG",          icon:<Zap size={24}/>,      color:"bg-amber-500", light:"bg-amber-50 hover:bg-amber-100 border-amber-200"           },
            { tipo:"paquete"        as TipoConsent, label:"Paquete",        sub:"Los 3 consentimientos",   icon:<Package size={24}/>,  color:"bg-purple-600",light:"bg-purple-50 hover:bg-purple-100 border-purple-200"         },
          ]).map(item => (
            <button key={item.tipo} onClick={() => onNewForm(item.tipo)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all hover:scale-[1.02] active:scale-95 ${item.light}`}>
              <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm`}>{item.icon}</div>
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {records.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">Últimos Consentimientos</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {records.slice(-6).reverse().map((r, i, arr) => (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors ${i<arr.length-1?"border-b border-border":""} ${r.pendienteMedico?"border-l-4 border-l-amber-400":""}`}
                onClick={() => onViewRecord(r)}>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  {r.tipo==="escleroterapia"?<Syringe size={14} className="text-[#1A56DB]"/>:r.tipo==="sueroterapia"?<Droplets size={14} className="text-[#00B896]"/>:r.tipo==="laser"?<Zap size={14} className="text-amber-600"/>:<Package size={14} className="text-purple-600"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{r.pacienteNombre}</p>
                  <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.pendienteMedico && <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"/>}
                  <StatusBadge estado={r.estado}/>
                  <Eye size={13} className="text-muted-foreground"/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {records.length >= 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Tendencia Mensual</p>
            <ResponsiveContainer width="100%" height={150}>
              <AreaChart data={CHART_MENSUAL}>
                <defs>
                  <linearGradient id="gE" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15}/><stop offset="95%" stopColor="#1A56DB" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F4"/>
                <XAxis dataKey="mes" tick={{ fontSize:10 }}/><YAxis tick={{ fontSize:10 }}/>
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }}/>
                <Area type="monotone" dataKey="escler" stroke="#1A56DB" fill="url(#gE)" strokeWidth={2} name="Escleroterapia"/>
                <Area type="monotone" dataKey="suero"  stroke="#00B896" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Sueroterapia"/>
                <Area type="monotone" dataKey="laser"  stroke="#F59E0B" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Láser"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-4">Distribución por Tipo</p>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={CHART_TIPOS} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={3} dataKey="value">
                  {CHART_TIPOS.map(entry => <Cell key={`cell-${entry.name}`} fill={entry.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ fontSize:11, borderRadius:8 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-1">
              {CHART_TIPOS.map(t => (
                <div key={t.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: t.color }}/>
                  <span className="text-[10px] text-muted-foreground">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HISTORIAL ────────────────────────────────────────────────────────────────
function HistorialPage({ records, onView, onDelete, onMarkReviewed, addToast, user }: {
  records: ConsentRecord[]; onView: (r: ConsentRecord) => void;
  onDelete: (id: string) => void; onMarkReviewed: (id: string) => void;
  addToast: (t: "success"|"error"|"info", m: string) => void; user: Usuario;
}) {
  const ips = useIPS();
  const [q, setQ]         = useState("");
  const [fTipo, setFTipo] = useState<"todos"|TipoConsent>("todos");
  const [fEst, setFEst]   = useState<"todos"|EstadoConsent>("todos");

  const filtered = records.filter(r => {
    const matchQ = q==="" || r.pacienteNombre.toLowerCase().includes(q.toLowerCase()) || r.radicado.toLowerCase().includes(q.toLowerCase()) || r.pacienteDoc.includes(q);
    return matchQ && (fTipo==="todos"||r.tipo===fTipo) && (fEst==="todos"||r.estado===fEst);
  }).reverse();

  const handleWA = (r: ConsentRecord) => {
    const d = r.datos as any;
    const pac = d.paciente as DatosPaciente;
    const msg = encodeURIComponent(`*${ips.nombre}* — Consentimiento Informado\n\nEstimado/a ${pac?.nombre},\n\nSu consentimiento ha sido procesado.\n\n📋 Radicado: ${r.radicado}\n📅 Fecha: ${fmtFecha(r.fecha)}\n✅ Estado: ${r.estado}\n\n_${ips.nombre} · NIT ${ips.nit}_`);
    const tel = (pac?.telefono||"").replace(/[^0-9]/g,"");
    window.open(`https://wa.me/57${tel}?text=${msg}`,"_blank");
    addToast("info",`Abriendo WhatsApp para ${r.pacienteNombre}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Historial</h1><p className="text-sm text-muted-foreground">{filtered.length} registros encontrados</p></div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, radicado o cédula..."
            className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30"/>
        </div>
        <select value={fTipo} onChange={e => setFTipo(e.target.value as any)}
          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none">
          <option value="todos">Todos los tipos</option>
          <option value="escleroterapia">Escleroterapia</option>
          <option value="sueroterapia">Sueroterapia</option>
          <option value="laser">Láser Várices</option>
          <option value="paquete">Paquete</option>
        </select>
        <select value={fEst} onChange={e => setFEst(e.target.value as any)}
          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none">
          <option value="todos">Todos los estados</option>
          <option value="FIRMADO">Firmado</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ANULADO">Anulado</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={36} className="mx-auto mb-3 opacity-30"/>
          <p className="font-semibold">Sin registros</p>
          <p className="text-sm">No se encontraron consentimientos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => {
            const d = r.datos as any;
            const pac = d.paciente as DatosPaciente;
            return (
              <div key={r.id} className={`bg-card rounded-2xl border border-border p-4 hover:border-[#1A56DB]/30 transition-colors ${r.pendienteMedico?"border-l-4 border-l-amber-400":""}`}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                    {r.tipo==="escleroterapia"?<Syringe size={16} className="text-[#1A56DB]"/>:r.tipo==="sueroterapia"?<Droplets size={16} className="text-[#00B896]"/>:r.tipo==="laser"?<Zap size={16} className="text-amber-600"/>:<Package size={16} className="text-purple-600"/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-sm">{r.pacienteNombre}</p>
                      {r.pendienteMedico && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">PENDIENTE MÉDICO</span>}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono">{r.radicado} · {fmtFecha(r.fecha)}</p>
                    {pac?.telefono && <p className="text-[10px] text-muted-foreground">Tel: {pac.telefono}</p>}
                    {pac?.email    && <p className="text-[10px] text-muted-foreground">{pac.email}</p>}
                    <div className="flex items-center gap-2 mt-1.5"><StatusBadge estado={r.estado}/><TipoBadge tipo={r.tipo}/></div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    <button onClick={() => onView(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A56DB] text-white text-[10px] font-semibold hover:bg-[#1648bf] transition-colors">
                      <Eye size={11}/> Ver PDF
                    </button>
                    <button onClick={() => handleWA(r)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-[10px] font-semibold hover:bg-[#20ba5a] transition-colors">
                      <MessageSquare size={11}/> WhatsApp
                    </button>
                    {r.pendienteMedico && (user.rol==="MÉDICO"||user.rol==="ADMINISTRADOR") && (
                      <button onClick={() => { onMarkReviewed(r.id); addToast("success","Firma revisada"); }}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-bold hover:bg-emerald-200 transition-colors">
                        <Check size={11}/> Revisado
                      </button>
                    )}
                    {(user.rol==="ADMINISTRADOR"||user.rol==="MÉDICO") && (
                      <button onClick={() => onDelete(r.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors self-end">
                        <Trash2 size={13}/>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TIPO SELECTOR ────────────────────────────────────────────────────────────
function TipoSelectorPage({ onSelect }: { onSelect: (t: TipoConsent) => void }) {
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-bold">Nuevo Consentimiento</h1><p className="text-sm text-muted-foreground">Seleccione el tipo de procedimiento</p></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {([
          { tipo:"escleroterapia" as TipoConsent, label:"Escleroterapia",  sub:"Inyección de Várices Miembros Inferiores",icon:<Syringe size={28}/>,  color:"border-[#1A56DB] bg-[#1A56DB]/5", iconBg:"bg-[#1A56DB]" },
          { tipo:"sueroterapia"   as TipoConsent, label:"Sueroterapia",    sub:"Vitamina C y/o Complejo B IV/IM",         icon:<Droplets size={28}/>, color:"border-[#00B896] bg-[#00B896]/5", iconBg:"bg-[#00B896]" },
          { tipo:"laser"          as TipoConsent, label:"Láser Várices",   sub:"Terapia ND:YAG Control Venas",            icon:<Zap size={28}/>,      color:"border-amber-400 bg-amber-50",    iconBg:"bg-amber-500"  },
          { tipo:"paquete"        as TipoConsent, label:"Paquete Completo",sub:"Los 3 consentimientos en una sesión",     icon:<Package size={28}/>,  color:"border-purple-400 bg-purple-50",  iconBg:"bg-purple-600" },
        ]).map(o => (
          <button key={o.tipo} onClick={() => onSelect(o.tipo)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${o.color}`}>
            <div className={`w-14 h-14 rounded-2xl ${o.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>{o.icon}</div>
            <div className="flex-1">
              <p className="font-bold text-base">{o.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{o.sub}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground"/>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// APP ROOT
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [ips, setIps] = useState<IPSConfig>(() => {
    try {
      const saved = localStorage.getItem("medfis_ips_config");
      return saved ? JSON.parse(saved) : DEFAULT_IPS;
    } catch { return DEFAULT_IPS; }
  });

  const saveIPS = (config: IPSConfig) => {
    setIps(config);
    localStorage.setItem("medfis_ips_config", JSON.stringify(config));
    addToast("success", "Configuración IPS guardada correctamente");
  };

  const [user,        setUser]        = useState<Usuario | null>(null);
  const [page,        setPage]        = useState<AppPage>("dashboard");
  const [records,     setRecords]     = useState<ConsentRecord[]>([]);
  const [activeForm,  setActiveForm]  = useState<TipoConsent | null>(null);
  const [viewRecord,  setViewRecord]  = useState<ConsentRecord | null>(null);
  const [toasts,      setToasts]      = useState<ToastMsg[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSettings,setShowSettings]= useState(false);
  const nextIdRef = useRef(1);

  const addToast = (type: "success"|"error"|"info", msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4500);
  };

  const handleSave = (r: ConsentRecord) => {
    setRecords(prev => [...prev, r]);
    nextIdRef.current += 1;
    setActiveForm(null);
    setPage("historial");
  };

  const handleDelete       = (id: string) => { setRecords(prev => prev.map(r => r.id===id ? {...r, estado:"ANULADO" as EstadoConsent, pendienteMedico:false} : r)); addToast("info","Consentimiento anulado"); };
  const handleMarkReviewed = (id: string) => { setRecords(prev => prev.map(r => r.id===id ? {...r, pendienteMedico:false} : r)); };

  if (!user) return (
    <IPSContext.Provider value={ips}>
      <LoginPage onLogin={u => { setUser(u); addToast("success",`Bienvenido/a, ${u.nombre}`); }}/>
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id!==id))}/>
    </IPSContext.Provider>
  );

  return (
    <IPSContext.Provider value={ips}>
      <div className="min-h-screen bg-background flex">
        <Sidebar page={page} onPage={setPage} user={user}
          onLogout={() => { setUser(null); setPage("dashboard"); setRecords([]); addToast("info","Sesión cerrada"); }}
          records={records} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
          onSettings={() => setShowSettings(true)}/>

        <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">
          <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted"><Menu size={18}/></button>
            <p className="font-bold text-sm">{ips.nombre}</p>
            <div className="flex items-center gap-2">
              {records.filter(r=>r.pendienteMedico).length > 0 && (
                <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                  {records.filter(r=>r.pendienteMedico).length}
                </span>
              )}
              <div className="w-7 h-7 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xs font-bold">
                {user.nombre.charAt(0)}
              </div>
            </div>
          </div>

          <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
            {page==="dashboard" && (
              <DashboardPage records={records} onNewForm={t => { setActiveForm(t); setPage("form"); }}
                user={user} onViewRecord={setViewRecord} onMarkReviewed={handleMarkReviewed} addToast={addToast}/>
            )}
            {page==="form" && !activeForm && <TipoSelectorPage onSelect={t => setActiveForm(t)}/>}
            {page==="historial" && (
              <HistorialPage records={records} onView={setViewRecord} onDelete={handleDelete}
                onMarkReviewed={handleMarkReviewed} addToast={addToast} user={user}/>
            )}
          </main>
        </div>

        {/* Formularios */}
        {activeForm==="escleroterapia" && <FormEscleroterapia onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current}/>}
        {activeForm==="sueroterapia"   && <FormSueroterapia   onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current}/>}
        {activeForm==="laser"          && <FormLaser           onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current}/>}
        {activeForm==="paquete"        && <FormPaquete         onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current}/>}

        {/* PDF Modal */}
        {viewRecord && <PDFModal record={viewRecord} onClose={() => setViewRecord(null)} addToast={addToast}/>}

        {/* Settings Modal */}
        {showSettings && <IPSSettingsModal ips={ips} onSave={saveIPS} onClose={() => setShowSettings(false)}/>}

        <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id!==id))}/>
      </div>
    </IPSContext.Provider>
  );
}
