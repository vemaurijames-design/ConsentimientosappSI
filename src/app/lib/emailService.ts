import emailjs from "@emailjs/browser";

const SERVICE_ID    = import.meta.env.VITE_EMAILJS_SERVICE_ID  ?? "";
const TEMPLATE_ID   = import.meta.env.VITE_EMAILJS_TEMPLATE_ID ?? "";
const PUBLIC_KEY    = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  ?? "";
const CLINICA_EMAIL = import.meta.env.VITE_EMAIL_CLINICA        ?? "saludintensaconsentimientos@hotmail.com";
const REPLY_TO      = import.meta.env.VITE_EMAILJS_REPLY_TO    ?? "saludintensaconsentimientos@hotmail.com";

const configurado = () => Boolean(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

export interface DatosEmail {
  emailPaciente:  string;
  nombrePaciente: string;
  radicado:       string;
  tipo:           string;
  fecha:          string;
  documento:      string;
  telefono:       string;
  creadoPor:      string;
  pdfUrl?:        string;
  ipsNombre:      string;
  ipsMedico:      string;
}

const TIPO_LABEL: Record<string, string> = {
  escleroterapia: "Escleroterapia (Inyección de Várices)",
  sueroterapia:   "Sueroterapia Vitamina C y/o Complejo B",
  laser:          "Terapia Láser — Control de Venas Várices",
  paquete:        "Paquete Integral Salud Intensa",
};

/** Envía email al paciente con todos los datos del consentimiento. */
export async function enviarEmailPaciente(datos: DatosEmail): Promise<boolean> {
  if (!configurado()) {
    console.warn("EmailJS no configurado — agrega VITE_EMAILJS_* en .env.local");
    return false;
  }
  if (!datos.emailPaciente?.includes("@")) return false;

  const params = {
    to_email:      datos.emailPaciente,
    to_name:       datos.nombrePaciente,
    radicado:      datos.radicado,
    procedimiento: TIPO_LABEL[datos.tipo] ?? datos.tipo,
    fecha:         datos.fecha,
    documento:     datos.documento,
    telefono:      datos.telefono,
    creado_por:    datos.creadoPor,
    pdf_url:       datos.pdfUrl ?? "No disponible",
    ips_nombre:    datos.ipsNombre,
    ips_medico:    datos.ipsMedico,
    reply_to:      REPLY_TO,
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    return true;
  } catch (err) {
    console.error("EmailJS error paciente:", err);
    return false;
  }
}

/** Envía copia del consentimiento firmado a la clínica. */
export async function enviarEmailClinica(datos: DatosEmail): Promise<boolean> {
  if (!configurado()) return false;
  if (!CLINICA_EMAIL) return false;

  const params = {
    to_email:      CLINICA_EMAIL,
    to_name:       `${datos.ipsNombre} — Registro Interno`,
    radicado:      datos.radicado,
    procedimiento: TIPO_LABEL[datos.tipo] ?? datos.tipo,
    fecha:         datos.fecha,
    documento:     datos.documento,
    telefono:      datos.telefono,
    creado_por:    datos.creadoPor,
    pdf_url:       datos.pdfUrl ?? "No disponible",
    ips_nombre:    datos.ipsNombre,
    ips_medico:    datos.ipsMedico,
    reply_to:      CLINICA_EMAIL,
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, params, PUBLIC_KEY);
    return true;
  } catch (err) {
    console.error("EmailJS error clínica:", err);
    return false;
  }
}
