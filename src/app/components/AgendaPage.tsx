import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Plus, X, MessageSquare, Search } from "lucide-react";
import { abrirWhatsApp, WA_CLINICA } from "../lib/whatsapp";

type ToastFn = (t: "success" | "error" | "info" | "warning", m: string) => void;

type CitaItem = {
  id: string;
  pacienteId: string;
  pacienteNombre: string;
  pacienteTipoDoc?: string;
  pacienteDocumento?: string;
  pacienteTelefono?: string;
  pacienteEmail?: string;
  fecha: string;
  hora: string;
  tipoCita: string;
  tratamiento: string;
  descripcion: string;
  observaciones?: string;
  estado: string;
  profesional?: string;
};

type PacienteMini = {
  id: string;
  tipoDoc?: string;
  documento?: string;
  primerNombre?: string;
  segundoNombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  celular?: string;
  telefono?: string;
};

const TIPOS_CITA = ["VALORACION", "CONTROL", "PROCEDIMIENTO", "SEGUIMIENTO", "OTRO"];
const TRATAMIENTOS = [
  "ESCLEROTERAPIA",
  "SUEROTERAPIA",
  "LASER",
  "PAQUETE",
  "CONSULTA_GENERAL",
  "OTRO",
];

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function nombrePac(p: PacienteMini) {
  return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
    .filter(Boolean)
    .join(" ");
}

