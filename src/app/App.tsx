import { useState, useRef, useEffect } from "react";
import {
  FileText, LogOut, Plus, Search, Eye, Trash2, Download,
  Send, CheckCircle, Clock, XCircle, Mail, MessageSquare,
  Pen, ChevronRight, ChevronLeft, Bell, Menu, X,
  Shield, Users, LayoutDashboard,
  Check, Phone, Stethoscope,
  Package, Syringe, Zap, Droplets, BarChart3,
  Printer, ThumbsUp, ThumbsDown, ClipboardList,
  BookOpen, Activity, MapPin, AtSign, UserCheck,
  AlertTriangle, Info
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

// ─── CONSTANTES IPS ──────────────────────────────────────────────────────────
const IPS = {
  nombre: "Med&Fis",
  nit: "901102930",
  medico: "Dr. Rafael Eduardo Marrero Padilla",
  rm: "RM 3880525",
  ciudad: "Colombia",
};

// ─── TIPOS ───────────────────────────────────────────────────────────────────
type AppPage = "login" | "dashboard" | "form" | "historial";
type TipoConsent = "escleroterapia" | "sueroterapia" | "laser" | "paquete";
type EstadoConsent = "FIRMADO" | "PENDIENTE" | "ANULADO";

interface Usuario { id: string; nombre: string; email: string; rol: string; password: string; }

interface DatosPaciente {
  nombre: string;
  documento: string;
  tipoDoc: string;
  telefono: string;
  email: string;
  direccion: string;
  fechaNacimiento: string;
  fecha: string;
}

interface DatosVitales {
  oximetria: string;
  tension: string;
  peso: string;
  talla: string;
  frecuenciaCardiaca: string;
  temperatura: string;
}

interface DatosEscleroterapia {
  paciente: DatosPaciente;
  cuestionario: Record<string, "Si" | "No" | "">;
  vitales: DatosVitales;
  firmaConsentimiento: string;
  firmaMedico: string;
  consentido: boolean | null;
  observacionesEnfermera: string;
}

interface DatosSueroterapia {
  paciente: DatosPaciente;
  vitales: DatosVitales;
  dosis_vitC: string;
  dosis_compB: string;
  trazabilidad: {
    nacl: string; vitC: string; compB: string;
    jeringa: string; pericraneal: string; macrogotero: string;
  };
  firmaConsentimiento: string;
  firmaResponsable: string;
  consentido: boolean | null;
  observacionesEnfermera: string;
}

interface LaserRow {
  fototipo: string; pieza: string; modo: string;
  frecuencia: string; fluencia: string; energia: string;
  area: string; pases: string;
}

interface DatosLaser {
  paciente: DatosPaciente;
  vitales: DatosVitales;
  parametros: LaserRow[];
  firmaConsentimiento: string;
  firmaMedico: string;
  consentido: boolean | null;
  observacionesEnfermera: string;
}

interface ConsentRecord {
  id: string;
  tipo: TipoConsent;
  radicado: string;
  fecha: string;
  pacienteNombre: string;
  pacienteDoc: string;
  pacienteTel: string;
  estado: EstadoConsent;
  enviado_email: boolean;
  enviado_whatsapp: boolean;
  pendienteMedico: boolean;
  datos: DatosEscleroterapia | DatosSueroterapia | DatosLaser | ConsentRecord[];
}

// ─── USUARIOS MOCK ────────────────────────────────────────────────────────────
const USUARIOS: Usuario[] = [
  { id: "1", nombre: "Dr. Rafael Eduardo Marrero Padilla", email: "rafael.marrero@medfis.com", rol: "MÉDICO", password: "medico123" },
  { id: "2", nombre: "Administrador Med&Fis", email: "admin@medfis.com", rol: "ADMINISTRADOR", password: "admin123" },
  { id: "3", nombre: "Auxiliar Recepción", email: "auxiliar@medfis.com", rol: "AUXILIAR", password: "auxiliar123" },
];

// ─── CUESTIONARIO ESCLEROTERAPIA ──────────────────────────────────────────────
const CUESTIONARIO_PREGUNTAS = [
  "¿Enfermedad como diabetes, Presión arterial, Lupus, artritis Reumatoide, Cáncer actualmente?",
  "¿Cansancio en piernas?",
  "¿Visibilidad de venas varices?",
  "Alergias a Medicamentos Y/o Alimentos.",
  "¿Alguna Vez se ha tratado venas varices con infiltración?",
  "¿Antecedentes de cirugía Vascular?",
  "¿Antecedentes patológicos cardiovasculares o cerebrales?",
  "Si está en edad reproductiva: ¿Embarazo o sospecha del mismo o lactancia Materna?",
  "¿Realiza ejercicio?",
  "¿Consumo de grasa o ultra procesados con frecuencia?",
  "¿Condiciones como Ansiedad o Depresión?",
  "¿Permanece mucho tiempo de pie o sentada?",
  "¿Uso de medias de compresión alguna Vez?",
];

// ─── TEXTOS LEGALES DE CONSENTIMIENTO ────────────────────────────────────────
const TEXTO_ESCLEROTERAPIA = `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES, en las instalaciones de la IPS ${IPS.nombre} (NIT ${IPS.nit}), bajo la responsabilidad del ${IPS.medico} (${IPS.rm}).

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

El paciente declara que ha recibido suficiente información sobre el procedimiento y que ha tenido la oportunidad de realizar preguntas, las cuales han sido respondidas de manera satisfactoria por el médico tratante.`;

const TEXTO_SUEROTERAPIA = `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de SUEROTERAPIA DE VITAMINA C Y/O COMPLEJO B (Administración intravenosa o intramuscular de vitaminas y micronutrientes), en las instalaciones de la IPS ${IPS.nombre} (NIT ${IPS.nit}), bajo la responsabilidad del ${IPS.medico} (${IPS.rm}).

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
• Cálculos renales (urolitiasis por oxalato) — dosis altas de Vitamina C.
• Déficit de G6PD — hemólisis con dosis altas de Vitamina C.
• Hipercoagulabilidad — evaluar individualmente.

El paciente declara que ha sido informado de manera clara y comprensible sobre el procedimiento, sus beneficios, riesgos y alternativas. Ha tenido la oportunidad de formular preguntas que han sido respondidas satisfactoriamente. Autoriza la realización del procedimiento de manera libre, voluntaria y sin coacción alguna.`;

const TEXTO_LASER = `Yo, el (la) paciente abajo firmante, por medio del presente documento doy mi consentimiento para que se lleve a cabo el procedimiento de TERAPIA LÁSER ND:YAG PARA EL CONTROL DE VENAS VÁRICES, en las instalaciones de la IPS ${IPS.nombre} (NIT ${IPS.nit}), bajo la responsabilidad del ${IPS.medico} (${IPS.rm}).

INFORMACIÓN DEL PROCEDIMIENTO:
La terapia láser con equipo Nd:YAG (Neodimio:Itrio-Aluminio-Granate, longitud de onda 1064 nm) es un tratamiento no invasivo o mínimamente invasivo utilizado para el tratamiento de venas varicosas y telangiectasias de los miembros inferiores. El láser emite energía que es absorbida selectivamente por la hemoglobina del interior del vaso, generando calor que colapsa y cierra la vena sin dañar el tejido circundante.

PARÁMETROS DEL EQUIPO:
El médico tratante definirá los parámetros específicos de energía (Fluencia en J/cm²), frecuencia de pulso (Hz), y área de tratamiento según el fototipo de piel del paciente y el tipo de vena a tratar.

FOTOTIPOS DE PIEL (Clasificación de Fitzpatrick):
• Fototipo I-II: Piel muy clara, alta sensibilidad — parámetros menores.
• Fototipo III-IV: Piel morena, parámetros intermedios.
• Fototipo V-VI: Piel oscura, requiere mayor precaución y ajuste de parámetros.

BENEFICIOS ESPERADOS:
• Reducción o eliminación de las venas tratadas.
• Procedimiento sin incisiones, con mínimo tiempo de recuperación.
• Mejora estética y funcional de los miembros inferiores.

RIESGOS Y POSIBLES EFECTOS SECUNDARIOS:
• Eritema (enrojecimiento) temporal en el área tratada.
• Edema (inflamación) leve postratamiento.
• Cambios pigmentarios temporales (hiperpigmentación o hipopigmentación).
• Costras o ampollas superficiales (raras, asociadas a energías altas).
• Dolor durante el procedimiento (sensación de calor intenso puntual).
• Resultado incompleto que requiera sesiones adicionales.

INSTRUCCIONES POST-TRATAMIENTO:
• Aplicar compresas frías si hay sensación de calor excesivo.
• Evitar exposición solar directa por 30 días. Usar protector solar FPS 50+.
• No aplicar calor local (saunas, baños calientes) por 72 horas.
• Usar medias de compresión según indicación médica.
• Reportar inmediatamente cualquier ampolla, úlcera o reacción inusual.

El paciente declara haber leído y comprendido este documento en su totalidad y autoriza voluntariamente la realización del procedimiento descrito.`;

// ─── CHART DATA ───────────────────────────────────────────────────────────────
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
  { name: "Sueroterapia", value: 29, color: "#00B896" },
  { name: "Láser Várices", value: 25, color: "#F59E0B" },
];

