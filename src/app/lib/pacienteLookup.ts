export type PacienteBasico = {
  id: string;
  tipoDoc: string;
  documento: string;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  celular?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  municipio?: string;
  departamento?: string;
  fechaNacimiento?: string;
  eps?: string;
  estadoPaciente?: string;
};

export function nombreDesdePaciente(p: PacienteBasico) {
  return [p.primerNombre, p.segundoNombre, p.primerApellido, p.segundoApellido]
    .filter(Boolean)
    .join(" ");
}

/** Solo identificación/contacto del form de consentimiento (NO historia clínica) */
export function pacienteBasicoToDatosConsent(p: PacienteBasico) {
  return {
    tipoDoc: p.tipoDoc || "CC",
    documento: p.documento || "",
    nombre: nombreDesdePaciente(p),
    telefono: p.celular || p.telefono || "",
    email: p.email || "",
    direccion: p.direccion || "",
    ciudad: p.municipio || "",
    fechaNacimiento: p.fechaNacimiento
      ? String(p.fechaNacimiento).slice(0, 10)
      : "",
    fecha: new Date().toISOString().slice(0, 10),
    contactoNombre: "",
    contactoParentesco: "",
    contactoTelefono: "",
    estadoCivil: "",
    escolaridad: "",
    tipoConsulta: "",
  };
}

export async function buscarPacienteBasico(
  api: { get: (path: string) => Promise<Response> },
  tipoDoc: string,
  documento: string
): Promise<{ ok: true; data: PacienteBasico } | { ok: false; status: number }> {
  const doc = documento.trim();
  if (!tipoDoc || !doc) return { ok: false, status: 400 };
  const r = await api.get(
    `/pacientes/doc/${encodeURIComponent(tipoDoc)}/${encodeURIComponent(doc)}`
  );
  if (r.status === 404) return { ok: false, status: 404 };
  if (!r.ok) return { ok: false, status: r.status };
  return { ok: true, data: (await r.json()) as PacienteBasico };
}