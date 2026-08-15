import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Plus, Search, User, X, ChevronLeft, Download, Upload, CalendarCheck, Eye} from "lucide-react";
import * as XLSX from "xlsx";

type ToastFn = (t: "success" | "error" | "info" | "warning", m: string) => void;

interface ApiService {
  get: (path: string) => Promise<Response>;
  post: (path: string, body: unknown) => Promise<Response>;
  put: (path: string, body: unknown) => Promise<Response>;
  delete: (path: string) => Promise<Response>;
}

interface UsuarioMini {
  rol: string;
  nombre?: string;
}

export interface Paciente {
  id?: string;
  tipoDoc: string;
  documento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  numeroCarnet?: string;
  sexo?: string;
  identidadGenero?: string;
  etnia?: string;
  estadoCivil?: string;
  grupoSanguineo?: string;
  habeasData?: boolean;
  raza?: string;
  tipoDiscapacidad?: string;
  religion?: string;
  fechaIngreso?: string;
  entidad?: string;
  tipoAseguramiento?: string;
  eps?: string;
  tipoPaciente?: string;
  telefono1?: string;
  extension1?: string;
  telefono2?: string;
  extension2?: string;
  celular?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  pais?: string;
  codigoDepartamento?: string;
  departamento?: string;
  codigoMunicipio?: string;
  municipio?: string;
  fechaNacimiento?: string;
  horaNacimiento?: string;
  lugarNacimiento?: string;
  escolaridad?: string;
  ocupacion?: string;
  codigoSiras?: string;
  observaciones?: string;
  idMedico?: string;
  medico?: string;
  estadoPaciente?: string;
  voluntadAnticipada?: string;
  fechaVoluntadAnticipada?: string;
  codigoPrestadorVoluntad?: string;
  oposicionDonacion?: string;
  fechaOposicionDonacion?: string;
  alergias?: string;
  antecedentesPersonales?: string;
  antecedentesFamiliares?: string;
  medicamentosActuales?: string;
  contactoNombre?: string;
  contactoParentesco?: string;
  contactoTelefono?: string;
  activo?: boolean;
}

type CitaItem = {
  id: string;
  pacienteId?: string;
  fecha: string;
  hora: string;
  tipoCita: string;
  tratamiento: string;
  descripcion: string;
  observaciones?: string;
  estado: string;
  profesional?: string;
};

type DetalleTab = "datos" | "citas";

const EMPTY_FORM: Paciente = {
  tipoDoc: "CC",
  documento: "",
  primerNombre: "",
  segundoNombre: "",
  primerApellido: "",
  segundoApellido: "",
  sexo: "F",
  identidadGenero: "Femenino",
  etnia: "Ninguna de las anteriores",
  habeasData: false,
  fechaNacimiento: "",
  celular: "",
  telefono: "",
  email: "",
  direccion: "",
  pais: "Colombia",
  departamento: "Antioquia",
  municipio: "Medellín",
  entidad: "PARTICULAR",
  tipoAseguramiento: "Particular",
  tipoPaciente: "Particular",
  eps: "",
  estadoCivil: "",
  escolaridad: "",
  ocupacion: "",
  grupoSanguineo: "",
  estadoPaciente: "Activo",
  voluntadAnticipada: "No",
  oposicionDonacion: "No",
  alergias: "Ninguna conocida",
  antecedentesPersonales: "Ninguno",
  antecedentesFamiliares: "Ninguno",
  medicamentosActuales: "Ninguno",
  contactoNombre: "",
  contactoParentesco: "",
  contactoTelefono: "",
};
const OPCIONES = {
  tipoDoc: ["CC", "TI", "CE", "PA", "RC", "NIT", "OTRO"],
  sexo: ["F", "M", "I"],
  identidadGenero: ["Femenino", "Masculino", "Transgénero", "No binario", "Otro", "No informa"],
  etnia: [
    "Ninguna de las anteriores",
    "Indígena",
    "ROM (Gitano)",
    "Raizal",
    "Palenquero",
    "Negro(a)",
    "Afrocolombiano(a)",
  ],
  estadoCivil: ["Soltero(a)", "Casado(a)", "Unión libre", "Separado(a)", "Divorciado(a)", "Viudo(a)"],
  grupoSanguineo: ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"],
  entidad: ["PARTICULAR", "EPS", "ARL", "SOAT", "Otro"],
  tipoAseguramiento: ["Particular", "Contributivo", "Subsidiado", "Especial"],
  tipoPaciente: ["Particular", "Contributivo", "Subsidiado", "Especial", "Vinculado"],
  escolaridad: ["Ninguna", "Primaria", "Secundaria", "Técnico", "Tecnólogo", "Universitario", "Posgrado"],
  estadoPaciente: ["Activo", "Inactivo"],
  siNo: ["Si", "No"],
  parentesco: ["Cónyuge", "Madre", "Padre", "Hijo/a", "Hermano/a", "Amigo/a", "Otro"],
};