// ─── UTILS ────────────────────────────────────────────────────────────────────
function genRadicado(tipo: TipoConsent, n: number) {
  const prefix = { escleroterapia: "ESC", sueroterapia: "SUE", laser: "LAS", paquete: "PAQ" }[tipo];
  return `${prefix}-${new Date().getFullYear()}-${String(n).padStart(4, "0")}`;
}
function hoy() { return new Date().toISOString().split("T")[0]; }
function fmtFecha(iso: string) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

// ─── TOAST ────────────────────────────────────────────────────────────────────
interface ToastMsg { id: number; type: "success" | "error" | "info"; msg: string; }
function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[300] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium text-white
          ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-[#1A56DB]"}`}>
          {t.type === "success" ? <Check size={15} /> : t.type === "error" ? <XCircle size={15} /> : <Bell size={15} />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)}><X size={13} className="opacity-70" /></button>
        </div>
      ))}
    </div>
  );
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ estado }: { estado: EstadoConsent }) {
  const c = {
    FIRMADO: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
    ANULADO: "bg-red-50 text-red-600 border-red-200",
  }[estado];
  const icon = { FIRMADO: <CheckCircle size={11} />, PENDIENTE: <Clock size={11} />, ANULADO: <XCircle size={11} /> }[estado];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border ${c}`}>
      {icon} {estado}
    </span>
  );
}

// ─── TIPO BADGE ───────────────────────────────────────────────────────────────
function TipoBadge({ tipo }: { tipo: TipoConsent }) {
  const cfg = {
    escleroterapia: { color: "bg-[#1A56DB]/10 text-[#1A56DB]", icon: <Syringe size={10} />, label: "Escleroterapia" },
    sueroterapia:   { color: "bg-[#00B896]/10 text-[#00B896]", icon: <Droplets size={10} />, label: "Sueroterapia" },
    laser:          { color: "bg-amber-100 text-amber-700",    icon: <Zap size={10} />,      label: "Láser Várices" },
    paquete:        { color: "bg-purple-100 text-purple-700",  icon: <Package size={10} />,  label: "Paquete" },
  }[tipo];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── SIGNATURE CANVAS ─────────────────────────────────────────────────────────
function SignatureCanvas({ label, onSave, onCancel }: {
  label: string; onSave: (dataUrl: string) => void; onCancel: () => void;
}) {
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
    return () => {
      canvas.removeEventListener("mousedown", start); canvas.removeEventListener("mousemove", move); canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start); canvas.removeEventListener("touchmove", move); canvas.removeEventListener("touchend", end);
    };
  }, []);

  const clear = () => {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); setHasDrawn(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center">
              <Pen size={15} className="text-[#1A56DB]" />
            </div>
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-[10px] text-muted-foreground">Firme en el recuadro — funciona con dedo en tablet</p>
            </div>
          </div>
          <button onClick={onCancel}><X size={18} className="text-muted-foreground" /></button>
        </div>
        <div className="p-5">
          <div className="border-2 border-dashed border-[#1A56DB]/30 rounded-xl overflow-hidden bg-[#f8faff]">
            <canvas ref={canvasRef} width={600} height={240} className="w-full cursor-crosshair" style={{ touchAction: "none" }} />
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2">Optimizado para tablet — use su dedo o lápiz táctil</p>
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

// ─── FIRMA FIELD ──────────────────────────────────────────────────────────────
function FirmaField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</p>
        {value ? (
          <div className="flex items-center gap-3 p-3 border border-emerald-300 bg-emerald-50 rounded-xl">
            <img src={value} alt="firma" className="h-12 bg-white border border-emerald-200 rounded" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-emerald-700">Firma registrada ✓</p>
            </div>
            <button onClick={() => onChange("")} className="text-[11px] text-red-500 hover:underline font-medium">Repetir</button>
          </div>
        ) : (
          <button onClick={() => setOpen(true)}
            className="w-full border-2 border-dashed border-[#1A56DB]/30 rounded-xl p-5 flex flex-col items-center gap-2 hover:bg-[#1A56DB]/5 transition-colors">
            <Pen size={20} className="text-[#1A56DB]/50" />
            <p className="text-sm font-medium text-[#1A56DB]">Toque para firmar</p>
            <p className="text-[10px] text-muted-foreground">Funciona con dedo en tablet o mouse</p>
          </button>
        )}
      </div>
      {open && <SignatureCanvas label={label} onSave={(v) => { onChange(v); setOpen(false); }} onCancel={() => setOpen(false)} />}
    </>
  );
}

// ─── FIELD HELPER ─────────────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "text", placeholder = "", required = false, icon }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">{icon}</div>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full border border-border rounded-lg ${icon ? "pl-9" : "px-3"} pr-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB] transition-colors`} />
      </div>
    </div>
  );
}

// ─── STEP DATOS PACIENTE (COMPLETO) ──────────────────────────────────────────
function StepDatosPaciente({ data, onChange }: { data: DatosPaciente; onChange: (d: DatosPaciente) => void }) {
  const s = (k: keyof DatosPaciente) => (v: string) => onChange({ ...data, [k]: v });
  return (
    <div className="space-y-4">
      <div className="p-4 bg-[#EEF2F8] rounded-xl border border-[#1A56DB]/10">
        <p className="text-[10px] font-bold text-[#1A56DB] uppercase tracking-wider mb-1">IPS {IPS.nombre} · NIT {IPS.nit}</p>
        <p className="text-xs text-muted-foreground">{IPS.medico} · {IPS.rm}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
            Tipo de Documento <span className="text-red-500">*</span>
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
        <Field label="No. Documento" value={data.documento} onChange={s("documento")} placeholder="Número de documento" required
          icon={<Shield size={13} />} />
      </div>

      <Field label="Nombre completo del paciente" value={data.nombre} onChange={s("nombre")}
        placeholder="Nombres y apellidos completos" required icon={<UserCheck size={13} />} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Teléfono / Celular" value={data.telefono} onChange={s("telefono")}
          placeholder="Ej: 3001234567" type="tel" icon={<Phone size={13} />} />
        <Field label="Correo electrónico" value={data.email} onChange={s("email")}
          placeholder="correo@ejemplo.com" type="email" icon={<AtSign size={13} />} />
      </div>

      <Field label="Dirección de residencia" value={data.direccion} onChange={s("direccion")}
        placeholder="Cra 45 #23-10, Ciudad" icon={<MapPin size={13} />} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de nacimiento" value={data.fechaNacimiento} onChange={s("fechaNacimiento")} type="date" />
        <Field label="Fecha de consulta" value={data.fecha} onChange={s("fecha")} type="date" required />
      </div>
    </div>
  );
}

// ─── STEP VITALES + ENFERMERA ─────────────────────────────────────────────────
function StepVitalesEnfermera({ data, onChange, observaciones, onObservaciones, showExtra = false, extraContent }: {
  data: DatosVitales; onChange: (d: DatosVitales) => void;
  observaciones: string; onObservaciones: (v: string) => void;
  showExtra?: boolean; extraContent?: React.ReactNode;
}) {
  const s = (k: keyof DatosVitales) => (v: string) => onChange({ ...data, [k]: v });

  const VitalCard = ({ label, key_, placeholder, unit }: { label: string; key_: keyof DatosVitales; placeholder: string; unit: string }) => (
    <div className="bg-white border border-border rounded-xl p-4 text-center hover:border-[#1A56DB]/30 transition-colors">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">{label}</p>
      <div className="relative">
        <input value={data[key_]} onChange={e => s(key_)(e.target.value)} placeholder={placeholder}
          className="w-full text-center text-lg font-bold border-b-2 border-[#1A56DB]/20 focus:border-[#1A56DB] focus:outline-none bg-transparent py-1" />
        <span className="text-[10px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-xl">
        <Activity size={16} className="text-[#1A56DB]" />
        <div>
          <p className="text-xs font-semibold text-[#1A56DB]">Sección — Auxiliar de Enfermería</p>
          <p className="text-[10px] text-muted-foreground">Registre los signos vitales y valores tomados antes del procedimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <VitalCard label="Oximetría (SpO2)" key_="oximetria" placeholder="98" unit="%" />
        <VitalCard label="Tensión Arterial" key_="tension" placeholder="120/80" unit="mmHg" />
        <VitalCard label="Frec. Cardíaca" key_="frecuenciaCardiaca" placeholder="72" unit="lpm" />
        <VitalCard label="Peso" key_="peso" placeholder="65" unit="kg" />
        <VitalCard label="Talla" key_="talla" placeholder="165" unit="cm" />
        <VitalCard label="Temperatura" key_="temperatura" placeholder="36.5" unit="°C" />
      </div>

      {showExtra && extraContent}

      <div>
        <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
          Observaciones de Enfermería
        </label>
        <textarea value={observaciones} onChange={e => onObservaciones(e.target.value)}
          rows={3} placeholder="Anotaciones relevantes del personal de enfermería antes del procedimiento..."
          className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 resize-none" />
      </div>
    </div>
  );
}

