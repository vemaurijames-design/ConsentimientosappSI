type DatosEmail = {
  emailPaciente?: string;
  nombrePaciente: string;
  radicado: string;
  tipo: string;
  fecha: string;
  documento: string;
  telefono: string;
  creadoPor: string;
  ipsNombre: string;
  ipsMedico: string;
  pdfBase64?: string; // lo vamos a mandar para adjuntar
};

const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_URL) ||
  "http://localhost:8080/api";

// En este diseño el backend realmente envía el correo.
// El frontend solo llama al endpoint.
export async function enviarEmailPaciente(datos: DatosEmail): Promise<boolean> {
  if (!datos.emailPaciente) return false;

  const r = await fetch(`${API_BASE}/emails/enviar-consentimiento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...datos, destino: "PACIENTE" }),
  });
  return r.ok;
}

export async function enviarEmailClinica(datos: DatosEmail): Promise<boolean> {
  const r = await fetch(`${API_BASE}/emails/enviar-consentimiento`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...datos, destino: "CLINICA" }),
  });
  return r.ok;
}