const EXCEL_HEADERS: { header: string; key: keyof Paciente | "id" }[] = [
  { header: "Id Paciente", key: "id" },
  { header: "Tipo Id", key: "tipoDoc" },
  { header: "Primer nombre", key: "primerNombre" },
  { header: "Segundo nombre", key: "segundoNombre" },
  { header: "Primer apellido", key: "primerApellido" },
  { header: "Segundo apellido", key: "segundoApellido" },
  { header: "Número carnet", key: "numeroCarnet" },
  { header: "Sexo", key: "sexo" },
  { header: "Identidad de género", key: "identidadGenero" },
  { header: "Etnia", key: "etnia" },
  { header: "Estado Civil", key: "estadoCivil" },
  { header: "Tipo sangre", key: "grupoSanguineo" },
  { header: "Habeas Data", key: "habeasData" },
  { header: "Raza", key: "raza" },
  { header: "Tipo discapacidad", key: "tipoDiscapacidad" },
  { header: "Religión", key: "religion" },
  { header: "Fecha Ingreso", key: "fechaIngreso" },
  { header: "Entidad", key: "entidad" },
  { header: "Tipo de Aseguramiento", key: "tipoAseguramiento" },
  { header: "EPS", key: "eps" },
  { header: "Tipo de Paciente", key: "tipoPaciente" },
  { header: "Telefono1", key: "telefono1" },
  { header: "Extensión1", key: "extension1" },
  { header: "Telefono2", key: "telefono2" },
  { header: "Extensión2", key: "extension2" },
  { header: "Celular", key: "celular" },
  { header: "Email", key: "email" },
  { header: "Dirección", key: "direccion" },
  { header: "País", key: "pais" },
  { header: "Código Departamento", key: "codigoDepartamento" },
  { header: "Departamento", key: "departamento" },
  { header: "Código Municipio", key: "codigoMunicipio" },
  { header: "Municipio", key: "municipio" },
  { header: "Fecha Nacimiento", key: "fechaNacimiento" },
  { header: "Hora Nacimiento", key: "horaNacimiento" },
  { header: "Lugar nacimiento", key: "lugarNacimiento" },
  { header: "Escolaridad", key: "escolaridad" },
  { header: "Ocupación", key: "ocupacion" },
  { header: "Código Siras", key: "codigoSiras" },
  { header: "Observaciones", key: "observaciones" },
  { header: "Id Médico", key: "idMedico" },
  { header: "Médico", key: "medico" },
  { header: "Estado Paciente", key: "estadoPaciente" },
  { header: "Documento de voluntad anticipada", key: "voluntadAnticipada" },
  {
    header: "Fecha de suscripción o modificación del documento voluntad anticipada",
    key: "fechaVoluntadAnticipada",
  },
  {
    header: "Código del prestador donde se encuentra el documento voluntad anticipada",
    key: "codigoPrestadorVoluntad",
  },
  {
    header: "Manifestación oposición presunción legal de donación",
    key: "oposicionDonacion",
  },
  {
    header: "Fecha en que se suscribe el documento ante el INS o la EPS",
    key: "fechaOposicionDonacion",
  },
  { header: "Alergias", key: "alergias" },
  { header: "Antecedentes personales", key: "antecedentesPersonales" },
  { header: "Antecedentes familiares", key: "antecedentesFamiliares" },
  { header: "Medicamentos actuales", key: "medicamentosActuales" },
  { header: "Contacto nombre", key: "contactoNombre" },
  { header: "Contacto parentesco", key: "contactoParentesco" },
  { header: "Contacto telefono", key: "contactoTelefono" },
];

function nombreCompleto(p: Paciente) {
  return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
    .filter(Boolean)
    .join(" ");
}

function cellStr(v: unknown): string {
  if (v == null || v === "") return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number" && v > 20000 && v < 60000) {
    try {
      const d = XLSX.SSF.parse_date_code(v);
      if (d) {
        return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
      }
    } catch {
      /* ignore */
    }
  }
  return String(v).trim();
}

function parseHabeas(v: unknown): boolean {
  const s = cellStr(v).toUpperCase();
  return s === "SI" || s === "SÍ" || s === "TRUE" || s === "1" || s === "YES";
}

