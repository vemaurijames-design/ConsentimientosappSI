export function abrirWhatsApp(telefono: string, mensaje: string) {
  let t = (telefono || "").replace(/\D/g, "");
  if (!t) return false;
  if (t.length === 10 && t.startsWith("3")) t = "57" + t;
  window.open(`https://wa.me/${t}?text=${encodeURIComponent(mensaje)}`, "_blank");
  return true;
}

export const WA_CLINICA =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env?.VITE_WA_CLINICA) ||
  "573114048112"; // Número de WhatsApp de la clínica (para mensajes de contacto) cambiarlo clinica pronto medfis