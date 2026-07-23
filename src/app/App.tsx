import { useState, useRef, useEffect, useCallback } from "react";
import {
  LayoutDashboard, FileText, Users, Settings, LogOut,
  Plus, Search, Eye, Trash2, Download, Send,
  CheckCircle, Clock, XCircle, Mail, MessageSquare,
  Pen, ChevronRight, ChevronLeft, Bell, Menu, X,
  Calendar, Shield, TrendingUp, FileSignature, UserCheck,
  Activity, Lock, User, Phone, Hash, AlertCircle,
  Printer, RefreshCw, Filter, ChevronDown, Building2,
  Stethoscope, ClipboardList, BarChart3, ArrowUpRight,
  Check, Loader2, Edit3
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

type Rol = "ADMINISTRADOR" | "MÉDICO" | "RECEPCIÓN";
type EstadoConsentimiento = "PENDIENTE" | "FIRMADO" | "ANULADO";
type AppPage =
  | "login"
  | "dashboard"
  | "consentimientos"
  | "nuevo-consentimiento"
  | "firma"
  | "pacientes"
  | "configuracion";

interface UsuarioSistema {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  password: string;
  especialidad?: string;
}

interface Paciente {
  id: string;
  tipo_doc: string;
  documento: string;
  nombres: string;
  apellidos: string;
  fecha_nacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface Consentimiento {
  id: string;
  radicado: string;
  paciente: Paciente;
  tipo: string;
  medico: string;
  fecha: string;
  estado: EstadoConsentimiento;
  procedimiento: string;
  diagnostico: string;
  observaciones: string;
  enviado_email: boolean;
  enviado_whatsapp: boolean;
  firma_url?: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const USUARIOS: UsuarioSistema[] = [
  { id: "1", nombre: "Dr. Carlos Mendoza Ruiz", email: "carlos.mendoza@ips.com", rol: "MÉDICO", password: "medico123", especialidad: "Cirugía General" },
  { id: "2", nombre: "Ana Restrepo Valencia", email: "ana.restrepo@ips.com", rol: "RECEPCIÓN", password: "recepcion123" },
  { id: "3", nombre: "Administrador IPS", email: "admin@ips.com", rol: "ADMINISTRADOR", password: "admin123" },
  { id: "4", nombre: "Dra. Paola Suárez Muñoz", email: "paola.suarez@ips.com", rol: "MÉDICO", password: "medico456", especialidad: "Anestesiología" },
];

const PACIENTES_INIT: Paciente[] = [
  { id: "1", tipo_doc: "CC", documento: "1023456789", nombres: "María Isabel", apellidos: "García Torres", fecha_nacimiento: "1985-03-15", telefono: "3001234567", email: "maria.garcia@gmail.com", direccion: "Cra 45 #23-10, Medellín" },
  { id: "2", tipo_doc: "CC", documento: "1034567890", nombres: "Juan Pablo", apellidos: "Rodríguez Silva", fecha_nacimiento: "1978-07-22", telefono: "3112345678", email: "juan.rodriguez@gmail.com", direccion: "Cll 80 #12-45, Bogotá" },
  { id: "3", tipo_doc: "CC", documento: "1045678901", nombres: "Lucía Fernanda", apellidos: "Martínez Ospina", fecha_nacimiento: "1992-11-08", telefono: "3223456789", email: "lucia.martinez@hotmail.com", direccion: "Av. 6N #34-20, Cali" },
  { id: "4", tipo_doc: "CC", documento: "1056789012", nombres: "Roberto Andrés", apellidos: "López Castro", fecha_nacimiento: "1965-04-30", telefono: "3134567890", email: "roberto.lopez@yahoo.com", direccion: "Cra 15 #64-30, Barranquilla" },
  { id: "5", tipo_doc: "CC", documento: "1067890123", nombres: "Claudia Patricia", apellidos: "Herrera Vargas", fecha_nacimiento: "1990-09-17", telefono: "3245678901", email: "claudia.herrera@gmail.com", direccion: "Cll 50 #40-12, Bucaramanga" },
];

const CONSENTIMIENTOS_INIT: Consentimiento[] = [
  { id: "1", radicado: "CONS-2024-0001", paciente: PACIENTES_INIT[0], tipo: "Procedimiento Quirúrgico", medico: "Dr. Carlos Mendoza Ruiz", fecha: "2024-01-15", estado: "FIRMADO", procedimiento: "Apendicectomía laparoscópica", diagnostico: "Apendicitis aguda no complicada", observaciones: "Paciente en buen estado general, sin contraindicaciones.", enviado_email: true, enviado_whatsapp: true },
  { id: "2", radicado: "CONS-2024-0002", paciente: PACIENTES_INIT[1], tipo: "Anestesia General", medico: "Dra. Paola Suárez Muñoz", fecha: "2024-01-16", estado: "PENDIENTE", procedimiento: "Colonoscopia diagnóstica con biopsia", diagnostico: "Síndrome de intestino irritable", observaciones: "Paciente con antecedente de HTA controlada.", enviado_email: false, enviado_whatsapp: false },
  { id: "3", radicado: "CONS-2024-0003", paciente: PACIENTES_INIT[2], tipo: "Tratamiento Oncológico", medico: "Dr. Carlos Mendoza Ruiz", fecha: "2024-01-17", estado: "FIRMADO", procedimiento: "Quimioterapia — Ciclo 1 de 6", diagnostico: "Carcinoma de mama estadio IIA", observaciones: "Paciente con soporte familiar. Entiende riesgos y beneficios.", enviado_email: true, enviado_whatsapp: false },
  { id: "4", radicado: "CONS-2024-0004", paciente: PACIENTES_INIT[3], tipo: "Procedimiento Quirúrgico", medico: "Dr. Carlos Mendoza Ruiz", fecha: "2024-01-18", estado: "ANULADO", procedimiento: "Hernioplastia inguinal derecha", diagnostico: "Hernia inguinal reductible", observaciones: "Anulado por solicitud del paciente.", enviado_email: true, enviado_whatsapp: true },
  { id: "5", radicado: "CONS-2024-0005", paciente: PACIENTES_INIT[4], tipo: "Diagnóstico por Imágenes", medico: "Dr. Carlos Mendoza Ruiz", fecha: "2024-01-19", estado: "PENDIENTE", procedimiento: "Resonancia magnética cerebral contrastada", diagnostico: "Cefalea crónica a estudio", observaciones: "Pendiente firma del paciente.", enviado_email: false, enviado_whatsapp: false },
];

const TIPOS_CONSENTIMIENTO = [
  "Procedimiento Quirúrgico",
  "Anestesia General",
  "Anestesia Regional",
  "Tratamiento Oncológico",
  "Diagnóstico por Imágenes",
  "Procedimiento Endoscópico",
  "Transfusión Sanguínea",
  "Procedimiento Odontológico",
  "Hospitalización",
  "Traslado",
];

const CHART_MENSUAL = [
  { mes: "Ago", firmados: 28, pendientes: 5 },
  { mes: "Sep", firmados: 34, pendientes: 8 },
  { mes: "Oct", firmados: 31, pendientes: 6 },
  { mes: "Nov", firmados: 42, pendientes: 11 },
  { mes: "Dic", firmados: 38, pendientes: 7 },
  { mes: "Ene", firmados: 45, pendientes: 9 },
];

const CHART_TIPOS = [
  { name: "Quirúrgico", value: 38, color: "#1A56DB" },
  { name: "Anestesia", value: 22, color: "#00B896" },
  { name: "Oncológico", value: 15, color: "#F59E0B" },
  { name: "Imágenes", value: 14, color: "#8B5CF6" },
  { name: "Otros", value: 11, color: "#64748B" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function calcAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

function fmtFecha(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
}

function genRadicado(idx: number) {
  const year = new Date().getFullYear();
  return `CONS-${year}-${String(idx).padStart(4, "0")}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ estado }: { estado: EstadoConsentimiento }) {
  const cfg = {
    FIRMADO: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: <CheckCircle size={11} />, label: "Firmado" },
    PENDIENTE: { bg: "bg-amber-50 text-amber-700 border-amber-200", icon: <Clock size={11} />, label: "Pendiente" },
    ANULADO: { bg: "bg-red-50 text-red-600 border-red-200", icon: <XCircle size={11} />, label: "Anulado" },
  }[estado];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${cfg.bg}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────

interface ToastMsg { id: number; type: "success" | "error" | "info"; msg: string; }

function Toast({ toasts, remove }: { toasts: ToastMsg[]; remove: (id: number) => void }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-medium text-white max-w-xs
            ${t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-red-600" : "bg-[#1A56DB]"}`}>
          {t.type === "success" ? <Check size={15} /> : t.type === "error" ? <XCircle size={15} /> : <Bell size={15} />}
          <span className="flex-1">{t.msg}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100"><X size={13} /></button>
        </div>
      ))}
    </div>
  );
}

