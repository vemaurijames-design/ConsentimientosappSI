import jsPDF from "jspdf";

interface DatosConsentimiento {
  radicado:              string;
  tipo:                  string;
  fecha:                 string;
  pacienteNombre:        string;
  pacienteDoc:           string;
  pacienteTel:           string;
  pacienteEmail?:        string;
  creadoPor?:            string;
  textoConsent:          string;
  ipsNombre:             string;
  ipsNit:                string;
  ipsMedico:             string;
  ipsRm:                 string;
  ipsCiudad:             string;
  /** Data URL de la firma del paciente (canvas base64) */
  firmaConsentimiento?:  string;
  /** Data URL de la firma/sello del médico (imagen JPG/PNG) */
  firmaDoctor?:          string;
  /** Datos adicionales del paciente para la sección clínica */
  datosPaciente?: {
    direccion?: string; ciudad?: string; fechaNacimiento?: string;
    contactoNombre?: string; contactoParentesco?: string; contactoTelefono?: string;
  };
  /** Vitales registrados por enfermería */
  vitales?: {
    oximetria?: string; tension?: string; frecuenciaCardiaca?: string;
    temperatura?: string; peso?: string; talla?: string; imc?: string; glucemia?: string;
    observaciones?: string;
  };
}

const AZUL_OSCURO: [number, number, number] = [3, 28, 166];    // #031CA6
const AZUL_MEDIO:  [number, number, number] = [13, 81, 217];   // #0D51D9
const GRIS_TEXTO:  [number, number, number] = [55, 65, 81];    // #374151
const GRIS_CLARO:  [number, number, number] = [107, 114, 128]; // #6B7280

