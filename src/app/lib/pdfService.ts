import jsPDF from "jspdf";

interface DatosConsentimiento {
  radicado:       string;
  tipo:           string;
  fecha:          string;
  pacienteNombre: string;
  pacienteDoc:    string;
  pacienteTel:    string;
  pacienteEmail?: string;
  creadoPor?:     string;
  textoConsent:   string;
  ipsNombre:      string;
  ipsNit:         string;
  ipsMedico:      string;
  ipsRm:          string;
  ipsCiudad:      string;
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
  // SECCIÓN DE FIRMAS
  // ══════════════════════════════════════════════════════════════════════
  doc.setFillColor(239, 243, 251);
  doc.roundedRect(M, y, ANCHO, 42, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...AZUL_OSCURO);
  doc.text("CONSENTIMIENTO — FIRMAS", M + 4, y + 7);

  const firmaY = y + 30;
  const firmaW = ANCHO / 2 - 8;

  // Firma paciente
  doc.setDrawColor(...GRIS_CLARO);
  doc.setLineWidth(0.5);
  doc.line(M + 4, firmaY, M + 4 + firmaW, firmaY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...GRIS_CLARO);
  doc.text("Firma del Paciente", M + 4, firmaY + 4);
  doc.text(datos.pacienteNombre, M + 4, firmaY + 8);
  doc.text(`C.C. ${datos.pacienteDoc}`, M + 4, firmaY + 12);

  // Firma médico
  const x2 = M + ANCHO / 2 + 4;
  doc.line(x2, firmaY, x2 + firmaW, firmaY);
  doc.text("Firma del Médico / Responsable", x2, firmaY + 4);
  doc.text(datos.ipsMedico, x2, firmaY + 8);
  doc.text(datos.ipsRm, x2, firmaY + 12);

  y += 48;
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