// ─── STEP LEER CONSENTIMIENTO ─────────────────────────────────────────────────
function StepLeerConsentimiento({ titulo, texto, leido, onLeido }: {
  titulo: string; texto: string; leido: boolean; onLeido: (v: boolean) => void;
}) {
  const [scrolledToEnd, setScrolledToEnd] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40;
    if (atBottom) setScrolledToEnd(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <BookOpen size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">Lectura obligatoria del Consentimiento</p>
          <p className="text-[10px] text-amber-700 mt-0.5">El paciente debe leer y comprender el documento completo antes de firmar. Desplace el texto hasta el final para habilitar la firma.</p>
        </div>
      </div>

      <div className="border-2 border-[#1A56DB]/20 rounded-xl overflow-hidden">
        <div className="bg-[#0C1A35] px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#C8D6EF] font-bold uppercase tracking-wider">Consentimiento Informado</p>
            <p className="text-xs text-white font-semibold mt-0.5">{titulo}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#C8D6EF] font-mono">{IPS.nombre} · NIT {IPS.nit}</p>
            <p className="text-[10px] text-[#C8D6EF]">{IPS.medico}</p>
          </div>
        </div>
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="h-72 overflow-y-auto p-5 bg-white text-xs leading-relaxed text-foreground whitespace-pre-line"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {texto}
          <div className="mt-6 pt-4 border-t border-dashed border-border text-center text-[10px] text-muted-foreground">
            — Fin del documento de Consentimiento Informado — {IPS.nombre} · {new Date().getFullYear()} —
          </div>
        </div>
        {!scrolledToEnd && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-2 flex items-center gap-2">
            <Info size={12} className="text-amber-600" />
            <p className="text-[10px] text-amber-700">Desplace el documento hasta el final para continuar</p>
          </div>
        )}
        {scrolledToEnd && (
          <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2 flex items-center gap-2">
            <CheckCircle size={12} className="text-emerald-600" />
            <p className="text-[10px] text-emerald-700">Ha leído el documento completo</p>
          </div>
        )}
      </div>

      {scrolledToEnd && (
        <button
          onClick={() => onLeido(true)}
          className={`w-full flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all font-semibold text-sm
            ${leido
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-[#1A56DB] bg-[#1A56DB]/5 text-[#1A56DB] hover:bg-[#1A56DB]/10"}`}
        >
          <CheckCircle size={18} />
          {leido ? "Documento leído y comprendido ✓" : "Confirmar que he leído y comprendido el documento"}
        </button>
      )}
    </div>
  );
}

