/**
 * Abre WhatsApp Web/App con el mensaje pre-cargado.
 * El usuario solo toca "Enviar" — sin costo, sin Twilio.
 */
export function enviarWhatsAppAuto(numero: string, mensaje: string): void {
  const numLimpio = numero.replace(/[^0-9]/g, "");
  if (!numLimpio) return;
  // Asegura formato Colombia: si empieza con 3 (celular local) agregar 57
  const numFinal = numLimpio.startsWith("57") ? numLimpio : "57" + numLimpio;
  window.open(`https://wa.me/${numFinal}?text=${encodeURIComponent(mensaje)}`, "_blank");
}