function rowToPaciente(row: Record<string, unknown>): Paciente | null {
  const get = (header: string) => {
    const key = Object.keys(row).find(
      (k) => k.trim().toLowerCase() === header.trim().toLowerCase()
    );
    return key != null ? row[key] : undefined;
  };

  const tipoDoc = cellStr(get("Tipo Id")) || "CC";

  // Plantilla cliente: documento = Id Paciente (u otras variantes)
  const documentoFinal =
    cellStr(get("Id Paciente")) ||
    cellStr(get("Número documento")) ||
    cellStr(get("Documento")) ||
    cellStr(get("Nro Documento")) ||
    cellStr(get("Identificación"));

  const primerNombre = cellStr(get("Primer nombre"));
  const primerApellido = cellStr(get("Primer apellido"));

  if (!documentoFinal && !primerNombre) return null;

  const celular = cellStr(get("Celular"));
  const tel1 = cellStr(get("Telefono1"));

  return {
    tipoDoc,
    documento: documentoFinal || `TEMP-${Date.now()}`,
    primerNombre: primerNombre || "SIN",
    segundoNombre: cellStr(get("Segundo nombre")) || undefined,
    primerApellido: primerApellido || "NOMBRE",
    segundoApellido: cellStr(get("Segundo apellido")) || undefined,
    numeroCarnet: cellStr(get("Número carnet")) || undefined,
    sexo: cellStr(get("Sexo")) || undefined,
    identidadGenero: cellStr(get("Identidad de género")) || undefined,
    etnia: cellStr(get("Etnia")) || "Ninguna de las anteriores",
    estadoCivil: cellStr(get("Estado Civil")) || undefined,
    grupoSanguineo: cellStr(get("Tipo sangre")) || undefined,
    habeasData: parseHabeas(get("Habeas Data")),
    raza: cellStr(get("Raza")) || undefined,
    tipoDiscapacidad: cellStr(get("Tipo discapacidad")) || undefined,
    religion: cellStr(get("Religión")) || undefined,
    fechaIngreso: cellStr(get("Fecha Ingreso")) || undefined,
    entidad: cellStr(get("Entidad")) || "PARTICULAR",
    tipoAseguramiento: cellStr(get("Tipo de Aseguramiento")) || "Particular",
    eps: cellStr(get("EPS")) || undefined,
    tipoPaciente: cellStr(get("Tipo de Paciente")) || "Particular",
    telefono1: tel1 || undefined,
    extension1: cellStr(get("Extensión1")) || undefined,
    telefono2: cellStr(get("Telefono2")) || undefined,
    extension2: cellStr(get("Extensión2")) || undefined,
    celular: celular || undefined,
    telefono: celular || tel1 || undefined,
    email: cellStr(get("Email")) || undefined,
    direccion: cellStr(get("Dirección")) || undefined,
    pais: cellStr(get("País")) || "Colombia",
    codigoDepartamento: cellStr(get("Código Departamento")) || undefined,
    departamento: cellStr(get("Departamento")) || undefined,
    codigoMunicipio: cellStr(get("Código Municipio")) || undefined,
    municipio: cellStr(get("Municipio")) || undefined,
    fechaNacimiento: cellStr(get("Fecha Nacimiento")) || undefined,
    horaNacimiento: cellStr(get("Hora Nacimiento")) || undefined,
    lugarNacimiento: cellStr(get("Lugar nacimiento")) || undefined,
    escolaridad: cellStr(get("Escolaridad")) || undefined,
    ocupacion: cellStr(get("Ocupación")) || undefined,
    codigoSiras: cellStr(get("Código Siras")) || undefined,
    observaciones: cellStr(get("Observaciones")) || undefined,
    idMedico: cellStr(get("Id Médico")) || undefined,
    medico: cellStr(get("Médico")) || undefined,
    estadoPaciente: cellStr(get("Estado Paciente")) || "Activo",
    voluntadAnticipada:
      cellStr(get("Documento de voluntad anticipada")) || "No",
    fechaVoluntadAnticipada:
      cellStr(
        get(
          "Fecha de suscripción o modificación del documento voluntad anticipada"
        )
      ) ||
      cellStr(
        get(
          "Fecha de suscripción o modificación del documento de voluntad anticipada"
        )
      ) ||
      undefined,
    codigoPrestadorVoluntad:
      cellStr(
        get(
          "Código del prestador donde se encuentra el documento voluntad anticipada"
        )
      ) ||
      cellStr(
        get(
          "Código del prestador donde se encuentra el documento de voluntad anticipada"
        )
      ) ||
      undefined,
    oposicionDonacion:
      cellStr(
        get("Manifestación oposición presunción legal de donación")
      ) || "No",
    fechaOposicionDonacion:
      cellStr(
        get("Fecha en que se suscribe el documento ante el INS o la EPS")
      ) || undefined,
    // Admisión (no HC de evolución)
    alergias: cellStr(get("Alergias")) || "Ninguna conocida",
    antecedentesPersonales:
      cellStr(get("Antecedentes personales")) || "Ninguno",
    antecedentesFamiliares:
      cellStr(get("Antecedentes familiares")) || "Ninguno",
    medicamentosActuales:
      cellStr(get("Medicamentos actuales")) || "Ninguno",
    contactoNombre: cellStr(get("Contacto nombre")) || undefined,
    contactoParentesco: cellStr(get("Contacto parentesco")) || undefined,
    contactoTelefono: cellStr(get("Contacto telefono")) || undefined,
  };
}