// ─── STEP FIRMA FINAL ─────────────────────────────────────────────────────────
function StepFirmaFinal({ consentido, onConsentido, firmaLabel, firma, onFirma }: {
  consentido: boolean | null; onConsentido: (v: boolean) => void;
  firmaLabel: string; firma: string; onFirma: (v: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 p-4 bg-[#EEF2F8] rounded-xl border border-[#1A56DB]/10">
        <Shield size={16} className="text-[#1A56DB] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-[#1A56DB]">Decisión y Firma del Paciente</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Una vez seleccione su decisión y firme, el documento será enviado al médico para su visualización en el dashboard.</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Decisión del Paciente</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => onConsentido(true)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${consentido === true ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"}`}>
            <ThumbsUp size={22} className={consentido === true ? "text-emerald-600" : "text-muted-foreground"} />
            <div className="text-left">
              <p className={`text-sm font-bold ${consentido === true ? "text-emerald-700" : "text-muted-foreground"}`}>CONSIENTO</p>
              <p className="text-[10px] text-muted-foreground">Autorizo el procedimiento</p>
            </div>
          </button>
          <button onClick={() => onConsentido(false)}
            className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all
              ${consentido === false ? "border-red-500 bg-red-50" : "border-border hover:border-red-300"}`}>
            <ThumbsDown size={22} className={consentido === false ? "text-red-600" : "text-muted-foreground"} />
            <div className="text-left">
              <p className={`text-sm font-bold ${consentido === false ? "text-red-700" : "text-muted-foreground"}`}>DISIENTO</p>
              <p className="text-[10px] text-muted-foreground">NO autorizo el procedimiento</p>
            </div>
          </button>
        </div>
      </div>

      <FirmaField label={firmaLabel} value={firma} onChange={onFirma} />

      {firma && consentido !== null && (
        <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2
          ${consentido ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-red-50 border-red-300 text-red-800"}`}>
          {consentido ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {consentido
            ? "El documento quedará firmado y disponible para revisión del médico."
            : "El disentimiento quedará registrado. No se realizará el procedimiento."}
        </div>
      )}
    </div>
  );
}

// ─── CUESTIONARIO STEP ────────────────────────────────────────────────────────
function StepCuestionario({ data, onChange }: { data: Record<string, "Si" | "No" | "">; onChange: (d: Record<string, "Si" | "No" | "">) => void }) {
  const set = (q: string, v: "Si" | "No") => onChange({ ...data, [q]: v });
  const answered = Object.values(data).filter(v => v !== "").length;
  return (
    <div className="space-y-3">
      <div className="bg-[#EEF2F8] rounded-xl p-3 mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-[#1A56DB]">Test de Diagnóstico / Pronóstico / Contraindicantes y Seguridad</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Marque Si o No para cada pregunta</p>
        </div>
        <span className="text-xs font-bold text-[#1A56DB] bg-white px-2 py-1 rounded-lg border border-[#1A56DB]/20">
          {answered}/{CUESTIONARIO_PREGUNTAS.length}
        </span>
      </div>
      {CUESTIONARIO_PREGUNTAS.map((q, i) => (
        <div key={`q-${i}`} className="flex items-start justify-between gap-3 p-3 bg-white border border-border rounded-xl hover:border-[#1A56DB]/30 transition-colors">
          <p className="text-xs flex-1 leading-relaxed">{q}</p>
          <div className="flex gap-1.5 flex-shrink-0">
            {(["Si", "No"] as const).map(opt => (
              <button key={opt} onClick={() => set(q, opt)}
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

// ─── STEP WIZARD HEADER ───────────────────────────────────────────────────────
function WizardHeader({ steps, current, titulo, icon }: {
  steps: string[]; current: number; titulo: string; icon: React.ReactNode;
}) {
  return (
    <div className="flex-shrink-0">
      <div className="flex items-center gap-3 mb-4 px-5 pt-5">
        <div className="w-9 h-9 rounded-xl bg-[#1A56DB]/10 flex items-center justify-center text-[#1A56DB]">{icon}</div>
        <div>
          <p className="font-bold text-sm">{titulo}</p>
          <p className="text-[10px] text-muted-foreground">Paso {current} de {steps.length}: {steps[current - 1]}</p>
        </div>
      </div>
      <div className="px-5 pb-4">
        <div className="flex gap-1">
          {steps.map((_, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full transition-all duration-300
              ${i < current ? "bg-[#1A56DB]" : i === current - 1 ? "bg-[#1A56DB]/60" : "bg-border"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NAV BUTTONS ──────────────────────────────────────────────────────────────
function NavButtons({ step, total, onBack, onNext, onFinish, canNext = true, finishing = false }: {
  step: number; total: number; onBack: () => void; onNext: () => void; onFinish: () => void;
  canNext?: boolean; finishing?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4 border-t border-border flex-shrink-0">
      {step > 1 && (
        <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium hover:bg-muted transition-colors">
          <ChevronLeft size={15} /> Anterior
        </button>
      )}
      <div className="flex-1" />
      {step < total ? (
        <button onClick={onNext} disabled={!canNext}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#1A56DB] text-white text-sm font-semibold disabled:opacity-40 hover:bg-[#1648bf] transition-colors">
          Siguiente <ChevronRight size={15} />
        </button>
      ) : (
        <button onClick={onFinish} disabled={!canNext || finishing}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors">
          {finishing ? <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Guardando...</> : <><CheckCircle size={15} /> Guardar y Enviar</>}
        </button>
      )}
    </div>
  );
}

// ─── FORM WRAPPER ─────────────────────────────────────────────────────────────
function FormWrapper({ onCancel, children }: { onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-3">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-end px-5 pt-4">
          <button onClick={onCancel} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted">
            <X size={16} className="text-muted-foreground" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── FORM ESCLEROTERAPIA ──────────────────────────────────────────────────────
function FormEscleroterapia({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; nextId: number;
}) {
  const STEPS = ["Datos del Paciente", "Cuestionario Médico", "Vitales — Enfermería", "Leer Consentimiento", "Firma y Envío"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ nombre: "", documento: "", tipoDoc: "CC", telefono: "", email: "", direccion: "", fechaNacimiento: "", fecha: hoy() });
  const [cuest, setCuest] = useState<Record<string, "Si" | "No" | "">>({});
  const [vitales, setVitales] = useState<DatosVitales>({ oximetria: "", tension: "", peso: "", talla: "", frecuenciaCardiaca: "", temperatura: "" });
  const [obs, setObs] = useState("");
  const [leido, setLeido] = useState(false);
  const [firmaP, setFirmaP] = useState("");
  const [firmaM, setFirmaM] = useState("");
  const [consentido, setConsentido] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "";
    if (step === 4) return leido;
    if (step === 5) return firmaP !== "" && consentido !== null;
    return true;
  };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      const r: ConsentRecord = {
        id: String(Date.now()), tipo: "escleroterapia", radicado: genRadicado("escleroterapia", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos: { paciente: pac, cuestionario: cuest, vitales, firmaConsentimiento: firmaP, firmaMedico: firmaM, consentido, observacionesEnfermera: obs },
      };
      onSave(r);
      addToast("success", `Consentimiento de Escleroterapia firmado — Notificado al médico`);
      setSaving(false);
    }, 900);
  };

  const stepContent = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac} />;
    if (step === 2) return <StepCuestionario data={cuest} onChange={setCuest} />;
    if (step === 3) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obs} onObservaciones={setObs} />;
    if (step === 4) return <StepLeerConsentimiento titulo="Escleroterapia (Inyección) de Várices" texto={TEXTO_ESCLEROTERAPIA} leido={leido} onLeido={setLeido} />;
    if (step === 5) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firmaLabel="Firma del Paciente" firma={firmaP} onFirma={setFirmaP} />;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Consentimiento de Escleroterapia" icon={<Syringe size={18} />} />
      <div className="overflow-y-auto flex-1 px-5 pb-2">{stepContent()}</div>
      <NavButtons step={step} total={5} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onFinish={handleSave} canNext={canNext()} finishing={saving} />
    </FormWrapper>
  );
}

// ─── FORM SUEROTERAPIA ────────────────────────────────────────────────────────
function FormSueroterapia({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; nextId: number;
}) {
  const STEPS = ["Datos del Paciente", "Vitales + Prescripción — Enfermería", "Leer Consentimiento", "Firma y Envío"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ nombre: "", documento: "", tipoDoc: "CC", telefono: "", email: "", direccion: "", fechaNacimiento: "", fecha: hoy() });
  const [vitales, setVitales] = useState<DatosVitales>({ oximetria: "", tension: "", peso: "", talla: "", frecuenciaCardiaca: "", temperatura: "" });
  const [obs, setObs] = useState("");
  const [dosis_vitC, setDosisVitC] = useState("");
  const [dosis_compB, setDosisCompB] = useState("");
  const [traz, setTraz] = useState({ nacl: "", vitC: "", compB: "", jeringa: "", pericraneal: "", macrogotero: "" });
  const [leido, setLeido] = useState(false);
  const [firmaP, setFirmaP] = useState("");
  const [firmaR, setFirmaR] = useState("");
  const [consentido, setConsentido] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "";
    if (step === 3) return leido;
    if (step === 4) return firmaP !== "" && consentido !== null;
    return true;
  };

  const PrescripcionExtra = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-[#00B896]/10 border border-[#00B896]/30 rounded-xl">
        <Droplets size={15} className="text-[#00B896]" />
        <p className="text-xs font-semibold text-[#00B896]">Prescripción y Trazabilidad — Solo Enfermería</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3cc" />
        <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4cc" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trazabilidad M/DM — Número de Lote</p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ["NaCl 0.9%", "nacl"], ["Vitamina C", "vitC"], ["Complejo B", "compB"],
            ["Jeringa 3ml", "jeringa"], ["Pericraneal", "pericraneal"], ["Macrogotero", "macrogotero"]
          ] as [string, keyof typeof traz][]).map(([label, key]) => (
            <div key={key}>
              <label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label>
              <input value={traz[key]} onChange={e => setTraz({ ...traz, [key]: e.target.value })} placeholder="No. lote"
                className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none focus:ring-1 focus:ring-[#1A56DB]/30 font-mono" />
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
        datos: { paciente: pac, vitales, dosis_vitC, dosis_compB, trazabilidad: traz, firmaConsentimiento: firmaP, firmaResponsable: firmaR, consentido, observacionesEnfermera: obs },
      };
      onSave(r);
      addToast("success", "Consentimiento de Sueroterapia firmado — Notificado al médico");
      setSaving(false);
    }, 900);
  };

  const stepContent = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac} />;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obs} onObservaciones={setObs} showExtra extraContent={PrescripcionExtra} />;
    if (step === 3) return <StepLeerConsentimiento titulo="Sueroterapia Vitamina C / Complejo B" texto={TEXTO_SUEROTERAPIA} leido={leido} onLeido={setLeido} />;
    if (step === 4) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firmaLabel="Firma del Paciente" firma={firmaP} onFirma={setFirmaP} />;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Consentimiento de Sueroterapia" icon={<Droplets size={18} />} />
      <div className="overflow-y-auto flex-1 px-5 pb-2">{stepContent()}</div>
      <NavButtons step={step} total={4} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onFinish={handleSave} canNext={canNext()} finishing={saving} />
    </FormWrapper>
  );
}

// ─── FORM LASER ───────────────────────────────────────────────────────────────
function FormLaser({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; nextId: number;
}) {
  const STEPS = ["Datos del Paciente", "Vitales + Parámetros — Enfermería", "Leer Consentimiento", "Firma y Envío"];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ nombre: "", documento: "", tipoDoc: "CC", telefono: "", email: "", direccion: "", fechaNacimiento: "", fecha: hoy() });
  const [vitales, setVitales] = useState<DatosVitales>({ oximetria: "", tension: "", peso: "", talla: "", frecuenciaCardiaca: "", temperatura: "" });
  const [obs, setObs] = useState("");
  const [params, setParams] = useState<LaserRow[]>([{ fototipo: "", pieza: "", modo: "", frecuencia: "", fluencia: "", energia: "", area: "", pases: "" }]);
  const [leido, setLeido] = useState(false);
  const [firmaP, setFirmaP] = useState("");
  const [firmaM, setFirmaM] = useState("");
  const [consentido, setConsentido] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "";
    if (step === 3) return leido;
    if (step === 4) return firmaP !== "" && consentido !== null;
    return true;
  };

  const addRow = () => setParams(p => [...p, { fototipo: "", pieza: "", modo: "", frecuencia: "", fluencia: "", energia: "", area: "", pases: "" }]);
  const updRow = (i: number, k: keyof LaserRow, v: string) => setParams(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));
  const delRow = (i: number) => setParams(p => p.filter((_, idx) => idx !== i));

  const ParamsExtra = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex-1 mr-2">
          <Zap size={14} className="text-amber-600" />
          <p className="text-xs font-semibold text-amber-800">Parámetros ND-YAG — Técnico/Enfermería</p>
        </div>
        <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1A56DB] text-white text-xs font-medium hover:bg-[#1648bf]">
          <Plus size={12} /> Fila
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-[#0C1A35] text-[#C8D6EF]">
              {["Fototipo", "Pieza", "Modo", "Frec. Hz", "Fluencia J/cm²", "Energía mJ", "Área cm²", "Pases", ""].map(h => (
                <th key={h} className="px-2 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {params.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"}>
                {(["fototipo", "pieza", "modo", "frecuencia", "fluencia", "energia", "area", "pases"] as (keyof LaserRow)[]).map(k => (
                  <td key={k} className="px-1 py-1">
                    <input value={row[k]} onChange={e => updRow(i, k, e.target.value)}
                      className="w-full min-w-[50px] border border-transparent focus:border-[#1A56DB]/40 rounded px-1.5 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono" />
                  </td>
                ))}
                <td className="px-1 py-1">
                  {params.length > 1 && (
                    <button onClick={() => delRow(i)} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={10} /></button>
                  )}
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
        datos: { paciente: pac, vitales, parametros: params, firmaConsentimiento: firmaP, firmaMedico: firmaM, consentido, observacionesEnfermera: obs },
      };
      onSave(r);
      addToast("success", "Consentimiento Láser Várices firmado — Notificado al médico");
      setSaving(false);
    }, 900);
  };

  const stepContent = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac} />;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obs} onObservaciones={setObs} showExtra extraContent={ParamsExtra} />;
    if (step === 3) return <StepLeerConsentimiento titulo="Terapia Láser ND:YAG para Venas Várices" texto={TEXTO_LASER} leido={leido} onLeido={setLeido} />;
    if (step === 4) return <StepFirmaFinal consentido={consentido} onConsentido={setConsentido} firmaLabel="Firma del Paciente" firma={firmaP} onFirma={setFirmaP} />;
    return null;
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Consentimiento Láser Várices" icon={<Zap size={18} />} />
      <div className="overflow-y-auto flex-1 px-5 pb-2">{stepContent()}</div>
      <NavButtons step={step} total={4} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onFinish={handleSave} canNext={canNext()} finishing={saving} />
    </FormWrapper>
  );
}