export async function generarPDFConsentimiento(
  datos: DatosConsentimiento
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210; // ancho A4
  const M = 16;  // margen lateral
  const ANCHO = W - M * 2;
  let y = 0;

  // ── helper: avanzar página si es necesario ──────────────────────────────
  const checkPage = (h = 10) => {
    if (y + h > 280) { doc.addPage(); y = 20; }
  };

  // ══════════════════════════════════════════════════════════════════════
  // CABECERA
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(...AZUL_OSCURO);
  doc.rect(0, 0, W, 38, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(datos.ipsNombre, M, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(197, 213, 240);
  doc.text(`NIT ${datos.ipsNit}  ·  ${datos.ipsCiudad}`, M, 23);
  doc.text("Sistema de Consentimientos Informados", M, 28);

  // Radicado en cabecera (derecha)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(datos.radicado, W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(197, 213, 240);
  doc.text(datos.fecha, W - M, 22, { align: "right" });

  y = 46;

  // ══════════════════════════════════════════════════════════════════════
  // TÍTULO DEL PROCEDIMIENTO
  // ══════════════════════════════════════════════════════════════════════
  const tipoLabel: Record<string, string> = {
    escleroterapia: "ESCLEROTERAPIA (INYECCIÓN) DE VÁRICES DE LOS MIEMBROS INFERIORES",
    sueroterapia:   "SUEROTERAPIA DE VITAMINA C y/o COMPLEJO B",
    laser:          "TERAPIA LÁSER PARA EL CONTROL DE VENAS VÁRICES",
    paquete:        "PAQUETE INTEGRAL MED&FIS",
  };

  doc.setFillColor(...AZUL_MEDIO);
  doc.roundedRect(M, y, ANCHO, 12, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  const titulo = `CONSENTIMIENTO INFORMADO — ${tipoLabel[datos.tipo] ?? datos.tipo.toUpperCase()}`;
  const tituloLines = doc.splitTextToSize(titulo, ANCHO - 8);
  doc.text(tituloLines, M + 4, y + 4.5);
  y += tituloLines.length > 1 ? 18 : 14;

  // ══════════════════════════════════════════════════════════════════════
  // DATOS DEL PACIENTE (tabla)
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(239, 243, 251);
  doc.roundedRect(M, y, ANCHO, 36, 2, 2, "F");

  const col1 = M + 4;
  const col2 = M + 4 + ANCHO / 2;
  const lineH = 7;

  const labelPac = (lbl: string, val: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_CLARO);
    doc.text(lbl.toUpperCase(), x, yy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(val || "—", x, yy + 4);
  };

  labelPac("Paciente",    datos.pacienteNombre,  col1, y + 6);
  labelPac("Fecha",       datos.fecha,            col2, y + 6);
  labelPac("Documento",   datos.pacienteDoc,      col1, y + 6 + lineH * 2);
  labelPac("Teléfono",    datos.pacienteTel,      col2, y + 6 + lineH * 2);
  labelPac("Email",       datos.pacienteEmail ?? "—", col1, y + 6 + lineH * 4);
  labelPac("Atendido por", datos.creadoPor ?? "—", col2, y + 6 + lineH * 4);
  y += 42;

  // ══════════════════════════════════════════════════════════════════════
  // MÉDICO RESPONSABLE
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(...AZUL_OSCURO);
  doc.roundedRect(M, y, ANCHO, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Médico responsable: ${datos.ipsMedico}  ·  ${datos.ipsRm}`, M + 4, y + 5.5);
  y += 12;

  // ══════════════════════════════════════════════════════════════════════
  // TEXTO DEL CONSENTIMIENTO
  // ══════════════════════════════════════════════════════════════════════
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...AZUL_OSCURO);
  doc.text("TEXTO DEL CONSENTIMIENTO INFORMADO", M, y);
  y += 5;

  doc.setDrawColor(...AZUL_MEDIO);
  doc.setLineWidth(0.4);
  doc.line(M, y, W - M, y);
  y += 4;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GRIS_TEXTO);

  const lineas = doc.splitTextToSize(datos.textoConsent, ANCHO);
  for (const linea of lineas) {
    checkPage(5);
    const esTitulo = /^[A-ZÁÉÍÓÚÑ\d\s&().,:·]+:?\s*$/.test(linea.trim()) && linea.trim().length > 3;
    doc.setFont("helvetica", esTitulo ? "bold" : "normal");
    doc.setFontSize(esTitulo ? 8 : 7.5);
    if (esTitulo) {
      doc.setTextColor(AZUL_OSCURO[0], AZUL_OSCURO[1], AZUL_OSCURO[2]);
    } else {
      doc.setTextColor(GRIS_TEXTO[0], GRIS_TEXTO[1], GRIS_TEXTO[2]);
    }
    doc.text(linea, M, y);
    y += esTitulo ? 5 : 4.2;
  }

  y += 6;
  checkPage(40);

  // ══════════════════════════════════════════════════════════════════════
  // DATOS CLÍNICOS ADICIONALES (si existen)
  // ══════════════════════════════════════════════════════════════════════
  const dp = datos.datosPaciente;
  const vit = datos.vitales;

  if (dp && (dp.direccion || dp.ciudad || dp.fechaNacimiento || dp.contactoNombre)) {
    checkPage(30);
    doc.setFillColor(239, 243, 251);
    doc.roundedRect(M, y, ANCHO, 28, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AZUL_OSCURO);
    doc.text("DATOS ADICIONALES DEL PACIENTE", M + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_TEXTO);
    let dy = y + 12;
    if (dp.direccion)   { doc.text(`Dirección: ${dp.direccion}${dp.ciudad ? ` — ${dp.ciudad}` : ""}`, M + 4, dy); dy += 5; }
    if (dp.fechaNacimiento) { doc.text(`Fecha de nacimiento: ${dp.fechaNacimiento}`, M + 4, dy); dy += 5; }
    if (dp.contactoNombre) {
      doc.text(`Contacto de emergencia: ${dp.contactoNombre} (${dp.contactoParentesco ?? "—"}) · Tel: ${dp.contactoTelefono ?? "—"}`, M + 4, dy);
    }
    y += 34;
  }

  if (vit && (vit.oximetria || vit.tension || vit.peso)) {
    checkPage(22);
    doc.setFillColor(239, 243, 251);
    doc.roundedRect(M, y, ANCHO, 20, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...AZUL_OSCURO);
    doc.text("SIGNOS VITALES — ENFERMERÍA", M + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_TEXTO);
    const vitStr = [
      vit.oximetria ? `SpO₂: ${vit.oximetria}%` : null,
      vit.tension   ? `TA: ${vit.tension}` : null,
      vit.frecuenciaCardiaca ? `FC: ${vit.frecuenciaCardiaca} lpm` : null,
      vit.temperatura ? `T°: ${vit.temperatura}°C` : null,
      vit.peso  ? `Peso: ${vit.peso} kg` : null,
      vit.talla ? `Talla: ${vit.talla} cm` : null,
      vit.imc   ? `IMC: ${vit.imc}` : null,
      vit.glucemia ? `Glucemia: ${vit.glucemia}` : null,
    ].filter(Boolean).join("  ·  ");
    doc.text(vitStr, M + 4, y + 13, { maxWidth: ANCHO - 8 });
    y += 26;
  }

  // ══════════════════════════════════════════════════════════════════════
  // SECCIÓN DE FIRMAS
  // ══════════════════════════════════════════════════════════════════════
  checkPage(60);
  const FIRMA_H = 46;
  doc.setFillColor(239, 243, 251);
  doc.roundedRect(M, y, ANCHO, FIRMA_H, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...AZUL_OSCURO);
  doc.text("CONSENTIMIENTO — FIRMAS", M + 4, y + 7);

  const firmaImgH = 16; // alto reservado para imagen de firma
  const firmaImgY = y + 10;
  const firmaLineY = firmaImgY + firmaImgH + 2;
  const firmaW = ANCHO / 2 - 8;

  // ── Imagen firma paciente ────────────────────────────────────────────
  if (datos.firmaConsentimiento) {
    try {
      const fmt = datos.firmaConsentimiento.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(datos.firmaConsentimiento, fmt, M + 4, firmaImgY, firmaW, firmaImgH);
    } catch { /* firma inválida — solo mostrar línea */ }
  }

  // ── Imagen firma/sello médico ────────────────────────────────────────
  const x2 = M + ANCHO / 2 + 4;
  if (datos.firmaDoctor) {
    try {
      const fmt = datos.firmaDoctor.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(datos.firmaDoctor, fmt, x2, firmaImgY, firmaW, firmaImgH);
    } catch { /* imagen inválida */ }
  }

  // ── Líneas y texto bajo las imágenes ────────────────────────────────
  doc.setDrawColor(...GRIS_CLARO);
  doc.setLineWidth(0.5);
  doc.line(M + 4, firmaLineY, M + 4 + firmaW, firmaLineY);
  doc.line(x2, firmaLineY, x2 + firmaW, firmaLineY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRIS_CLARO);
  doc.text("Firma del Paciente", M + 4, firmaLineY + 4);
  doc.text(datos.pacienteNombre, M + 4, firmaLineY + 8);
  doc.text(`C.C. ${datos.pacienteDoc}`, M + 4, firmaLineY + 12);

  doc.text("Firma del Médico / Responsable", x2, firmaLineY + 4);
  doc.text(datos.ipsMedico, x2, firmaLineY + 8);
  doc.text(datos.ipsRm, x2, firmaLineY + 12);

  y += FIRMA_H + 6;
  checkPage(14);

  // ══════════════════════════════════════════════════════════════════════
  // PIE DE PÁGINA (en todas las páginas)
  // ══════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...AZUL_OSCURO);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(197, 213, 240);
    doc.text(
      `© ${new Date().getFullYear()} ${datos.ipsNombre} · NIT ${datos.ipsNit} · Desarrollado por JM Ingeniero · Todos los derechos reservados`,
      M, 290
    );
    doc.text(`Página ${i} de ${totalPages}`, W - M, 290, { align: "right" });
  }

  return doc.output("blob");
}

/** Convierte el Blob del PDF a base64 para enviarlo por email */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}
