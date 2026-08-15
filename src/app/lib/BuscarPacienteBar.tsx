import { useState } from "react";
import { Search } from "lucide-react";
import {
  buscarPacienteBasico,
  nombreDesdePaciente,
  pacienteBasicoToDatosConsent,
  type PacienteBasico,
} from "../lib/pacienteLookup";

type ToastFn = (t: "success" | "error" | "info" | "warning", m: string) => void;

export default function BuscarPacienteBar({
  apiService,
  addToast,
  onFound,
  onNotFound,
  tipoDoc,
  documento,
  onTipoDoc,
  onDocumento,
}: {
  apiService: { get: (path: string) => Promise<Response> };
  addToast: ToastFn;
  onFound: (
    datos: ReturnType<typeof pacienteBasicoToDatosConsent>,
    p: PacienteBasico
  ) => void;
  onNotFound: () => void;
  tipoDoc: string;
  documento: string;
  onTipoDoc: (v: string) => void;
  onDocumento: (v: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [hallado, setHallado] = useState<PacienteBasico | null>(null);

  const buscar = async () => {
    setLoading(true);
    setHallado(null);
    try {
      const res = await buscarPacienteBasico(apiService, tipoDoc, documento);
      if (res.ok) {
        setHallado(res.data);
        onFound(pacienteBasicoToDatosConsent(res.data), res.data);
        addToast("success", `Datos básicos: ${nombreDesdePaciente(res.data)}`);
      } else if (res.status === 404) {
        onNotFound();
        addToast("info", "No registrado: complete los datos manualmente");
      } else {
        addToast("error", "Error al buscar paciente");
      }
    } catch {
      addToast("error", "Sin conexión al buscar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 rounded-xl border border-[#0D51D9]/20 bg-[#EFF3FB] space-y-2 mb-4">
      <p className="text-xs font-bold text-[#0D51D9]">
        Buscar paciente (solo datos básicos — no historia clínica)
      </p>
      <div className="flex flex-wrap gap-2">
        <select
          value={tipoDoc}
          onChange={(e) => onTipoDoc(e.target.value)}
          className="px-2 py-2 rounded-lg border text-sm bg-white"
        >
          {["CC", "TI", "CE", "PA", "RC"].map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={documento}
          onChange={(e) => onDocumento(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
          placeholder="Número de documento"
          className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border text-sm"
        />
        <button
          type="button"
          onClick={buscar}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#0D51D9] text-white text-sm font-semibold disabled:opacity-50"
        >
          <Search size={14} /> {loading ? "..." : "Buscar"}
        </button>
      </div>
      {hallado && (
        <p className="text-xs text-emerald-700">
          ✓ {nombreDesdePaciente(hallado)} · {hallado.celular || hallado.telefono || "sin tel"} ·{" "}
          {hallado.email || "sin email"}
        </p>
      )}
    </div>
  );
}