// ─── FORM PAQUETE ─────────────────────────────────────────────────────────────
function FormPaquete({ onSave, onCancel, addToast, nextId }: {
  onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; nextId: number;
}) {
  const STEPS = [
    "Datos del Paciente", "Vitales — Enfermería",
    "Valores Escleroterapia", "Valores Sueroterapia", "Valores Láser",
    "Leer — Escleroterapia", "Leer — Sueroterapia", "Leer — Láser",
    "Firmar — Escleroterapia", "Firmar — Sueroterapia", "Firmar — Láser",
    "Resumen"
  ];
  const [step, setStep] = useState(1);
  const [pac, setPac] = useState<DatosPaciente>({ nombre: "", documento: "", tipoDoc: "CC", telefono: "", email: "", direccion: "", fechaNacimiento: "", fecha: hoy() });
  const [vitales, setVitales] = useState<DatosVitales>({ oximetria: "", tension: "", peso: "", talla: "", frecuenciaCardiaca: "", temperatura: "" });
  const [obsGeneral, setObsGeneral] = useState("");
  const [cuest, setCuest] = useState<Record<string, "Si" | "No" | "">>({});

  // Valores específicos Sueroterapia
  const [dosis_vitC, setDosisVitC] = useState("");
  const [dosis_compB, setDosisCompB] = useState("");
  const [traz, setTraz] = useState({ nacl: "", vitC: "", compB: "", jeringa: "", pericraneal: "", macrogotero: "" });

  // Valores específicos Láser
  const [params, setParams] = useState<LaserRow[]>([{ fototipo: "", pieza: "", modo: "", frecuencia: "", fluencia: "", energia: "", area: "", pases: "" }]);

  // Lecturas
  const [leidoEsc, setLeidoEsc] = useState(false);
  const [leidoSue, setLeidoSue] = useState(false);
  const [leidoLas, setLeidoLas] = useState(false);

  // Firmas
  const [firmaEsc, setFirmaEsc] = useState("");
  const [firmaSue, setFirmaSue] = useState("");
  const [firmaLas, setFirmaLas] = useState("");
  const [consentidoEsc, setConsentidoEsc] = useState<boolean | null>(null);
  const [consentidoSue, setConsentidoSue] = useState<boolean | null>(null);
  const [consentidoLas, setConsentidoLas] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  const addRow = () => setParams(p => [...p, { fototipo: "", pieza: "", modo: "", frecuencia: "", fluencia: "", energia: "", area: "", pases: "" }]);
  const updRow = (i: number, k: keyof LaserRow, v: string) => setParams(p => p.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const canNext = () => {
    if (step === 1) return pac.nombre.trim() !== "" && pac.documento.trim() !== "";
    if (step === 6) return leidoEsc;
    if (step === 7) return leidoSue;
    if (step === 8) return leidoLas;
    if (step === 9) return firmaEsc !== "" && consentidoEsc !== null;
    if (step === 10) return firmaSue !== "" && consentidoSue !== null;
    if (step === 11) return firmaLas !== "" && consentidoLas !== null;
    return true;
  };

  const SueroExtra = (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-[#00B896]/10 border border-[#00B896]/30 rounded-lg">
        <Droplets size={13} className="text-[#00B896]" />
        <p className="text-xs font-semibold text-[#00B896]">Prescripción Sueroterapia</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Dosis Vitamina C (cc)" value={dosis_vitC} onChange={setDosisVitC} placeholder="Ej: 3cc" />
        <Field label="Dosis Complejo B (cc)" value={dosis_compB} onChange={setDosisCompB} placeholder="Ej: 4cc" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trazabilidad M/DM</p>
        <div className="grid grid-cols-2 gap-2">
          {([["NaCl 0.9%", "nacl"], ["Vitamina C", "vitC"], ["Complejo B", "compB"], ["Jeringa 3ml", "jeringa"], ["Pericraneal", "pericraneal"], ["Macrogotero", "macrogotero"]] as [string, keyof typeof traz][]).map(([label, key]) => (
            <div key={key}>
              <label className="text-[10px] text-muted-foreground font-medium block mb-1">{label}</label>
              <input value={traz[key]} onChange={e => setTraz({ ...traz, [key]: e.target.value })} placeholder="No. lote"
                className="w-full border border-border rounded-lg px-2.5 py-2 text-xs bg-input-background focus:outline-none focus:ring-1 focus:ring-[#1A56DB]/30 font-mono" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const LaserExtra = (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex-1 mr-2">
          <Zap size={13} className="text-amber-600" />
          <p className="text-xs font-semibold text-amber-800">Parámetros ND-YAG</p>
        </div>
        <button onClick={addRow} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#1A56DB] text-white text-xs font-medium">
          <Plus size={12} /> Fila
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-[10px]">
          <thead><tr className="bg-[#0C1A35] text-[#C8D6EF]">
            {["Fototipo", "Pieza", "Modo", "Hz", "J/cm²", "mJ", "cm²", "Pases"].map(h => (
              <th key={h} className="px-2 py-2 text-left font-semibold">{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {params.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8FAFF]"}>
                {(["fototipo", "pieza", "modo", "frecuencia", "fluencia", "energia", "area", "pases"] as (keyof LaserRow)[]).map(k => (
                  <td key={k} className="px-1 py-1">
                    <input value={row[k]} onChange={e => updRow(i, k, e.target.value)}
                      className="w-full min-w-[40px] border border-transparent focus:border-[#1A56DB]/40 rounded px-1 py-1 bg-transparent focus:bg-white focus:outline-none text-[10px] font-mono" />
                  </td>
                ))}
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
      const makeRec = (tipo: TipoConsent, datos: any, n: number): ConsentRecord => ({
        id: String(Date.now() + n), tipo, radicado: genRadicado(tipo, nextId + n),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true, datos,
      });
      const r: ConsentRecord = {
        id: String(Date.now()), tipo: "paquete", radicado: genRadicado("paquete", nextId),
        fecha: hoy(), pacienteNombre: pac.nombre, pacienteDoc: pac.documento, pacienteTel: pac.telefono,
        estado: "FIRMADO", enviado_email: false, enviado_whatsapp: false, pendienteMedico: true,
        datos: [
          makeRec("escleroterapia", { paciente: pac, cuestionario: cuest, vitales, firmaConsentimiento: firmaEsc, firmaMedico: "", consentido: consentidoEsc, observacionesEnfermera: obsGeneral }, 1),
          makeRec("sueroterapia", { paciente: pac, vitales, dosis_vitC, dosis_compB, trazabilidad: traz, firmaConsentimiento: firmaSue, firmaResponsable: "", consentido: consentidoSue, observacionesEnfermera: obsGeneral }, 2),
          makeRec("laser", { paciente: pac, vitales, parametros: params, firmaConsentimiento: firmaLas, firmaMedico: "", consentido: consentidoLas, observacionesEnfermera: obsGeneral }, 3),
        ],
      };
      onSave(r);
      addToast("success", "Paquete completo firmado (3 consentimientos) — Notificado al médico");
      setSaving(false);
    }, 1200);
  };

  const stepContent = () => {
    if (step === 1) return <StepDatosPaciente data={pac} onChange={setPac} />;
    if (step === 2) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obsGeneral} onObservaciones={setObsGeneral} />;
    if (step === 3) return <StepCuestionario data={cuest} onChange={setCuest} />;
    if (step === 4) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obsGeneral} onObservaciones={setObsGeneral} showExtra extraContent={SueroExtra} />;
    if (step === 5) return <StepVitalesEnfermera data={vitales} onChange={setVitales} observaciones={obsGeneral} onObservaciones={setObsGeneral} showExtra extraContent={LaserExtra} />;
    if (step === 6) return <StepLeerConsentimiento titulo="Escleroterapia — Paquete Completo" texto={TEXTO_ESCLEROTERAPIA} leido={leidoEsc} onLeido={setLeidoEsc} />;
    if (step === 7) return <StepLeerConsentimiento titulo="Sueroterapia — Paquete Completo" texto={TEXTO_SUEROTERAPIA} leido={leidoSue} onLeido={setLeidoSue} />;
    if (step === 8) return <StepLeerConsentimiento titulo="Láser Várices — Paquete Completo" texto={TEXTO_LASER} leido={leidoLas} onLeido={setLeidoLas} />;
    if (step === 9) return <StepFirmaFinal consentido={consentidoEsc} onConsentido={setConsentidoEsc} firmaLabel="Firma — Escleroterapia" firma={firmaEsc} onFirma={setFirmaEsc} />;
    if (step === 10) return <StepFirmaFinal consentido={consentidoSue} onConsentido={setConsentidoSue} firmaLabel="Firma — Sueroterapia" firma={firmaSue} onFirma={setFirmaSue} />;
    if (step === 11) return <StepFirmaFinal consentido={consentidoLas} onConsentido={setConsentidoLas} firmaLabel="Firma — Láser Várices" firma={firmaLas} onFirma={setFirmaLas} />;
    if (step === 12) return (
      <div className="space-y-4">
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
          <div className="flex items-center gap-2 mb-3"><CheckCircle size={18} className="text-emerald-600" /><p className="font-bold text-emerald-800 text-sm">Paquete Completo — Listo para Guardar</p></div>
          <p className="text-xs text-emerald-700">Paciente: <span className="font-semibold">{pac.nombre}</span></p>
          <p className="text-xs text-emerald-700">Doc: {pac.tipoDoc} {pac.documento}</p>
        </div>
        {[
          { label: "Escleroterapia", firma: firmaEsc, consentido: consentidoEsc, icon: <Syringe size={13} /> },
          { label: "Sueroterapia", firma: firmaSue, consentido: consentidoSue, icon: <Droplets size={13} /> },
          { label: "Láser Várices", firma: firmaLas, consentido: consentidoLas, icon: <Zap size={13} /> },
        ].map(({ label, firma, consentido, icon }) => (
          <div key={label} className="flex items-center gap-3 p-3 bg-white border border-border rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-[#EEF2F8] flex items-center justify-center text-[#1A56DB]">{icon}</div>
            <div className="flex-1">
              <p className="text-xs font-semibold">{label}</p>
              <p className={`text-[10px] font-medium ${consentido ? "text-emerald-600" : "text-red-600"}`}>
                {consentido ? "✓ Consentido" : "✗ Disentido"}
              </p>
            </div>
            {firma && <img src={firma} alt="firma" className="h-8 bg-white border border-[#1A56DB]/20 rounded" />}
          </div>
        ))}
      </div>
    );
    return null;
  };

  const stepLabel = () => {
    const labels = ["Datos del Paciente", "Vitales Generales", "Cuestionario Escleroterapia", "Prescripción Sueroterapia", "Parámetros Láser", "Leer — Escleroterapia", "Leer — Sueroterapia", "Leer — Láser", "Firmar — Escleroterapia", "Firmar — Sueroterapia", "Firmar — Láser", "Resumen"];
    return labels[step - 1];
  };

  return (
    <FormWrapper onCancel={onCancel}>
      <WizardHeader steps={STEPS} current={step} titulo="Paquete Completo — 3 Consentimientos" icon={<Package size={18} />} />
      <div className="text-center pb-1">
        <span className="text-[10px] text-muted-foreground font-medium">{stepLabel()}</span>
      </div>
      <div className="overflow-y-auto flex-1 px-5 pb-2">{stepContent()}</div>
      <NavButtons step={step} total={12} onBack={() => setStep(s => s - 1)} onNext={() => setStep(s => s + 1)} onFinish={handleSave} canNext={canNext()} finishing={saving} />
    </FormWrapper>
  );
}

// ─── PDF VIEWER ───────────────────────────────────────────────────────────────
function PDFModal({ record, onClose, onSendEmail, onSendWhatsApp }: {
  record: ConsentRecord; onClose: () => void;
  onSendEmail: () => void; onSendWhatsApp: () => void;
}) {
  const d = record.datos as any;
  const pac = d.paciente as DatosPaciente;
  const vitales = d.vitales as DatosVitales | undefined;
  const TIPO_LABELS = {
    escleroterapia: "ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES",
    sueroterapia: "SUEROTERAPIA VITAMINA C / COMPLEJO B",
    laser: "TERAPIA LÁSER ND:YAG PARA VENAS VÁRICES",
    paquete: "PAQUETE COMPLETO — 3 CONSENTIMIENTOS",
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-bold text-sm">{record.radicado}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge estado={record.estado} />
                <TipoBadge tipo={record.tipo} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onSendWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366] text-white text-xs font-medium hover:bg-[#20ba5a] transition-colors">
              <MessageSquare size={12} /> WhatsApp
            </button>
            <button onClick={onSendEmail}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A56DB] text-white text-xs font-medium hover:bg-[#1648bf] transition-colors">
              <Mail size={12} /> Email
            </button>
            <button onClick={onClose}><X size={18} className="text-muted-foreground" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm p-7 max-w-[600px] mx-auto text-sm text-foreground">
            <div className="flex items-start justify-between pb-5 mb-5 border-b-2 border-[#1A56DB]">
              <div>
                <p className="font-black text-xl text-[#1A56DB] tracking-tight">Med&Fis</p>
                <p className="text-xs text-muted-foreground font-mono">NIT {IPS.nit}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono text-[#1A56DB] font-semibold">{record.radicado}</p>
                <p className="text-[10px] text-muted-foreground">{fmtFecha(record.fecha)}</p>
                <StatusBadge estado={record.estado} />
              </div>
            </div>

            <h2 className="text-center font-black text-sm uppercase tracking-wide text-[#0C1A35] mb-1">CONSENTIMIENTO INFORMADO</h2>
            <h3 className="text-center text-xs font-semibold text-[#1A56DB] mb-5">{TIPO_LABELS[record.tipo]}</h3>

            {/* Datos paciente */}
            <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-[#EEF2F8] rounded-lg">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Paciente</p>
                <p className="text-xs font-semibold">{pac?.nombre}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{pac?.tipoDoc}: {pac?.documento}</p>
                <p className="text-[10px] text-muted-foreground">Tel: {pac?.telefono}</p>
                {pac?.email && <p className="text-[10px] text-muted-foreground">{pac.email}</p>}
                {pac?.direccion && <p className="text-[10px] text-muted-foreground">{pac.direccion}</p>}
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">Médico Tratante</p>
                <p className="text-xs font-semibold">{IPS.medico}</p>
                <p className="text-[10px] text-muted-foreground">{IPS.rm}</p>
                <p className="text-[10px] text-muted-foreground">Fecha: {pac?.fecha && fmtFecha(pac.fecha)}</p>
              </div>
            </div>

            {/* Vitales */}
            {vitales && (
              <div className="mb-4">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Signos Vitales</p>
                <div className="grid grid-cols-6 gap-1">
                  {[["SpO2", vitales.oximetria + "%"], ["TA", vitales.tension], ["FC", vitales.frecuenciaCardiaca + " lpm"], ["Peso", vitales.peso + " kg"], ["Talla", vitales.talla + " cm"], ["Temp", vitales.temperatura + "°C"]].map(([l, v]) => (
                    <div key={l} className="bg-[#EEF2F8] rounded-lg p-2 text-center">
                      <p className="text-[8px] text-muted-foreground font-semibold">{l}</p>
                      <p className="text-[10px] font-bold">{v || "—"}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Observaciones enfermería */}
            {(d as any).observacionesEnfermera && (
              <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Observaciones de Enfermería</p>
                <p className="text-[10px]">{(d as any).observacionesEnfermera}</p>
              </div>
            )}

            {/* Firma y decisión */}
            <div className="mt-6 pt-5 border-t border-dashed border-border">
              <p className="text-[9px] text-center text-muted-foreground mb-4">
                El paciente declara haber LEÍDO, COMPRENDIDO y tomado su decisión de manera LIBRE y VOLUNTARIA.
              </p>
              <div className="flex justify-center mb-3">
                <div className="text-center max-w-[200px]">
                  {d.firmaConsentimiento ? (
                    <img src={d.firmaConsentimiento} alt="firma" className="w-full h-16 object-contain border border-[#1A56DB]/20 rounded-lg bg-white mb-1" />
                  ) : (
                    <div className="w-full h-16 border border-dashed border-[#1A56DB]/30 rounded-lg mb-1 flex items-center justify-center">
                      <p className="text-[9px] text-muted-foreground">Pendiente</p>
                    </div>
                  )}
                  <div className="border-t border-foreground/30 pt-1">
                    <p className="text-[10px] font-semibold">{pac?.nombre}</p>
                    <p className="text-[9px] text-muted-foreground">{pac?.tipoDoc}: {pac?.documento}</p>
                    <p className="text-[9px] text-muted-foreground">Firma del Paciente</p>
                  </div>
                </div>
              </div>
              <div className={`mt-3 p-2.5 rounded-lg text-center text-xs font-bold
                ${d.consentido === true ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : d.consentido === false ? "bg-red-50 text-red-700 border border-red-200"
                : "bg-muted text-muted-foreground"}`}>
                {d.consentido === true ? "✓ PACIENTE CONSINTIÓ EL PROCEDIMIENTO"
                : d.consentido === false ? "✗ PACIENTE DISENTIÓ — NO AUTORIZA EL PROCEDIMIENTO"
                : "Decisión no registrada"}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-border text-center">
              <p className="text-[9px] text-muted-foreground">Documento digital firmado · {IPS.nombre} · NIT {IPS.nit} · {new Date().toLocaleDateString("es-CO")}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-2 p-4 border-t border-border flex-shrink-0">
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
            <Printer size={14} /> Imprimir
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
            <Download size={14} /> Descargar PDF
          </button>
          <button onClick={onClose} className="px-5 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf]">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
function LoginPage({ onLogin }: { onLogin: (u: Usuario) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setLoading(true);
    setTimeout(() => {
      const user = USUARIOS.find(u => u.email === email && u.password === password);
      if (user) { onLogin(user); }
      else { setError("Credenciales incorrectas. Verifique su email y contraseña."); }
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0C1A35] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A56DB] mb-4">
            <Stethoscope size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Med&Fis</h1>
          <p className="text-[#C8D6EF] text-sm mt-1">Sistema de Consentimientos Informados</p>
          <p className="text-[#8899BB] text-[10px] mt-0.5 font-mono">NIT {IPS.nit}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <h2 className="text-sm font-bold text-foreground mb-5">Iniciar Sesión</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Correo electrónico" value={email} onChange={setEmail} type="email" placeholder="usuario@medfis.com" required />
            <Field label="Contraseña" value={password} onChange={setPassword} type="password" placeholder="••••••••" required />
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium">
                <XCircle size={14} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl bg-[#1A56DB] text-white font-semibold text-sm disabled:opacity-60 hover:bg-[#1648bf] transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verificando...</> : "Ingresar"}
            </button>
          </form>
          <div className="mt-5 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-2">Accesos de prueba:</p>
            {USUARIOS.map(u => (
              <button key={u.id} onClick={() => { setEmail(u.email); setPassword(u.password); }}
                className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors mb-1">
                <p className="text-[10px] font-semibold text-foreground">{u.nombre}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{u.email} · {u.password}</p>
              </button>
            ))}
          </div>
        </div>
        <p className="text-center text-[#8899BB] text-[10px] mt-4">{IPS.medico} · {IPS.rm}</p>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ page, onPage, user, onLogout, records, mobileOpen, onClose }: {
  page: AppPage; onPage: (p: AppPage) => void; user: Usuario; onLogout: () => void;
  records: ConsentRecord[]; mobileOpen: boolean; onClose: () => void;
}) {
  const pendientes = records.filter(r => r.pendienteMedico).length;
  const nav = [
    { id: "dashboard" as AppPage, label: "Dashboard", icon: <LayoutDashboard size={17} /> },
    { id: "historial" as AppPage, label: "Historial", icon: <ClipboardList size={17} /> },
    { id: "form" as AppPage, label: "Nuevo Consentimiento", icon: <Plus size={17} /> },
  ];

  return (
    <>
      {mobileOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed top-0 left-0 h-full w-60 bg-[#0C1A35] z-50 flex flex-col transition-transform duration-300
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="px-5 py-5 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1A56DB] flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <p className="font-black text-white text-sm">Med&Fis</p>
              <p className="text-[10px] text-[#8899BB] font-mono">NIT {IPS.nit}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => (
            <button key={item.id} onClick={() => { onPage(item.id); onClose(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative
                ${page === item.id ? "bg-[#1A56DB] text-white" : "text-[#C8D6EF] hover:bg-white/8"}`}>
              {item.icon}
              {item.label}
              {item.id === "dashboard" && pendientes > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {pendientes}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-3 pb-5 border-t border-white/8 pt-4">
          <div className="px-3 py-2 mb-2">
            <p className="text-[10px] text-white font-semibold truncate">{user.nombre}</p>
            <p className="text-[10px] text-[#8899BB]">{user.rol}</p>
          </div>
          <button onClick={onLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-[#C8D6EF] hover:bg-white/8 text-sm font-medium transition-colors">
            <LogOut size={15} /> Cerrar Sesión
          </button>
        </div>
      </aside>
    </>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ records, onNewForm, user, addToast }: {
  records: ConsentRecord[]; onNewForm: (t: TipoConsent) => void; user: Usuario;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
  const firmados = records.filter(r => r.estado === "FIRMADO").length;
  const pendientesMedico = records.filter(r => r.pendienteMedico);
  const hoyCount = records.filter(r => r.fecha === hoy()).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Bienvenido, {user.nombre}</p>
      </div>

      {/* Alertas pendientes para el médico */}
      {pendientesMedico.length > 0 && (user.rol === "MÉDICO" || user.rol === "ADMINISTRADOR") && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-800">Firmas pendientes de revisión</p>
            <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full px-2 py-0.5">{pendientesMedico.length}</span>
          </div>
          <div className="space-y-2">
            {pendientesMedico.slice(0, 4).map(r => (
              <div key={r.id} className="flex items-center justify-between bg-white rounded-xl p-3 border border-amber-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    {r.tipo === "escleroterapia" ? <Syringe size={14} className="text-amber-700" />
                    : r.tipo === "sueroterapia" ? <Droplets size={14} className="text-amber-700" />
                    : r.tipo === "laser" ? <Zap size={14} className="text-amber-700" />
                    : <Package size={14} className="text-amber-700" />}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{r.pacienteNombre}</p>
                    <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TipoBadge tipo={r.tipo} />
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                </div>
              </div>
            ))}
            {pendientesMedico.length > 4 && (
              <p className="text-[10px] text-amber-700 text-center font-medium">+{pendientesMedico.length - 4} más en el historial</p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Consentimientos", value: records.length, icon: <FileText size={18} />, color: "text-[#1A56DB]", bg: "bg-[#1A56DB]/10" },
          { label: "Firmados", value: firmados, icon: <CheckCircle size={18} />, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Hoy", value: hoyCount, icon: <Clock size={18} />, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Pendientes Médico", value: pendientesMedico.length, icon: <Bell size={18} />, color: "text-red-600", bg: "bg-red-50" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-border">
            <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center ${s.color} mb-3`}>{s.icon}</div>
            <p className="text-2xl font-black text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Nuevo consentimiento */}
      <div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Crear Nuevo Consentimiento</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            { tipo: "escleroterapia" as TipoConsent, label: "Escleroterapia", sub: "Inyección de Várices", icon: <Syringe size={22} />, color: "bg-[#1A56DB]", light: "bg-[#1A56DB]/8 hover:bg-[#1A56DB]/12 border-[#1A56DB]/20" },
            { tipo: "sueroterapia" as TipoConsent, label: "Sueroterapia", sub: "Vit C / Complejo B", icon: <Droplets size={22} />, color: "bg-[#00B896]", light: "bg-[#00B896]/8 hover:bg-[#00B896]/12 border-[#00B896]/20" },
            { tipo: "laser" as TipoConsent, label: "Láser Várices", sub: "Terapia ND:YAG", icon: <Zap size={22} />, color: "bg-amber-500", light: "bg-amber-50 hover:bg-amber-100 border-amber-200" },
            { tipo: "paquete" as TipoConsent, label: "Paquete Completo", sub: "Los 3 consentimientos", icon: <Package size={22} />, color: "bg-purple-600", light: "bg-purple-50 hover:bg-purple-100 border-purple-200" },
          ]).map(item => (
            <button key={item.tipo} onClick={() => onNewForm(item.tipo)}
              className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 text-center transition-all active:scale-95 ${item.light}`}>
              <div className={`w-12 h-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-sm`}>
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Últimos registros */}
      {records.length > 0 && (
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Últimos Registros</p>
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {records.slice(-5).reverse().map((r, i) => (
              <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i < 4 ? "border-b border-border" : ""}`}>
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  {r.tipo === "escleroterapia" ? <Syringe size={14} className="text-[#1A56DB]" />
                  : r.tipo === "sueroterapia" ? <Droplets size={14} className="text-[#00B896]" />
                  : r.tipo === "laser" ? <Zap size={14} className="text-amber-600" />
                  : <Package size={14} className="text-purple-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{r.pacienteNombre}</p>
                  <p className="text-[10px] text-muted-foreground">{r.radicado} · {fmtFecha(r.fecha)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.pendienteMedico && <div className="w-2 h-2 rounded-full bg-amber-500" title="Pendiente revisión médico" />}
                  <StatusBadge estado={r.estado} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      {records.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Tendencia Mensual</p>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={CHART_MENSUAL}>
                <defs>
                  <linearGradient id="gEsc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F4" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Area type="monotone" dataKey="escler" stroke="#1A56DB" fill="url(#gEsc)" strokeWidth={2} name="Escleroterapia" />
                <Area type="monotone" dataKey="suero" stroke="#00B896" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Sueroterapia" />
                <Area type="monotone" dataKey="laser" stroke="#F59E0B" fill="none" strokeWidth={2} strokeDasharray="4 2" name="Láser" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-card rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Distribución por Tipo</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={CHART_TIPOS} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                  {CHART_TIPOS.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2">
              {CHART_TIPOS.map(t => (
                <div key={t.name} className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: t.color }} />
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

// ─── HISTORIAL PAGE ───────────────────────────────────────────────────────────
function HistorialPage({ records, onView, onDelete, onMarkReviewed, addToast, user }: {
  records: ConsentRecord[]; onView: (r: ConsentRecord) => void;
  onDelete: (id: string) => void; onMarkReviewed: (id: string) => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; user: Usuario;
}) {
  const [q, setQ] = useState("");
  const [filterTipo, setFilterTipo] = useState<"todos" | TipoConsent>("todos");
  const [filterEstado, setFilterEstado] = useState<"todos" | EstadoConsent>("todos");

  const filtered = records.filter(r => {
    const matchQ = q === "" || r.pacienteNombre.toLowerCase().includes(q.toLowerCase()) || r.radicado.toLowerCase().includes(q.toLowerCase()) || r.pacienteDoc.includes(q);
    const matchTipo = filterTipo === "todos" || r.tipo === filterTipo;
    const matchEstado = filterEstado === "todos" || r.estado === filterEstado;
    return matchQ && matchTipo && matchEstado;
  }).reverse();

  const handleWA = (r: ConsentRecord) => {
    const msg = encodeURIComponent(`*${IPS.nombre}* — Consentimiento Informado\n\nEstimado/a ${r.pacienteNombre},\n\nSu consentimiento informado ha sido procesado exitosamente.\n\n📋 Radicado: ${r.radicado}\n📅 Fecha: ${fmtFecha(r.fecha)}\n✅ Estado: ${r.estado}\n\nPara mayor información comuníquese con nosotros.\n\n_${IPS.nombre} · NIT ${IPS.nit}_`);
    const tel = r.pacienteTel.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/57${tel}?text=${msg}`, "_blank");
    addToast("info", `Abriendo WhatsApp para ${r.pacienteNombre}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Historial de Consentimientos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} registros</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar por nombre, radicado o cédula..."
            className="w-full border border-border rounded-xl pl-9 pr-3 py-2.5 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
        </div>
        <select value={filterTipo} onChange={e => setFilterTipo(e.target.value as any)}
          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none">
          <option value="todos">Todos los tipos</option>
          <option value="escleroterapia">Escleroterapia</option>
          <option value="sueroterapia">Sueroterapia</option>
          <option value="laser">Láser Várices</option>
          <option value="paquete">Paquete</option>
        </select>
        <select value={filterEstado} onChange={e => setFilterEstado(e.target.value as any)}
          className="border border-border rounded-xl px-3 py-2.5 text-sm bg-card focus:outline-none">
          <option value="todos">Todos los estados</option>
          <option value="FIRMADO">Firmado</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="ANULADO">Anulado</option>
        </select>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText size={36} className="mx-auto mb-3 opacity-30" />
          <p className="font-semibold">Sin registros</p>
          <p className="text-sm">No se encontraron consentimientos con los filtros actuales</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <div key={r.id} className={`bg-card rounded-2xl border border-border p-4 flex items-center gap-4 hover:border-[#1A56DB]/30 transition-colors
              ${r.pendienteMedico ? "border-l-4 border-l-amber-400" : ""}`}>
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                {r.tipo === "escleroterapia" ? <Syringe size={17} className="text-[#1A56DB]" />
                : r.tipo === "sueroterapia" ? <Droplets size={17} className="text-[#00B896]" />
                : r.tipo === "laser" ? <Zap size={17} className="text-amber-600" />
                : <Package size={17} className="text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm truncate">{r.pacienteNombre}</p>
                  {r.pendienteMedico && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full">PENDIENTE MÉDICO</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[10px] text-muted-foreground font-mono">{r.radicado}</p>
                  <p className="text-[10px] text-muted-foreground">·</p>
                  <p className="text-[10px] text-muted-foreground">{fmtFecha(r.fecha)}</p>
                  <p className="text-[10px] text-muted-foreground">·</p>
                  <p className="text-[10px] text-muted-foreground">Doc: {r.pacienteDoc}</p>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge estado={r.estado} />
                  <TipoBadge tipo={r.tipo} />
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {r.pendienteMedico && (user.rol === "MÉDICO" || user.rol === "ADMINISTRADOR") && (
                  <button onClick={() => { onMarkReviewed(r.id); addToast("success", `Firma de ${r.pacienteNombre} revisada`); }}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-[10px] font-semibold hover:bg-amber-200 transition-colors">
                    <UserCheck size={11} /> Revisado
                  </button>
                )}
                <button onClick={() => handleWA(r)}
                  className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors" title="WhatsApp">
                  <MessageSquare size={14} />
                </button>
                <button onClick={() => onView(r)}
                  className="p-2 rounded-lg bg-[#1A56DB]/8 text-[#1A56DB] hover:bg-[#1A56DB]/15 transition-colors" title="Ver documento">
                  <Eye size={14} />
                </button>
                {(user.rol === "ADMINISTRADOR" || user.rol === "MÉDICO") && (
                  <button onClick={() => onDelete(r.id)}
                    className="p-2 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-600 transition-colors" title="Anular">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── FORM SELECTOR ────────────────────────────────────────────────────────────
function FormSelector({ tipo, onSave, onCancel, addToast, nextId }: {
  tipo: TipoConsent; onSave: (r: ConsentRecord) => void; onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void; nextId: number;
}) {
  if (tipo === "escleroterapia") return <FormEscleroterapia onSave={onSave} onCancel={onCancel} addToast={addToast} nextId={nextId} />;
  if (tipo === "sueroterapia") return <FormSueroterapia onSave={onSave} onCancel={onCancel} addToast={addToast} nextId={nextId} />;
  if (tipo === "laser") return <FormLaser onSave={onSave} onCancel={onCancel} addToast={addToast} nextId={nextId} />;
  if (tipo === "paquete") return <FormPaquete onSave={onSave} onCancel={onCancel} addToast={addToast} nextId={nextId} />;
  return null;
}

// ─── TIPO SELECTOR PAGE ───────────────────────────────────────────────────────
function TipoSelectorPage({ onSelect }: { onSelect: (t: TipoConsent) => void }) {
  const options = [
    { tipo: "escleroterapia" as TipoConsent, label: "Escleroterapia", sub: "Inyección de Várices Miembros Inferiores", icon: <Syringe size={28} />, color: "border-[#1A56DB] bg-[#1A56DB]/5", iconBg: "bg-[#1A56DB]" },
    { tipo: "sueroterapia" as TipoConsent, label: "Sueroterapia", sub: "Vitamina C y/o Complejo B IV", icon: <Droplets size={28} />, color: "border-[#00B896] bg-[#00B896]/5", iconBg: "bg-[#00B896]" },
    { tipo: "laser" as TipoConsent, label: "Láser Várices", sub: "Terapia ND:YAG Control Venas", icon: <Zap size={28} />, color: "border-amber-400 bg-amber-50", iconBg: "bg-amber-500" },
    { tipo: "paquete" as TipoConsent, label: "Paquete Completo", sub: "Los 3 consentimientos juntos", icon: <Package size={28} />, color: "border-purple-400 bg-purple-50", iconBg: "bg-purple-600" },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Nuevo Consentimiento</h1>
        <p className="text-sm text-muted-foreground">Seleccione el tipo de procedimiento</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {options.map(o => (
          <button key={o.tipo} onClick={() => onSelect(o.tipo)}
            className={`flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] active:scale-95 ${o.color}`}>
            <div className={`w-14 h-14 rounded-2xl ${o.iconBg} flex items-center justify-center text-white flex-shrink-0 shadow-sm`}>
              {o.icon}
            </div>
            <div>
              <p className="font-bold text-foreground text-base">{o.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{o.sub}</p>
            </div>
            <ChevronRight size={18} className="ml-auto text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [page, setPage] = useState<AppPage>("dashboard");
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [activeForm, setActiveForm] = useState<TipoConsent | null>(null);
  const [viewRecord, setViewRecord] = useState<ConsentRecord | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const nextIdRef = useRef(1);

  const addToast = (type: "success" | "error" | "info", msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const handleSave = (r: ConsentRecord) => {
    setRecords(prev => [...prev, r]);
    nextIdRef.current += 1;
    setActiveForm(null);
    setPage("historial");
  };

  const handleDelete = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, estado: "ANULADO" as EstadoConsent, pendienteMedico: false } : r));
    addToast("info", "Consentimiento anulado");
  };

  const handleMarkReviewed = (id: string) => {
    setRecords(prev => prev.map(r => r.id === id ? { ...r, pendienteMedico: false } : r));
  };

  const handleSendEmail = () => {
    if (!viewRecord) return;
    setRecords(prev => prev.map(r => r.id === viewRecord.id ? { ...r, enviado_email: true } : r));
    addToast("success", `Email enviado a ${viewRecord.pacienteNombre}`);
  };

  const handleSendWhatsApp = () => {
    if (!viewRecord) return;
    const msg = encodeURIComponent(`*${IPS.nombre}* — Consentimiento Informado\n\nEstimado/a ${viewRecord.pacienteNombre},\n\nSu consentimiento ha sido registrado.\n\n📋 Radicado: ${viewRecord.radicado}\n📅 Fecha: ${fmtFecha(viewRecord.fecha)}\n✅ Estado: ${viewRecord.estado}\n\n_${IPS.nombre} · NIT ${IPS.nit}_`);
    const tel = viewRecord.pacienteTel.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/57${tel}?text=${msg}`, "_blank");
    setRecords(prev => prev.map(r => r.id === viewRecord.id ? { ...r, enviado_whatsapp: true } : r));
    addToast("info", "Abriendo WhatsApp...");
  };

  if (!user) return <LoginPage onLogin={u => { setUser(u); addToast("success", `Bienvenido, ${u.nombre}`); }} />;

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar
        page={page} onPage={setPage} user={user}
        onLogout={() => { setUser(null); setPage("dashboard"); setRecords([]); addToast("info", "Sesión cerrada"); }}
        records={records} mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      {/* Main */}
      <div className="flex-1 lg:ml-60 min-h-screen flex flex-col">
        {/* Topbar mobile */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-card border-b border-border">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-muted">
            <Menu size={18} />
          </button>
          <p className="font-bold text-sm">Med&Fis</p>
          <div className="flex items-center gap-2">
            {records.filter(r => r.pendienteMedico).length > 0 && (
              <span className="bg-red-500 text-white text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {records.filter(r => r.pendienteMedico).length}
              </span>
            )}
            <div className="w-7 h-7 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xs font-bold">
              {user.nombre.charAt(0)}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full">
          {page === "dashboard" && (
            <DashboardPage records={records} onNewForm={(t) => { setActiveForm(t); setPage("form"); }} user={user} addToast={addToast} />
          )}
          {page === "form" && !activeForm && (
            <TipoSelectorPage onSelect={t => setActiveForm(t)} />
          )}
          {page === "historial" && (
            <HistorialPage records={records} onView={setViewRecord} onDelete={handleDelete} onMarkReviewed={handleMarkReviewed} addToast={addToast} user={user} />
          )}
        </main>
      </div>

      {/* Form modals */}
      {activeForm && (
        <FormSelector tipo={activeForm} onSave={handleSave} onCancel={() => setActiveForm(null)} addToast={addToast} nextId={nextIdRef.current} />
      )}

      {/* PDF modal */}
      {viewRecord && (
        <PDFModal record={viewRecord} onClose={() => setViewRecord(null)} onSendEmail={handleSendEmail} onSendWhatsApp={handleSendWhatsApp} />
      )}

      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