function pacienteToRow(p: Paciente): Record<string, string | boolean> {
  const row: Record<string, string | boolean> = {};
  for (const { header, key } of EXCEL_HEADERS) {
    if (key === "habeasData") {
      row[header] = p.habeasData ? "SI" : "NO";
    } else if (key === "id") {
      row[header] = p.id || "";
    } else {
      const v = p[key as keyof Paciente];
      row[header] = v == null ? "" : String(v);
    }
  }
  return row;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
          <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputCls =
  "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D51D9]/30";

export default function PacientesPage({
  user,
  apiService,
  addToast,
  records,
  onOpenConsent,
}: {
  user: UsuarioMini;
  apiService: ApiService;
  addToast: ToastFn;
  records?: { id: string; pacienteDoc?: string; radicado?: string; tipo?: string; estado?: string; fecha?: string }[];
  onOpenConsent?: (id: string) => void;
}) {
  const canEdit = user.rol === "ADMINISTRADOR" || user.rol === "MÉDICO";
  const fileRef = useRef<HTMLInputElement>(null);

  const [lista, setLista] = useState<Paciente[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<Paciente>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const [detalle, setDetalle] = useState<Paciente | null>(null);
  const [tab, setTab] = useState<DetalleTab>("datos");
  const [citasPac, setCitasPac] = useState<CitaItem[]>([]);
  const [loadingCitas, setLoadingCitas] = useState(false);

  const toast: ToastFn =
    typeof addToast === "function" ? addToast : (t, m) => console.log(t, m);

  const set = (key: keyof Paciente, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const path = q.trim()
        ? `/pacientes?q=${encodeURIComponent(q.trim())}`
        : "/pacientes";
      const r = await apiService.get(path);
      if (r.ok) {
        const data = await r.json();
        setLista(Array.isArray(data) ? data : []);
      } else {
        toast("error", `No se pudieron cargar pacientes (${r.status})`);
      }
    } catch {
      toast("error", "Sin conexión al API /pacientes — ¿backend activo?");
    } finally {
      setLoading(false);
    }
  }, [apiService, q]);

  useEffect(() => {
    cargar();
  }, []);
  // Historial de citas del paciente (ligado por pacienteId)
  useEffect(() => {
    if (!detalle?.id) {
      setCitasPac([]);
      return;
    }
    let alive = true;
    setLoadingCitas(true);
    apiService
      .get(`/citas/paciente/${detalle.id}`)
      .then(async (r) => {
        if (!alive) return;
        if (r.ok) {
          const data = await r.json();
          setCitasPac(Array.isArray(data) ? data : []);
        } else {
          setCitasPac([]);
        }
      })
      .catch(() => {
        if (alive) setCitasPac([]);
      })
      .finally(() => {
        if (alive) setLoadingCitas(false);
      });
    return () => {
      alive = false;
    };
  }, [detalle?.id, apiService]);

  const consentimientosPac =
    detalle?.documento && records
      ? records.filter((r) => r.pacienteDoc === detalle.documento)
      : [];

  const armarBody = (p: Paciente = form) => ({
    tipoDoc: p.tipoDoc || "CC",
    documento: String(p.documento || "").trim(),
    primerNombre: String(p.primerNombre || "").trim(),
    segundoNombre: p.segundoNombre?.trim() || null,
    primerApellido: String(p.primerApellido || "").trim(),
    segundoApellido: p.segundoApellido?.trim() || null,
    numeroCarnet: p.numeroCarnet?.trim() || null,
    sexo: p.sexo || null,
    identidadGenero: p.identidadGenero || null,
    etnia: p.etnia || null,
    estadoCivil: p.estadoCivil || null,
    grupoSanguineo: p.grupoSanguineo || null,
    habeasData: p.habeasData === true,
    raza: p.raza || null,
    tipoDiscapacidad: p.tipoDiscapacidad || null,
    religion: p.religion || null,
    fechaIngreso: p.fechaIngreso?.trim() ? p.fechaIngreso.trim() : null,
    entidad: p.entidad || "PARTICULAR",
    tipoAseguramiento: p.tipoAseguramiento || "Particular",
    eps: p.eps?.trim() || null,
    tipoPaciente: p.tipoPaciente || "Particular",
    telefono1: p.telefono1?.trim() || null,
    extension1: p.extension1?.trim() || null,
    telefono2: p.telefono2?.trim() || null,
    extension2: p.extension2?.trim() || null,
    celular: p.celular?.trim() || p.telefono?.trim() || null,
    telefono: p.telefono?.trim() || p.celular?.trim() || null,
    email: p.email?.trim() || null,
    direccion: p.direccion?.trim() || null,
    pais: p.pais || "Colombia",
    codigoDepartamento: p.codigoDepartamento || null,
    departamento: p.departamento || null,
    codigoMunicipio: p.codigoMunicipio || null,
    municipio: p.municipio?.trim() || null,
    fechaNacimiento: p.fechaNacimiento?.trim() ? p.fechaNacimiento.trim() : null,
    horaNacimiento: p.horaNacimiento?.trim() ? p.horaNacimiento.trim() : null,
    lugarNacimiento: p.lugarNacimiento?.trim() || null,
    escolaridad: p.escolaridad || null,
    ocupacion: p.ocupacion?.trim() || null,
    codigoSiras: p.codigoSiras || null,
    observaciones: p.observaciones?.trim() || null,
    idMedico: p.idMedico || null,
    medico: p.medico?.trim() || null,

    // Una sola vez cada clave (evita el warning de duplicate key)
    estadoPaciente: p.estadoPaciente || "Activo",
    activo: true,

    voluntadAnticipada: p.voluntadAnticipada || "No",
    fechaVoluntadAnticipada: p.fechaVoluntadAnticipada?.trim()
      ? p.fechaVoluntadAnticipada.trim()
      : null,
    codigoPrestadorVoluntad: p.codigoPrestadorVoluntad || null,
    oposicionDonacion: p.oposicionDonacion || "No",
    fechaOposicionDonacion: p.fechaOposicionDonacion?.trim()
      ? p.fechaOposicionDonacion.trim()
      : null,

    // Nunca null → evita error PostgreSQL NOT NULL
    alergias:
      p.alergias && String(p.alergias).trim()
        ? String(p.alergias).trim()
        : "Ninguna conocida",
    antecedentesPersonales:
      p.antecedentesPersonales && String(p.antecedentesPersonales).trim()
        ? String(p.antecedentesPersonales).trim()
        : "Ninguno",
    antecedentesFamiliares:
      p.antecedentesFamiliares && String(p.antecedentesFamiliares).trim()
        ? String(p.antecedentesFamiliares).trim()
        : "Ninguno",
    medicamentosActuales:
      p.medicamentosActuales && String(p.medicamentosActuales).trim()
        ? String(p.medicamentosActuales).trim()
        : "Ninguno",

    contactoNombre: p.contactoNombre?.trim() || null,
    contactoParentesco: p.contactoParentesco || null,
    contactoTelefono: p.contactoTelefono?.trim() || null,
  });

  const exportarExcel = () => {
    if (lista.length === 0) {
      toast("warning", "No hay pacientes para exportar");
      return;
    }
    const rows = lista.map(pacienteToRow);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
    XLSX.writeFile(wb, `pacientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast("success", `Exportados ${lista.length} pacientes`);
  };

  const onFileExcel = async (file: File) => {
    if (!canEdit) {
      toast("error", "Solo Administrador o Médico pueden importar");
      return;
    }
    setImporting(true);
    try {
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array", cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      if (!json.length) {
        toast("error", "El Excel está vacío");
        return;
      }

      let ok = 0;
      let fail = 0;
      const errores: string[] = [];

      for (let i = 0; i < json.length; i++) {
        const pac = rowToPaciente(json[i]);
        if (!pac) {
          fail++;
          continue;
        }
        if (!pac.documento || !pac.primerNombre || !pac.primerApellido) {
          fail++;
          errores.push(`Fila ${i + 2}: faltan documento o nombres`);
          continue;
        }
        try {
          const resp = await apiService.post("/pacientes", armarBody(pac));
          if (resp.ok) ok++;
          else {
            const err = await resp.json().catch(() => ({}));
            fail++;
            errores.push(
              `Fila ${i + 2} (${pac.documento}): ${(err as { mensaje?: string }).mensaje || resp.status}`
            );
          }
        } catch {
          fail++;
          errores.push(`Fila ${i + 2}: error de red`);
        }
      }

      toast(ok > 0 ? "success" : "error", `Importación: ${ok} ok, ${fail} con error`);
      if (errores.length) console.warn("Errores importación:", errores.slice(0, 20));
      await cargar();
    } catch (e) {
      console.error(e);
      toast("error", "No se pudo leer el archivo Excel");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const abrirNuevo = () => {
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  };

  const abrirEditar = (p: Paciente) => {
    setEditId(p.id || null);
    setForm({
      ...EMPTY_FORM,
      ...p,
      habeasData: p.habeasData === true,
      fechaNacimiento: p.fechaNacimiento ? String(p.fechaNacimiento).slice(0, 10) : "",
    });
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm({ ...EMPTY_FORM });
  };

  const guardar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!form.tipoDoc || !String(form.documento).trim()) {
      toast("error", "Documento obligatorio");
      return;
    }
    if (!String(form.primerNombre).trim() || !String(form.primerApellido).trim()) {
      toast("error", "Nombre y primer apellido obligatorios");
      return;
    }
    setSaving(true);
    try {
      const resp = editId
        ? await apiService.put(`/pacientes/${editId}`, armarBody())
        : await apiService.post("/pacientes", armarBody());
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        toast("error", (data as { mensaje?: string }).mensaje || "No se pudo guardar");
        return;
      }
      toast("success", editId ? "Paciente actualizado" : "Paciente registrado");
      cerrarForm();
      await cargar();
    } catch {
      toast("error", "Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const desactivar = async (p: Paciente) => {
    if (!p.id || !canEdit) return;
    if (!window.confirm(`¿Desactivar a ${nombreCompleto(p)}?`)) return;
    try {
      const resp = await apiService.delete(`/pacientes/${p.id}`);
      if (resp.ok) {
        toast("warning", "Paciente desactivado");
        cargar();
      } else toast("error", "No se pudo desactivar");
    } catch {
      toast("error", "Error de conexión");
    }
  };

  // ——— DETALLE: datos + historial de citas ———
  if (detalle) {
    return (
      <div className="max-w-3xl mx-auto">
        <button
          type="button"
          onClick={() => {
            setDetalle(null);
            setTab("datos");
          }}
          className="flex items-center gap-1 text-sm text-[#0D51D9] mb-4"
        >
          <ChevronLeft size={16} /> Volver
        </button>

        <div className="bg-white rounded-2xl border p-5 shadow-sm">
          <h2 className="text-xl font-bold">{nombreCompleto(detalle)}</h2>
          <p className="text-gray-500 text-sm mb-4">
            {detalle.tipoDoc} {detalle.documento}
          </p>

          <div className="flex gap-1 flex-wrap mb-4">
            {(
              [
                { id: "datos" as const, label: "Datos" },
                { id: "citas" as const, label: `Citas (${citasPac.length})` },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  tab === t.id ? "bg-[#0D51D9] text-white" : "bg-gray-100 text-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === "datos" && (
            <div className="space-y-2 text-sm">
              <p>Celular: {detalle.celular || detalle.telefono || "—"}</p>
              <p>Email: {detalle.email || "—"}</p>
              <p>Dirección: {detalle.direccion || "—"}</p>
              <p>Municipio: {detalle.municipio || "—"}</p>
              <p>EPS: {detalle.eps || "—"}</p>
              <p>Alergias: {detalle.alergias || "—"}</p>
              {consentimientosPac.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-bold text-gray-500 mb-2">
                    Consentimientos ({consentimientosPac.length})
                  </p>
                  <ul className="space-y-1">
                    {consentimientosPac.map((c) => (
                      <li key={c.id} className="text-xs flex justify-between gap-2">
                        <span>
                          {c.tipo} · {c.radicado} · {c.estado}
                        </span>
                        {onOpenConsent && (
                          <button
                            type="button"
                            onClick={() => onOpenConsent?.(c.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg
                                       bg-[#0D51D9]/10 text-[#0D51D9] text-xs font-semibold
                                       hover:bg-[#0D51D9] hover:text-white transition-colors"
                          >
                            <Eye size={12} />
                            Ver PDF
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    abrirEditar(detalle);
                    setDetalle(null);
                  }}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-[#0D51D9] text-white text-xs font-semibold"
                >
                  Editar
                </button>
              )}
            </div>
          )}

          {tab === "citas" && (
            <div>
              <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                <CalendarCheck size={12} /> Historial de citas ligado a este paciente
              </p>
              {loadingCitas ? (
                <p className="text-sm text-gray-400">Cargando citas…</p>
              ) : citasPac.length === 0 ? (
                <p className="text-sm text-gray-400">
                  Sin citas. Créalas en Agenda eligiendo este paciente.
                </p>
              ) : (
                <ul className="space-y-2">
                  {citasPac.map((c) => (
                    <li key={c.id} className="p-3 rounded-xl border text-sm">
                      <p className="font-semibold">
                        {c.fecha} {String(c.hora).slice(0, 5)} ·{" "}
                        <span className="text-[#0D51D9]">{c.estado}</span>
                      </p>
                      <p className="text-xs text-gray-600">
                        {c.tipoCita} · {c.tratamiento}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.descripcion}</p>
                      {c.profesional && (
                        <p className="text-[10px] text-gray-400 mt-1">Prof: {c.profesional}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User size={22} className="text-[#0D51D9]" /> Pacientes
          </h2>
          <p className="text-sm text-gray-500">Registro · citas · importar / exportar Excel</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={exportarExcel}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50"
          >
            <Download size={15} /> Exportar
          </button>
          {canEdit && (
            <>
              <button
                type="button"
                disabled={importing}
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                <Upload size={15} /> {importing ? "Importando..." : "Importar"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFileExcel(f);
                }}
              />
              <button
                type="button"
                onClick={abrirNuevo}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold"
              >
                <Plus size={16} /> Nuevo
              </button>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && cargar()}
          placeholder="Buscar por nombre o documento"
          className={`${inputCls} flex-1`}
        />
        <button type="button" onClick={cargar} className="px-3 py-2 rounded-xl bg-gray-100">
          <Search size={16} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-gray-400 text-sm">Cargando...</p>
        ) : lista.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm">No hay pacientes</p>
        ) : (
          <ul className="divide-y">
            {lista.map((p) => (
              <li key={p.id} className="px-4 py-3 flex items-center gap-3 hover:bg-blue-50/40">
                <button
                  type="button"
                  className="flex-1 text-left min-w-0"
                  onClick={() => {
                    setTab("datos");
                    setDetalle(p);
                  }}
                >
                  <p className="font-semibold text-sm truncate">{nombreCompleto(p)}</p>
                  <p className="text-xs text-gray-500">
                    {p.tipoDoc} {p.documento}
                    {(p.celular || p.telefono) && ` · ${p.celular || p.telefono}`}
                  </p>
                </button>
                {canEdit && (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => abrirEditar(p)}
                      className="text-xs px-2 py-1 rounded-lg border"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => desactivar(p)}
                      className="text-xs px-2 py-1 rounded-lg border border-red-200 text-red-600"
                    >
                      Baja
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showForm && (
        <Modal title={editId ? "Editar paciente" : "Nuevo paciente"} onClose={cerrarForm}>
          <form onSubmit={guardar} className="space-y-4">
            <p className="text-xs font-bold text-gray-500 uppercase">Identificación</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Tipo documento *">
                <select className={inputCls} value={form.tipoDoc} onChange={(e) => set("tipoDoc", e.target.value)}>
                  {OPCIONES.tipoDoc.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Documento *">
                <input className={inputCls} value={form.documento} onChange={(e) => set("documento", e.target.value)} required />
              </Field>
              <Field label="Primer nombre *">
                <input className={inputCls} value={form.primerNombre} onChange={(e) => set("primerNombre", e.target.value)} required />
              </Field>
              <Field label="Segundo nombre">
                <input className={inputCls} value={form.segundoNombre || ""} onChange={(e) => set("segundoNombre", e.target.value)} />
              </Field>
              <Field label="Primer apellido *">
                <input className={inputCls} value={form.primerApellido} onChange={(e) => set("primerApellido", e.target.value)} required />
              </Field>
              <Field label="Segundo apellido">
                <input className={inputCls} value={form.segundoApellido || ""} onChange={(e) => set("segundoApellido", e.target.value)} />
              </Field>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase pt-2">Datos demográficos</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Sexo">
                <select className={inputCls} value={form.sexo || ""} onChange={(e) => set("sexo", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.sexo.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Identidad de género">
                <select className={inputCls} value={form.identidadGenero || ""} onChange={(e) => set("identidadGenero", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.identidadGenero.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Etnia">
                <select className={inputCls} value={form.etnia || ""} onChange={(e) => set("etnia", e.target.value)}>
                  {OPCIONES.etnia.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estado civil">
                <select className={inputCls} value={form.estadoCivil || ""} onChange={(e) => set("estadoCivil", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.estadoCivil.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo sangre">
                <select className={inputCls} value={form.grupoSanguineo || ""} onChange={(e) => set("grupoSanguineo", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.grupoSanguineo.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Fecha nacimiento">
                <input type="date" className={inputCls} value={form.fechaNacimiento || ""} onChange={(e) => set("fechaNacimiento", e.target.value)} />
              </Field>
              <Field label="Escolaridad">
                <select className={inputCls} value={form.escolaridad || ""} onChange={(e) => set("escolaridad", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.escolaridad.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ocupación">
                <input className={inputCls} value={form.ocupacion || ""} onChange={(e) => set("ocupacion", e.target.value)} />
              </Field>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase pt-2">Contacto y ubicación</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Celular">
                <input className={inputCls} value={form.celular || ""} onChange={(e) => set("celular", e.target.value)} />
              </Field>
              <Field label="Email">
                <input type="email" className={inputCls} value={form.email || ""} onChange={(e) => set("email", e.target.value)} />
              </Field>
              <Field label="Dirección">
                <input className={inputCls} value={form.direccion || ""} onChange={(e) => set("direccion", e.target.value)} />
              </Field>
              <Field label="Municipio">
                <input className={inputCls} value={form.municipio || ""} onChange={(e) => set("municipio", e.target.value)} />
              </Field>
              <Field label="Departamento">
                <input className={inputCls} value={form.departamento || ""} onChange={(e) => set("departamento", e.target.value)} />
              </Field>
              <Field label="País">
                <select className={inputCls} value={form.pais || "Colombia"} onChange={(e) => set("pais", e.target.value)}>
                  <option value="Colombia">Colombia</option>
                </select>
              </Field>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase pt-2">Aseguramiento</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Entidad">
                <select className={inputCls} value={form.entidad || ""} onChange={(e) => set("entidad", e.target.value)}>
                  {OPCIONES.entidad.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo aseguramiento">
                <select className={inputCls} value={form.tipoAseguramiento || ""} onChange={(e) => set("tipoAseguramiento", e.target.value)}>
                  {OPCIONES.tipoAseguramiento.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Tipo paciente">
                <select className={inputCls} value={form.tipoPaciente || ""} onChange={(e) => set("tipoPaciente", e.target.value)}>
                  {OPCIONES.tipoPaciente.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="EPS">
                <input className={inputCls} value={form.eps || ""} onChange={(e) => set("eps", e.target.value)} />
              </Field>
              <Field label="Estado paciente">
                <select className={inputCls} value={form.estadoPaciente || "Activo"} onChange={(e) => set("estadoPaciente", e.target.value)}>
                  {OPCIONES.estadoPaciente.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase pt-2">Clínico básico (admisión)</p>
            <div className="grid sm:grid-cols-1 gap-3">
              <Field label="Alergias">
                <input className={inputCls} value={form.alergias || ""} onChange={(e) => set("alergias", e.target.value)} />
              </Field>
              <Field label="Antecedentes personales">
                <input className={inputCls} value={form.antecedentesPersonales || ""} onChange={(e) => set("antecedentesPersonales", e.target.value)} />
              </Field>
              <Field label="Antecedentes familiares">
                <input className={inputCls} value={form.antecedentesFamiliares || ""} onChange={(e) => set("antecedentesFamiliares", e.target.value)} />
              </Field>
              <Field label="Medicamentos actuales">
                <input className={inputCls} value={form.medicamentosActuales || ""} onChange={(e) => set("medicamentosActuales", e.target.value)} />
              </Field>
            </div>

            <p className="text-xs font-bold text-gray-500 uppercase pt-2">Contacto de emergencia</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Nombre">
                <input className={inputCls} value={form.contactoNombre || ""} onChange={(e) => set("contactoNombre", e.target.value)} />
              </Field>
              <Field label="Parentesco">
                <select className={inputCls} value={form.contactoParentesco || ""} onChange={(e) => set("contactoParentesco", e.target.value)}>
                  <option value="">—</option>
                  {OPCIONES.parentesco.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Teléfono">
                <input className={inputCls} value={form.contactoTelefono || ""} onChange={(e) => set("contactoTelefono", e.target.value)} />
              </Field>
            </div>

            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.habeasData === true} onChange={(e) => set("habeasData", e.target.checked)} />
                Habeas data
              </label>
              <Field label="Voluntad anticipada">
                <select className={inputCls} value={form.voluntadAnticipada || "No"} onChange={(e) => set("voluntadAnticipada", e.target.value)}>
                  {OPCIONES.siNo.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Oposición donación">
                <select className={inputCls} value={form.oposicionDonacion || "No"} onChange={(e) => set("oposicionDonacion", e.target.value)}>
                  {OPCIONES.siNo.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="flex gap-2 pt-3 border-t">
              <button type="button" onClick={cerrarForm} className="flex-1 py-2.5 rounded-xl border text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[#0D51D9] text-white text-sm font-semibold disabled:opacity-50">
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>


        </Modal>
      )}
    </div>
  );
}