export default function AgendaPage({
  user,
  apiService,
  addToast,
}: {
  user?: { nombre?: string; rol?: string } | null;
  apiService: {
    get: (path: string) => Promise<Response>;
    post: (path: string, body: unknown) => Promise<Response>;
    patch: (path: string, body?: unknown) => Promise<Response>;
  };
  addToast?: ToastFn;
}) {
  const toast: ToastFn = addToast ?? ((_, m) => console.log(m));
  const [fecha, setFecha] = useState(hoyISO());
  const [citas, setCitas] = useState<CitaItem[]>([]);
  const [recordatorios, setRecordatorios] = useState<CitaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNueva, setShowNueva] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        apiService.get(`/citas?fecha=${fecha}`),
        apiService.get("/citas/recordatorios?dias=1"),
      ]);
      if (r1.ok) setCitas(await r1.json());
      if (r2.ok) setRecordatorios(await r2.json());
    } catch {
      toast("error", "No se pudieron cargar las citas");
    } finally {
      setLoading(false);
    }
  }, [apiService, fecha]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CalendarCheck className="text-[#0D51D9]" size={22} />
          <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
        </div>
        <button
          type="button"
          onClick={() => setShowNueva(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold"
        >
          <Plus size={16} /> Nueva cita
        </button>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500">Día</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={cargar}
          className="text-xs px-2 py-2 border rounded-lg hover:bg-gray-50"
        >
          Actualizar
        </button>
      </div>

      {/* Recordatorios: citas de mañana */}
      {recordatorios.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50">
          <p className="font-bold text-sm text-amber-900 mb-2">
            Recordatorios — citas de mañana ({recordatorios.length})
          </p>
          <ul className="space-y-2">
            {recordatorios.map((c) => (
              <li
                key={c.id}
                className="text-xs bg-white rounded-xl p-3 border flex flex-wrap gap-2 items-center justify-between"
              >
                <div>
                  <p className="font-semibold text-gray-900">
                    {String(c.hora).slice(0, 5)} · {c.pacienteNombre}
                  </p>
                  <p className="text-gray-500">
                    {c.pacienteTipoDoc} {c.pacienteDocumento} · {c.tipoCita} ·{" "}
                    {c.tratamiento}
                  </p>
                  <p className="text-gray-400">{c.descripcion}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="px-2 py-1 rounded-lg bg-[#25D366] text-white text-[10px] font-semibold"
                    onClick={() => {
                      const msg =
                        `*Recordatorio de cita*\nMañana ${c.fecha} a las ${String(c.hora).slice(0, 5)}\n` +
                        `${c.tipoCita} · ${c.tratamiento}\n${c.descripcion || ""}`;
                      if (!abrirWhatsApp(c.pacienteTelefono || "", msg))
                        toast("error", "Sin teléfono del paciente");
                    }}
                  >
                    WA Paciente
                  </button>
                  <button
                    type="button"
                    className="px-2 py-1 rounded-lg bg-[#0D51D9] text-white text-[10px] font-semibold"
                    onClick={() => {
                      const msg =
                        `*Agenda clínica*\nMañana ${c.fecha} ${String(c.hora).slice(0, 5)}\n` +
                        `${c.pacienteNombre} (${c.pacienteTipoDoc} ${c.pacienteDocumento})\n` +
                        `Tel: ${c.pacienteTelefono || "—"}\n${c.tipoCita} · ${c.tratamiento}`;
                      abrirWhatsApp(WA_CLINICA, msg);
                    }}
                  >
                    WA Clínica
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Citas del día */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-bold text-gray-800">
            Citas del {fecha} {loading ? "…" : `(${citas.length})`}
          </p>
        </div>
        {citas.length === 0 && !loading ? (
          <p className="p-6 text-center text-sm text-gray-400">
            No hay citas este día
          </p>
        ) : (
          <ul className="divide-y">
            {citas.map((c) => (
              <li key={c.id} className="p-4 flex flex-wrap gap-2 justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-900">
                    {String(c.hora).slice(0, 5)} · {c.pacienteNombre}
                  </p>
                  <p className="text-xs text-gray-500">
                    {c.pacienteTipoDoc} {c.pacienteDocumento} · Tel:{" "}
                    {c.pacienteTelefono || "—"}
                  </p>
                  <p className="text-xs text-[#0D51D9] font-medium mt-0.5">
                    {c.tipoCita} · {c.tratamiento}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{c.descripcion}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    {c.estado}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showNueva && (
        <NuevaCitaModal
          apiService={apiService}
          toast={toast}
          fechaDefault={fecha}
          profesional={user?.nombre || ""}
          onClose={() => setShowNueva(false)}
          onCreated={() => {
            setShowNueva(false);
            cargar();
          }}
        />
      )}
    </div>
  );
}

function NuevaCitaModal({
  apiService,
  toast,
  fechaDefault,
  profesional,
  onClose,
  onCreated,
}: {
  apiService: {
    get: (path: string) => Promise<Response>;
    post: (path: string, body: unknown) => Promise<Response>;
  };
  toast: ToastFn;
  fechaDefault: string;
  profesional: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [q, setQ] = useState("");
  const [resultados, setResultados] = useState<PacienteMini[]>([]);
  const [paciente, setPaciente] = useState<PacienteMini | null>(null);
  const [fecha, setFecha] = useState(fechaDefault);
  const [hora, setHora] = useState("09:00");
  const [tipoCita, setTipoCita] = useState("VALORACION");
  const [tratamiento, setTratamiento] = useState("ESCLEROTERAPIA");
  const [descripcion, setDescripcion] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);

  const buscarPacientes = async () => {
    if (!q.trim()) return;
    try {
      const r = await apiService.get(`/pacientes?q=${encodeURIComponent(q.trim())}`);
      if (r.ok) setResultados(await r.json());
      else toast("error", "No se pudo buscar pacientes");
    } catch {
      toast("error", "Sin conexión");
    }
  };

  const guardar = async () => {
    if (!paciente?.id) {
      toast("error", "Seleccione un paciente");
      return;
    }
    if (!descripcion.trim()) {
      toast("error", "Indique la descripción / motivo");
      return;
    }
    setSaving(true);
    try {
      const body = {
        pacienteId: paciente.id,
        fecha,
        hora: hora.length === 5 ? hora + ":00" : hora,
        tipoCita,
        tratamiento,
        descripcion: descripcion.trim(),
        observaciones: observaciones.trim() || null,
        estado: "PROGRAMADA",
        profesional: profesional || null,
      };
      const r = await apiService.post("/citas", body);
      if (r.ok) {
        toast("success", "Cita programada y ligada al paciente");
        onCreated();
      } else {
        const err = await r.json().catch(() => ({}));
        toast("error", err.mensaje || `Error ${r.status}`);
      }
    } catch {
      toast("error", "No se pudo guardar la cita");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">Nueva cita</h3>
          <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Buscar paciente = enlace obligatorio */}
        <p className="text-[10px] font-bold text-[#0D51D9] uppercase mb-1">
          Paciente (obligatorio)
        </p>
        {paciente ? (
          <div className="mb-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between gap-2">
            <div>
              <p className="text-sm font-semibold">{nombrePac(paciente)}</p>
              <p className="text-xs text-gray-500">
                {paciente.tipoDoc} {paciente.documento}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-red-600 font-medium"
              onClick={() => setPaciente(null)}
            >
              Cambiar
            </button>
          </div>
        ) : (
          <div className="mb-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), buscarPacientes())}
                placeholder="Nombre o documento"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={buscarPacientes}
                className="px-3 py-2 rounded-lg bg-gray-100"
              >
                <Search size={16} />
              </button>
            </div>
            <ul className="max-h-32 overflow-y-auto border rounded-lg divide-y">
              {resultados.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    onClick={() => {
                      setPaciente(p);
                      setResultados([]);
                      setQ("");
                    }}
                  >
                    {nombrePac(p)} · {p.tipoDoc} {p.documento}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500">Hora</label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500">Tipo</label>
            <select
              value={tipoCita}
              onChange={(e) => setTipoCita(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {TIPOS_CITA.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500">Tratamiento</label>
            <select
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
            >
              {TRATAMIENTOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="text-[10px] font-semibold text-gray-500">
            Descripción / motivo *
          </label>
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="Ej: Control post escleroterapia sesión 2"
          />
        </div>
        <div className="mb-4">
          <label className="text-[10px] font-semibold text-gray-500">Observaciones</label>
          <textarea
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            rows={2}
            className="w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={guardar}
          className="w-full py-2.5 rounded-xl bg-[#0D51D9] text-white font-semibold text-sm disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cita"}
        </button>
      </div>
    </div>
  );
}