// ─── Signature Canvas ─────────────────────────────────────────────────────────

function SignatureCanvas({ onSave, onCancel }: { onSave: (dataUrl: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const src = "touches" in e ? e.touches[0] : e as MouseEvent;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#0C1A35";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      drawing.current = true;
      const pos = getPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      if (!drawing.current) return;
      const pos = getPos(e, canvas);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      setHasDrawn(true);
    };
    const end = () => { drawing.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, []);

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    const canvas = canvasRef.current!;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1A56DB]/10 flex items-center justify-center">
              <Pen size={15} className="text-[#1A56DB]" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Firma del Paciente</p>
              <p className="text-xs text-muted-foreground">Firme en el recuadro a continuación</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>
        <div className="p-5">
          <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-gray-50 touch-none">
            <canvas ref={canvasRef} width={560} height={220} className="w-full cursor-crosshair" style={{ touchAction: "none" }} />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Firme con el mouse o su dedo en pantallas táctiles</p>
          <div className="flex gap-3 mt-4">
            <button onClick={clear} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:bg-muted transition-colors">
              Limpiar
            </button>
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
              Cancelar
            </button>
            <button onClick={save} disabled={!hasDrawn}
              className="flex-1 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Confirmar Firma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PDF Viewer Modal ──────────────────────────────────────────────────────────

function PDFViewer({ consent, onClose }: { consent: Consentimiento; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <FileText size={18} className="text-[#1A56DB]" />
            <div>
              <p className="font-semibold text-sm">{consent.radicado}</p>
              <p className="text-xs text-muted-foreground">{consent.paciente.nombres} {consent.paciente.apellidos}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1A56DB] border border-[#1A56DB]/30 rounded-lg hover:bg-[#1A56DB]/5 transition-colors">
              <Printer size={13} /> Imprimir
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#1A56DB] text-white rounded-lg hover:bg-[#1648bf] transition-colors">
              <Download size={13} /> Descargar PDF
            </button>
            <button onClick={onClose} className="ml-1 text-muted-foreground hover:text-foreground"><X size={18} /></button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 p-8 bg-gray-50">
          <div className="bg-white rounded-xl shadow-sm p-8 max-w-[600px] mx-auto font-['Inter'] text-sm text-foreground">
            {/* Header IPS */}
            <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-[#1A56DB]">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded bg-[#1A56DB] flex items-center justify-center">
                    <Stethoscope size={16} className="text-white" />
                  </div>
                  <span className="font-bold text-[#0C1A35] text-base">IPS SALUD INTEGRAL</span>
                </div>
                <p className="text-xs text-muted-foreground">NIT: 900.123.456-7</p>
                <p className="text-xs text-muted-foreground">Habilitación: 05001000001</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-mono font-medium text-[#1A56DB]">{consent.radicado}</p>
                <p className="text-xs text-muted-foreground mt-1">Fecha: {fmtFecha(consent.fecha)}</p>
                <StatusBadge estado={consent.estado} />
              </div>
            </div>

            <h2 className="text-center font-bold text-base text-[#0C1A35] mb-6 uppercase tracking-wide">
              CONSENTIMIENTO INFORMADO
            </h2>
            <h3 className="text-center font-semibold text-sm text-[#1A56DB] mb-8">{consent.tipo}</h3>

            <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-[#EEF2F8] rounded-lg">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Paciente</p>
                <p className="font-semibold">{consent.paciente.nombres} {consent.paciente.apellidos}</p>
                <p className="text-xs text-muted-foreground">{consent.paciente.tipo_doc}: {consent.paciente.documento}</p>
                <p className="text-xs text-muted-foreground">Edad: {calcAge(consent.paciente.fecha_nacimiento)} años</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Médico Tratante</p>
                <p className="font-semibold">{consent.medico}</p>
                <p className="text-xs text-muted-foreground">Procedimiento: {consent.procedimiento}</p>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Diagnóstico</p>
                <p className="text-sm">{consent.diagnostico}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Descripción del Procedimiento</p>
                <p className="text-sm leading-relaxed">El paciente ha sido informado de manera clara y comprensible sobre el procedimiento <strong>{consent.procedimiento}</strong>, incluyendo su naturaleza, propósito, riesgos potenciales, beneficios esperados y alternativas disponibles. El médico tratante ha resuelto todas las preguntas formuladas por el paciente y/o su acudiente.</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Riesgos y Complicaciones</p>
                <ul className="text-sm space-y-1 pl-4">
                  <li>• Sangrado o hematoma en zona del procedimiento</li>
                  <li>• Infección del sitio operatorio</li>
                  <li>• Reacción a medicamentos anestésicos</li>
                  <li>• Complicaciones relacionadas con condición de base</li>
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Observaciones</p>
                <p className="text-sm">{consent.observaciones}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-dashed border-border">
              <p className="text-xs text-center text-muted-foreground mb-6">
                El paciente o su representante legal declara haber leído y comprendido el presente documento, otorgando libre y voluntariamente su consentimiento para la realización del procedimiento descrito.
              </p>
              {consent.estado === "FIRMADO" ? (
                <div className="grid grid-cols-2 gap-8 mt-4">
                  <div className="text-center">
                    <div className="h-16 border border-dashed border-[#1A56DB]/40 rounded-lg mb-2 bg-[#EEF2F8]/50 flex items-center justify-center">
                      <p className="text-[10px] text-[#1A56DB] italic font-medium">[ Firma Digital Registrada ]</p>
                    </div>
                    <p className="text-[10px] font-semibold">{consent.paciente.nombres} {consent.paciente.apellidos}</p>
                    <p className="text-[10px] text-muted-foreground">{consent.paciente.tipo_doc}: {consent.paciente.documento}</p>
                    <p className="text-[10px] text-muted-foreground">Paciente / Representante Legal</p>
                  </div>
                  <div className="text-center">
                    <div className="h-16 border border-dashed border-[#1A56DB]/40 rounded-lg mb-2 bg-[#EEF2F8]/50 flex items-center justify-center">
                      <p className="text-[10px] text-[#1A56DB] italic font-medium">[ Firma Digital Registrada ]</p>
                    </div>
                    <p className="text-[10px] font-semibold">{consent.medico}</p>
                    <p className="text-[10px] text-muted-foreground">Médico Tratante</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-amber-700 font-medium">Documento pendiente de firma</p>
                </div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-border text-center">
              <p className="text-[10px] text-muted-foreground">Documento generado digitalmente · IPS Salud Integral · {new Date().toLocaleDateString("es-CO")}</p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Hash: SHA256-{consent.id.padEnd(8, "0")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "consentimientos", label: "Consentimientos", icon: FileSignature },
  { id: "pacientes", label: "Pacientes", icon: Users },
  { id: "configuracion", label: "Configuración", icon: Settings },
];

function Sidebar({ page, onNav, user, onLogout, collapsed, onToggle }: {
  page: AppPage; onNav: (p: AppPage) => void;
  user: UsuarioSistema; onLogout: () => void;
  collapsed: boolean; onToggle: () => void;
}) {
  return (
    <aside className={`bg-sidebar flex flex-col h-full transition-all duration-300 ${collapsed ? "w-16" : "w-60"} flex-shrink-0`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-[#1A56DB] flex-shrink-0 flex items-center justify-center">
          <Stethoscope size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-bold text-sm leading-tight">IPS Salud</p>
            <p className="text-sidebar-foreground text-[10px]">Consentimientos</p>
          </div>
        )}
        <button onClick={onToggle} className={`ml-auto text-sidebar-foreground/50 hover:text-white transition-colors ${collapsed ? "mx-auto" : ""}`}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => onNav(item.id as AppPage)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left
                ${active ? "bg-[#1A56DB] text-white" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-white"}`}>
              <Icon size={17} className="flex-shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="flex items-center gap-2 p-2">
            <div className="w-7 h-7 rounded-full bg-[#1A56DB]/40 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              {user.nombre.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{user.nombre.split(" ")[0]} {user.nombre.split(" ")[1] || ""}</p>
              <p className="text-sidebar-foreground text-[10px] truncate">{user.rol}</p>
            </div>
            <button onClick={onLogout} className="text-sidebar-foreground/50 hover:text-red-400 transition-colors" title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button onClick={onLogout} className="w-full flex justify-center text-sidebar-foreground/50 hover:text-red-400 transition-colors p-2" title="Cerrar sesión">
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

function Topbar({ title, user, onMobileMenu }: { title: string; user: UsuarioSistema; onMobileMenu: () => void }) {
  const now = new Date();
  const fecha = now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-5 gap-4 flex-shrink-0">
      <button onClick={onMobileMenu} className="md:hidden text-muted-foreground hover:text-foreground">
        <Menu size={20} />
      </button>
      <div className="flex-1">
        <p className="font-semibold text-foreground text-sm">{title}</p>
        <p className="text-[11px] text-muted-foreground capitalize">{fecha}</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative text-muted-foreground hover:text-foreground">
          <Bell size={18} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1A56DB] rounded-full"></span>
        </button>
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xs font-bold">
            {user.nombre.charAt(0)}
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-medium leading-tight">{user.nombre.split(" ")[0]}</p>
            <p className="text-[10px] text-muted-foreground">{user.rol}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ReactNode; color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-xs font-medium text-emerald-600">
            <ArrowUpRight size={12} />{trend}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1 font-mono">{sub}</p>}
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

function DashboardPage({ consentimientos, onNav }: { consentimientos: Consentimiento[]; onNav: (p: AppPage) => void }) {
  const firmados = consentimientos.filter(c => c.estado === "FIRMADO").length;
  const pendientes = consentimientos.filter(c => c.estado === "PENDIENTE").length;
  const anulados = consentimientos.filter(c => c.estado === "ANULADO").length;
  const recientes = [...consentimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5);

  return (
    <div className="p-5 lg:p-6 space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Consentimientos" value={consentimientos.length} icon={<ClipboardList size={18} className="text-[#1A56DB]" />} color="bg-[#1A56DB]/10" trend="+12%" />
        <StatCard label="Firmados" value={firmados} sub={`${Math.round(firmados / consentimientos.length * 100)}% del total`} icon={<CheckCircle size={18} className="text-emerald-600" />} color="bg-emerald-50" trend="+8%" />
        <StatCard label="Pendientes" value={pendientes} icon={<Clock size={18} className="text-amber-600" />} color="bg-amber-50" />
        <StatCard label="Pacientes Registrados" value={5} icon={<Users size={18} className="text-purple-600" />} color="bg-purple-50" trend="+3%" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-sm">Consentimientos por Mes</p>
              <p className="text-xs text-muted-foreground">Firmados vs Pendientes — últimos 6 meses</p>
            </div>
            <BarChart3 size={16} className="text-muted-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHART_MENSUAL}>
              <defs>
                <linearGradient id="gradFirmados" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradPendientes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F8" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#5A6A85" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#5A6A85" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #EEF2F8" }} />
              <Area type="monotone" dataKey="firmados" stroke="#1A56DB" strokeWidth={2} fill="url(#gradFirmados)" name="Firmados" />
              <Area type="monotone" dataKey="pendientes" stroke="#F59E0B" strokeWidth={2} fill="url(#gradPendientes)" name="Pendientes" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-5 border border-border shadow-sm">
          <p className="font-semibold text-sm mb-1">Por Tipo</p>
          <p className="text-xs text-muted-foreground mb-4">Distribución de consentimientos</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={CHART_TIPOS} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={2}>
                {CHART_TIPOS.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {CHART_TIPOS.map(t => (
              <div key={t.name} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: t.color }}></span>
                  <span className="text-[11px] text-muted-foreground">{t.name}</span>
                </div>
                <span className="text-[11px] font-mono font-medium">{t.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent consents */}
      <div className="bg-white rounded-xl border border-border shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <p className="font-semibold text-sm">Consentimientos Recientes</p>
            <p className="text-xs text-muted-foreground">Últimos {recientes.length} registros</p>
          </div>
          <button onClick={() => onNav("consentimientos")} className="text-xs text-[#1A56DB] font-medium hover:underline flex items-center gap-1">
            Ver todos <ChevronRight size={13} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Radicado", "Paciente", "Procedimiento", "Médico", "Fecha", "Estado"].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recientes.map(c => (
                <tr key={c.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-[#1A56DB] font-medium">{c.radicado}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{c.paciente.nombres} {c.paciente.apellidos}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.paciente.documento}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[160px] truncate">{c.procedimiento}</td>
                  <td className="px-4 py-3 text-xs">{c.medico}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtFecha(c.fecha)}</td>
                  <td className="px-4 py-3"><StatusBadge estado={c.estado} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Nuevo Consentimiento — Multi-step ───────────────────────────────────────

interface NuevoConsentForm {
  tipo: string;
  pacienteId: string;
  procedimiento: string;
  diagnostico: string;
  observaciones: string;
  firma: string;
  nombre_firmante: string;
  doc_firmante: string;
}

function NuevoConsentimientoPage({
  pacientes, user, onSave, onCancel, addToast, nextId
}: {
  pacientes: Paciente[];
  user: UsuarioSistema;
  onSave: (data: NuevoConsentForm) => void;
  onCancel: () => void;
  addToast: (t: "success" | "error" | "info", m: string) => void;
  nextId: number;
}) {
  const [step, setStep] = useState(1);
  const [showSig, setShowSig] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<NuevoConsentForm>({
    tipo: "", pacienteId: "", procedimiento: "", diagnostico: "",
    observaciones: "", firma: "", nombre_firmante: "", doc_firmante: ""
  });

  const selectedPaciente = pacientes.find(p => p.id === form.pacienteId);

  const set = (k: keyof NuevoConsentForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  const canNext1 = form.tipo && form.pacienteId;
  const canNext2 = form.procedimiento && form.diagnostico;
  const canSave = form.firma;

  const handleSend = async () => {
    setSending(true);
    await new Promise(r => setTimeout(r, 1400));
    setSending(false);
    onSave(form);
    addToast("success", "Consentimiento guardado y enviado al paciente");
  };

  const STEPS = ["Paciente y Tipo", "Procedimiento", "Firma y Envío"];

  return (
    <div className="p-5 lg:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onCancel} className="text-muted-foreground hover:text-foreground"><ChevronLeft size={20} /></button>
        <div>
          <h2 className="font-bold text-base">Nuevo Consentimiento Informado</h2>
          <p className="text-xs text-muted-foreground">{genRadicado(nextId)} · {new Date().toLocaleDateString("es-CO")}</p>
        </div>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center flex-1 last:flex-none">
              <div className={`flex items-center gap-2 ${active || done ? "text-[#1A56DB]" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors
                  ${done ? "bg-emerald-500 text-white" : active ? "bg-[#1A56DB] text-white" : "bg-muted text-muted-foreground"}`}>
                  {done ? <Check size={13} /> : n}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${active ? "text-[#1A56DB]" : done ? "text-emerald-600" : "text-muted-foreground"}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-3 ${step > n ? "bg-emerald-400" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6">
        {/* Step 1 */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Tipo de Consentimiento *</label>
              <select value={form.tipo} onChange={e => set("tipo", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]">
                <option value="">Seleccionar tipo...</option>
                {TIPOS_CONSENTIMIENTO.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Paciente *</label>
              <select value={form.pacienteId} onChange={e => set("pacienteId", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]">
                <option value="">Buscar paciente...</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>{p.nombres} {p.apellidos} — {p.tipo_doc}: {p.documento}</option>
                ))}
              </select>
            </div>
            {selectedPaciente && (
              <div className="p-4 bg-[#EEF2F8] rounded-lg grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Paciente</p>
                  <p className="text-sm font-semibold mt-0.5">{selectedPaciente.nombres} {selectedPaciente.apellidos}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedPaciente.tipo_doc}: {selectedPaciente.documento}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Contacto</p>
                  <p className="text-xs mt-0.5 flex items-center gap-1"><Phone size={11} />{selectedPaciente.telefono}</p>
                  <p className="text-xs flex items-center gap-1"><Mail size={11} />{selectedPaciente.email}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Edad</p>
                  <p className="text-xs mt-0.5">{calcAge(selectedPaciente.fecha_nacimiento)} años</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Médico Tratante</p>
                  <p className="text-xs mt-0.5">{user.nombre}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Procedimiento *</label>
              <input type="text" placeholder="Ej: Apendicectomía laparoscópica" value={form.procedimiento}
                onChange={e => set("procedimiento", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Diagnóstico *</label>
              <input type="text" placeholder="CIE-10 o descripción diagnóstica" value={form.diagnostico}
                onChange={e => set("diagnostico", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Observaciones del Médico</label>
              <textarea rows={4} placeholder="Condiciones especiales, antecedentes relevantes, notas adicionales..." value={form.observaciones}
                onChange={e => set("observaciones", e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB] resize-none" />
            </div>
            {/* Resumen */}
            <div className="p-4 bg-[#EEF2F8] rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Resumen del consentimiento</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{form.tipo}</span></div>
                <div><span className="text-muted-foreground">Paciente:</span> <span className="font-medium">{selectedPaciente?.nombres} {selectedPaciente?.apellidos}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3 — Firma */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Nombre del Firmante *</label>
                <input type="text" placeholder="Nombre completo" value={form.nombre_firmante}
                  onChange={e => set("nombre_firmante", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Documento del Firmante *</label>
                <input type="text" placeholder="No. cédula" value={form.doc_firmante}
                  onChange={e => set("doc_firmante", e.target.value)}
                  className="w-full border border-border rounded-lg px-3 py-2.5 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">Firma Digital *</label>
              {form.firma ? (
                <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">Firma registrada correctamente</p>
                      <p className="text-[10px] text-emerald-600">Vista previa disponible</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <img src={form.firma} alt="firma" className="h-12 border border-emerald-200 rounded bg-white" />
                    <button onClick={() => set("firma", "")} className="text-xs text-red-500 hover:underline">Repetir</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowSig(true)}
                  className="w-full border-2 border-dashed border-[#1A56DB]/40 rounded-xl p-6 flex flex-col items-center gap-2 hover:bg-[#1A56DB]/5 transition-colors">
                  <Pen size={24} className="text-[#1A56DB]/60" />
                  <p className="text-sm font-medium text-[#1A56DB]">Abrir panel de firma</p>
                  <p className="text-xs text-muted-foreground">El paciente debe firmar digitalmente el documento</p>
                </button>
              )}
            </div>

            {/* Envío */}
            <div className="border border-border rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Canales de Envío</p>
              <div className="flex gap-3">
                <div className="flex-1 flex items-center gap-3 p-3 bg-[#EEF2F8] rounded-lg">
                  <Mail size={16} className="text-[#1A56DB]" />
                  <div>
                    <p className="text-xs font-medium">Email</p>
                    <p className="text-[10px] text-muted-foreground">{selectedPaciente?.email}</p>
                  </div>
                  <CheckCircle size={14} className="ml-auto text-emerald-500" />
                </div>
                <div className="flex-1 flex items-center gap-3 p-3 bg-[#EEF2F8] rounded-lg">
                  <MessageSquare size={16} className="text-emerald-600" />
                  <div>
                    <p className="text-xs font-medium">WhatsApp</p>
                    <p className="text-[10px] text-muted-foreground">{selectedPaciente?.telefono}</p>
                  </div>
                  <CheckCircle size={14} className="ml-auto text-emerald-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-6 pt-5 border-t border-border">
          <button onClick={step > 1 ? () => setStep(s => s - 1) : onCancel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors">
            <ChevronLeft size={15} />{step === 1 ? "Cancelar" : "Anterior"}
          </button>
          {step < 3 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 1 ? !canNext1 : !canNext2}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              Siguiente <ChevronRight size={15} />
            </button>
          ) : (
            <button onClick={handleSend} disabled={!canSave || sending}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              {sending ? <><Loader2 size={15} className="animate-spin" />Guardando...</> : <><Send size={15} />Guardar y Enviar</>}
            </button>
          )}
        </div>
      </div>

      {showSig && <SignatureCanvas onSave={sig => { set("firma", sig); setShowSig(false); }} onCancel={() => setShowSig(false)} />}
    </div>
  );
}

// ─── Consentimientos Page ─────────────────────────────────────────────────────

function ConsentimientosPage({
  consentimientos, onNuevo, onDelete, addToast
}: {
  consentimientos: Consentimiento[];
  onNuevo: () => void;
  onDelete: (id: string) => void;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState<string>("TODOS");
  const [viewCons, setViewCons] = useState<Consentimiento | null>(null);
  const [pdfCons, setPdfCons] = useState<Consentimiento | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = consentimientos.filter(c => {
    const q = search.toLowerCase();
    const matchQ = !q || c.radicado.toLowerCase().includes(q)
      || c.paciente.nombres.toLowerCase().includes(q)
      || c.paciente.apellidos.toLowerCase().includes(q)
      || c.paciente.documento.includes(q)
      || c.procedimiento.toLowerCase().includes(q);
    const matchE = filterEstado === "TODOS" || c.estado === filterEstado;
    return matchQ && matchE;
  });

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await new Promise(r => setTimeout(r, 800));
    onDelete(id);
    setDeleting(null);
    addToast("success", "Consentimiento anulado correctamente");
  };

  const handleSend = async (c: Consentimiento) => {
    addToast("info", `Enviando a ${c.paciente.email} y ${c.paciente.telefono}...`);
    await new Promise(r => setTimeout(r, 1200));
    addToast("success", "Consentimiento enviado por email y WhatsApp");
  };

  return (
    <div className="p-5 lg:p-6 space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por radicado, paciente, documento..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
        </div>
        <div className="flex gap-2">
          <select value={filterEstado} onChange={e => setFilterEstado(e.target.value)}
            className="px-3 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
            <option value="TODOS">Todos los estados</option>
            <option value="FIRMADO">Firmados</option>
            <option value="PENDIENTE">Pendientes</option>
            <option value="ANULADO">Anulados</option>
          </select>
          <button onClick={onNuevo}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56DB] text-white text-sm font-medium rounded-lg hover:bg-[#1648bf] transition-colors whitespace-nowrap">
            <Plus size={15} />Nuevo
          </button>
        </div>
      </div>

      {/* Stats mini */}
      <div className="flex gap-3 flex-wrap">
        {(["TODOS", "FIRMADO", "PENDIENTE", "ANULADO"] as const).map(e => {
          const count = e === "TODOS" ? consentimientos.length : consentimientos.filter(c => c.estado === e).length;
          const color = e === "FIRMADO" ? "text-emerald-600 bg-emerald-50 border-emerald-200" : e === "PENDIENTE" ? "text-amber-600 bg-amber-50 border-amber-200" : e === "ANULADO" ? "text-red-600 bg-red-50 border-red-200" : "text-[#1A56DB] bg-[#1A56DB]/5 border-[#1A56DB]/20";
          return (
            <button key={e} onClick={() => setFilterEstado(e)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${filterEstado === e ? color : "text-muted-foreground bg-white border-border hover:border-[#1A56DB]/30"}`}>
              {e === "TODOS" ? "Todos" : e.charAt(0) + e.slice(1).toLowerCase()} · {count}
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Radicado", "Paciente", "Tipo / Procedimiento", "Médico", "Fecha", "Estado", "Envíos", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                  <FileText size={32} className="mx-auto mb-2 opacity-30" />
                  No se encontraron consentimientos
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-[#1A56DB] whitespace-nowrap">{c.radicado}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs whitespace-nowrap">{c.paciente.nombres} {c.paciente.apellidos}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{c.paciente.tipo_doc} {c.paciente.documento}</p>
                  </td>
                  <td className="px-4 py-3 max-w-[180px]">
                    <p className="text-xs font-medium text-muted-foreground">{c.tipo}</p>
                    <p className="text-xs truncate">{c.procedimiento}</p>
                  </td>
                  <td className="px-4 py-3 text-xs whitespace-nowrap">{c.medico}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{fmtFecha(c.fecha)}</td>
                  <td className="px-4 py-3"><StatusBadge estado={c.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span title="Email" className={`text-xs ${c.enviado_email ? "text-emerald-500" : "text-muted-foreground/40"}`}><Mail size={13} /></span>
                      <span title="WhatsApp" className={`text-xs ${c.enviado_whatsapp ? "text-emerald-500" : "text-muted-foreground/40"}`}><MessageSquare size={13} /></span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setViewCons(c)} title="Ver detalle"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-[#1A56DB] hover:bg-[#1A56DB]/5 transition-colors">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => setPdfCons(c)} title="Ver PDF"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-[#1A56DB] hover:bg-[#1A56DB]/5 transition-colors">
                        <FileText size={14} />
                      </button>
                      <button onClick={() => handleSend(c)} title="Reenviar"
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                        <Send size={14} />
                      </button>
                      {c.estado !== "ANULADO" && (
                        <button onClick={() => handleDelete(c.id)} title="Anular" disabled={deleting === c.id}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40">
                          {deleting === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground">{filtered.length} de {consentimientos.length} registros</p>
        </div>
      </div>

      {/* Detail modal */}
      {viewCons && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <p className="font-bold text-sm">{viewCons.radicado}</p>
                <StatusBadge estado={viewCons.estado} />
              </div>
              <button onClick={() => setViewCons(null)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="overflow-y-auto p-5 space-y-5">
              <Section title="Paciente">
                <Grid2>
                  <Field label="Nombre completo" value={`${viewCons.paciente.nombres} ${viewCons.paciente.apellidos}`} />
                  <Field label="Documento" value={`${viewCons.paciente.tipo_doc}: ${viewCons.paciente.documento}`} mono />
                  <Field label="Email" value={viewCons.paciente.email} />
                  <Field label="Teléfono" value={viewCons.paciente.telefono} mono />
                </Grid2>
              </Section>
              <Section title="Procedimiento">
                <Grid2>
                  <Field label="Tipo" value={viewCons.tipo} />
                  <Field label="Médico" value={viewCons.medico} />
                  <Field label="Procedimiento" value={viewCons.procedimiento} />
                  <Field label="Diagnóstico" value={viewCons.diagnostico} />
                </Grid2>
                {viewCons.observaciones && <Field label="Observaciones" value={viewCons.observaciones} />}
              </Section>
              <Section title="Notificaciones">
                <div className="flex gap-3">
                  <div className={`flex-1 flex items-center gap-2 p-3 rounded-lg ${viewCons.enviado_email ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    <Mail size={14} /><span className="text-xs font-medium">Email {viewCons.enviado_email ? "enviado" : "pendiente"}</span>
                  </div>
                  <div className={`flex-1 flex items-center gap-2 p-3 rounded-lg ${viewCons.enviado_whatsapp ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                    <MessageSquare size={14} /><span className="text-xs font-medium">WhatsApp {viewCons.enviado_whatsapp ? "enviado" : "pendiente"}</span>
                  </div>
                </div>
              </Section>
            </div>
            <div className="p-4 border-t border-border flex gap-2">
              <button onClick={() => { setPdfCons(viewCons); setViewCons(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf]">
                <FileText size={14} />Ver PDF
              </button>
              <button onClick={() => setViewCons(null)}
                className="px-4 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {pdfCons && <PDFViewer consent={pdfCons} onClose={() => setPdfCons(null)} />}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-background rounded-lg px-3 py-2.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
      <p className={`text-xs font-medium mt-0.5 ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
    </div>
  );
}

// ─── Pacientes Page ───────────────────────────────────────────────────────────

function PacientesPage({ pacientes, onAdd, onDelete, addToast }: {
  pacientes: Paciente[];
  onAdd: (p: Omit<Paciente, "id">) => void;
  onDelete: (id: string) => void;
  addToast: (t: "success" | "error" | "info", m: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ tipo_doc: "CC", documento: "", nombres: "", apellidos: "", fecha_nacimiento: "", telefono: "", email: "", direccion: "" });

  const filtered = pacientes.filter(p => {
    const q = search.toLowerCase();
    return !q || p.nombres.toLowerCase().includes(q) || p.apellidos.toLowerCase().includes(q) || p.documento.includes(q) || p.email.toLowerCase().includes(q);
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 800));
    onAdd(form as Omit<Paciente, "id">);
    setSaving(false);
    setShowModal(false);
    setForm({ tipo_doc: "CC", documento: "", nombres: "", apellidos: "", fecha_nacimiento: "", telefono: "", email: "", direccion: "" });
    addToast("success", "Paciente registrado correctamente");
  };

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="p-5 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56DB] text-white text-sm font-medium rounded-lg hover:bg-[#1648bf] transition-colors whitespace-nowrap">
          <Plus size={15} />Nuevo Paciente
        </button>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background border-b border-border">
                {["Documento", "Nombre Completo", "Edad", "Teléfono", "Email", "Dirección", "Acciones"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-background/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-[10px] bg-[#1A56DB]/10 text-[#1A56DB] px-1.5 py-0.5 rounded font-mono font-medium">{p.tipo_doc}</span>
                    <span className="text-xs font-mono ml-1">{p.documento}</span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{p.nombres} {p.apellidos}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{calcAge(p.fecha_nacimiento)} años</td>
                  <td className="px-4 py-3 text-xs font-mono">{p.telefono}</td>
                  <td className="px-4 py-3 text-xs">{p.email}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[140px] truncate">{p.direccion}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button title="Eliminar" onClick={() => { onDelete(p.id); addToast("success", "Paciente eliminado"); }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground">{filtered.length} pacientes registrados</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-[150] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <p className="font-bold text-sm">Nuevo Paciente</p>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-muted-foreground" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Tipo Doc.</label>
                  <select value={form.tipo_doc} onChange={e => sf("tipo_doc", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30">
                    {["CC", "TI", "CE", "PA", "RC"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">No. Documento *</label>
                  <input value={form.documento} onChange={e => sf("documento", e.target.value)} placeholder="1023456789"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombres *</label>
                  <input value={form.nombres} onChange={e => sf("nombres", e.target.value)} placeholder="María Isabel"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Apellidos *</label>
                  <input value={form.apellidos} onChange={e => sf("apellidos", e.target.value)} placeholder="García Torres"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Fecha Nacimiento</label>
                  <input type="date" value={form.fecha_nacimiento} onChange={e => sf("fecha_nacimiento", e.target.value)}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Teléfono</label>
                  <input value={form.telefono} onChange={e => sf("telefono", e.target.value)} placeholder="3001234567"
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => sf("email", e.target.value)} placeholder="paciente@email.com"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Dirección</label>
                <input value={form.direccion} onChange={e => sf("direccion", e.target.value)} placeholder="Cra 45 #23-10, Medellín"
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!form.documento || !form.nombres || !form.apellidos || saving}
                className="flex-1 py-2.5 rounded-lg bg-[#1A56DB] text-white text-sm font-medium hover:bg-[#1648bf] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={14} className="animate-spin" />Guardando...</> : "Registrar Paciente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Configuracion Page ───────────────────────────────────────────────────────

function ConfiguracionPage({ user }: { user: UsuarioSistema }) {
  return (
    <div className="p-5 lg:p-6 max-w-2xl space-y-5">
      <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-5">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-3">Perfil de Usuario</p>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-full bg-[#1A56DB] flex items-center justify-center text-white text-xl font-bold">{user.nombre.charAt(0)}</div>
            <div>
              <p className="font-bold">{user.nombre}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <span className="inline-block mt-1 text-[10px] px-2 py-0.5 bg-[#1A56DB]/10 text-[#1A56DB] rounded font-medium">{user.rol}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nombre</label>
              <input defaultValue={user.nombre} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
              <input defaultValue={user.email} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Configuración IPS</p>
        <div className="grid grid-cols-2 gap-3">
          {[["Nombre IPS", "IPS Salud Integral S.A.S."], ["NIT", "900.123.456-7"], ["Habilitación", "05001000001"], ["Ciudad", "Medellín, Antioquia"], ["Dirección", "Cll 49 #65-182"], ["Teléfono", "(604) 444-5566"]].map(([l, v]) => (
            <div key={l}>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">{l}</label>
              <input defaultValue={v} className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Notificaciones</p>
        <div className="space-y-3">
          {[["Enviar PDF por email al paciente", true], ["Enviar PDF por WhatsApp al paciente", true], ["Notificar al médico por email", true], ["Copia al administrador", false]].map(([label, def]) => (
            <div key={label as string} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <p className="text-sm">{label as string}</p>
              <button className={`w-10 h-5 rounded-full transition-colors ${def ? "bg-[#1A56DB]" : "bg-muted"} flex items-center px-0.5`}>
                <span className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${def ? "translate-x-5" : "translate-x-0"}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-border shadow-sm p-6 space-y-4">
        <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Seguridad</p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Contraseña actual</label>
            <input type="password" placeholder="••••••••" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Nueva contraseña</label>
              <input type="password" placeholder="••••••••" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Confirmar</label>
              <input type="password" placeholder="••••••••" className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30" />
            </div>
          </div>
        </div>
      </div>

      <button className="px-5 py-2.5 bg-[#1A56DB] text-white text-sm font-medium rounded-lg hover:bg-[#1648bf] transition-colors">
        Guardar Cambios
      </button>
    </div>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (u: UsuarioSistema) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const user = USUARIOS.find(u => u.email === email && u.password === password);
    if (user) {
      onLogin(user);
    } else {
      setError("Credenciales incorrectas. Verifique su email y contraseña.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0C1A35] via-[#102043] to-[#0C2F5A] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1A56DB] mb-4 shadow-lg">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">IPS Salud Integral</h1>
          <p className="text-[#8BA5C8] text-sm mt-1">Sistema de Consentimientos Informados</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="font-bold text-base text-foreground mb-1">Iniciar Sesión</h2>
          <p className="text-xs text-muted-foreground mb-6">Ingrese con sus credenciales institucionales</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email institucional</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@ips.com"
                  className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-border rounded-lg text-sm bg-input-background focus:outline-none focus:ring-2 focus:ring-[#1A56DB]/30 focus:border-[#1A56DB]" />
                <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <Eye size={14} />
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle size={13} className="flex-shrink-0" />{error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-[#1A56DB] text-white font-semibold rounded-lg hover:bg-[#1648bf] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={16} className="animate-spin" />Verificando...</> : "Ingresar al Sistema"}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-6 p-3 bg-background rounded-lg border border-border">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Usuarios de prueba</p>
            <div className="space-y-1">
              {USUARIOS.map(u => (
                <button key={u.id} type="button" onClick={() => { setEmail(u.email); setPassword(u.password); }}
                  className="w-full text-left px-2 py-1 rounded hover:bg-muted transition-colors">
                  <span className="text-xs text-foreground font-medium">{u.email}</span>
                  <span className="text-[10px] text-muted-foreground ml-2">({u.rol})</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[#8BA5C8] text-xs mt-5">
          © {new Date().getFullYear()} IPS Salud Integral · Versión 1.0.0 · Spring Boot + React
        </p>
      </div>
    </div>
  );
}

// ─── Page Titles ──────────────────────────────────────────────────────────────

const PAGE_TITLES: Record<AppPage, string> = {
  login: "Login",
  dashboard: "Dashboard",
  consentimientos: "Consentimientos Informados",
  "nuevo-consentimiento": "Nuevo Consentimiento",
  firma: "Firma Digital",
  pacientes: "Gestión de Pacientes",
  configuracion: "Configuración",
};

// ─── Root App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [currentUser, setCurrentUser] = useState<UsuarioSistema | null>(null);
  const [page, setPage] = useState<AppPage>("login");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>(PACIENTES_INIT);
  const [consentimientos, setConsentimientos] = useState<Consentimiento[]>(CONSENTIMIENTOS_INIT);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", msg: string) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const handleLogin = (user: UsuarioSistema) => {
    setCurrentUser(user);
    setPage("dashboard");
    addToast("success", `Bienvenido, ${user.nombre.split(" ")[0]}`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setPage("login");
  };

  const handleSaveConsent = (data: NuevoConsentForm) => {
    const paciente = pacientes.find(p => p.id === data.pacienteId)!;
    const newC: Consentimiento = {
      id: String(consentimientos.length + 1),
      radicado: genRadicado(consentimientos.length + 1),
      paciente,
      tipo: data.tipo,
      medico: currentUser?.nombre || "",
      fecha: new Date().toISOString().split("T")[0],
      estado: data.firma ? "FIRMADO" : "PENDIENTE",
      procedimiento: data.procedimiento,
      diagnostico: data.diagnostico,
      observaciones: data.observaciones,
      enviado_email: true,
      enviado_whatsapp: true,
      firma_url: data.firma,
    };
    setConsentimientos(prev => [newC, ...prev]);
    setPage("consentimientos");
  };

  const handleDeleteConsent = (id: string) => {
    setConsentimientos(prev => prev.map(c => c.id === id ? { ...c, estado: "ANULADO" as const } : c));
  };

  const handleAddPaciente = (data: Omit<Paciente, "id">) => {
    setPacientes(prev => [...prev, { ...data, id: String(prev.length + 1) }]);
  };

  const handleDeletePaciente = (id: string) => {
    setPacientes(prev => prev.filter(p => p.id !== id));
  };

  // Login screen
  if (!currentUser) return (
    <>
      <LoginPage onLogin={handleLogin} />
      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden font-['Inter']">
      {/* Mobile overlay */}
      {mobileSidebar && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileSidebar(false)} />
      )}

      {/* Sidebar — desktop always visible, mobile as drawer */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto flex-shrink-0
        transition-transform duration-300
        ${mobileSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <Sidebar
          page={page}
          onNav={p => { setPage(p); setMobileSidebar(false); }}
          user={currentUser}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(s => !s)}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar title={PAGE_TITLES[page]} user={currentUser} onMobileMenu={() => setMobileSidebar(true)} />
        <main className="flex-1 overflow-y-auto">
          {page === "dashboard" && (
            <DashboardPage consentimientos={consentimientos} onNav={setPage} />
          )}
          {page === "consentimientos" && (
            <ConsentimientosPage
              consentimientos={consentimientos}
              onNuevo={() => setPage("nuevo-consentimiento")}
              onDelete={handleDeleteConsent}
              addToast={addToast}
            />
          )}
          {page === "nuevo-consentimiento" && (
            <NuevoConsentimientoPage
              pacientes={pacientes}
              user={currentUser}
              onSave={handleSaveConsent}
              onCancel={() => setPage("consentimientos")}
              addToast={addToast}
              nextId={consentimientos.length + 1}
            />
          )}
          {page === "pacientes" && (
            <PacientesPage
              pacientes={pacientes}
              onAdd={handleAddPaciente}
              onDelete={handleDeletePaciente}
              addToast={addToast}
            />
          )}
          {page === "configuracion" && (
            <ConfiguracionPage user={currentUser} />
          )}
        </main>
      </div>

      <Toast toasts={toasts} remove={id => setToasts(t => t.filter(x => x.id !== id))} />
    </div>
  );
}
