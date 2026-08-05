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
  firmaConsentimiento?:  string;
  firmaDoctor?:          string;
  aprobadoPor?:          string;
  fechaAprobacion?:      string;
  firmaAprobador?:       string;
  estadoPDF?:            "APROBADO" | "RECHAZADO" | "FIRMADO" | "PENDIENTE";
  datosPaciente?: {
    direccion?: string; ciudad?: string; fechaNacimiento?: string;
    contactoNombre?: string; contactoParentesco?: string; contactoTelefono?: string;
  };
  vitales?: {
    oximetria?: string; tension?: string; frecuenciaCardiaca?: string;
    frecuenciaRespiratoria?: string; temperatura?: string;
    peso?: string; talla?: string; imc?: string; glucemia?: string;
    observaciones?: string;
  };
  /** Respuestas del cuestionario médico (escleroterapia / paquete) */
  cuestionario?: Record<string, string>;
  /** Prescripción para sueroterapia */
  prescripcion?: {
    dosis_vitC?: string; dosis_compB?: string; via?: string;
    trazabilidad?: Record<string, string>;
  };
  /** Parámetros láser por fila */
  parametrosLaser?: Array<{
    fototipo?: string; pieza?: string; modo?: string;
    frecuencia?: string; fluencia?: string; energia?: string;
    area?: string; pases?: string;
  }>;
}

const AZUL_OSCURO: [number, number, number] = [3, 28, 166];
const AZUL_MEDIO:  [number, number, number] = [13, 81, 217];
const GRIS_TEXTO:  [number, number, number] = [55, 65, 81];
const GRIS_CLARO:  [number, number, number] = [107, 114, 128];
const VERDE:       [number, number, number] = [5, 150, 105];
const VERDE_CLARO: [number, number, number] = [240, 253, 244];
const MORADO:      [number, number, number] = [109, 40, 217];
const MORADO_CLAR: [number, number, number] = [245, 243, 255];

export async function generarPDFConsentimiento(
  datos: DatosConsentimiento
): Promise<Blob> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210;
  const M = 16;
  const ANCHO = W - M * 2;
  let y = 0;

  const checkPage = (h = 10) => {
    if (y + h > 278) { doc.addPage(); y = 18; }
  };

  // ══════════════════════════════════════════════════════
  // CABECERA
  // ══════════════════════════════════════════════════════
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

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(datos.radicado, W - M, 16, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(197, 213, 240);
  doc.text(datos.fecha, W - M, 22, { align: "right" });

  y = 46;

  // ══════════════════════════════════════════════════════
  // TÍTULO PROCEDIMIENTO
  // ══════════════════════════════════════════════════════
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

  // ══════════════════════════════════════════════════════
  // DATOS DEL PACIENTE
  // ══════════════════════════════════════════════════════
  doc.setFillColor(239, 243, 251);
  doc.roundedRect(M, y, ANCHO, 36, 2, 2, "F");

  const col1 = M + 4;
  const col2 = M + 4 + ANCHO / 2;
  const lineH = 7;

  const labelVal = (lbl: string, val: string, x: number, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_CLARO);
    doc.text(lbl.toUpperCase(), x, yy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...GRIS_TEXTO);
    doc.text(val || "—", x, yy + 4);
  };

  labelVal("Paciente",     datos.pacienteNombre,       col1, y + 6);
  labelVal("Fecha",        datos.fecha,                 col2, y + 6);
  labelVal("Documento",    datos.pacienteDoc,           col1, y + 6 + lineH * 2);
  labelVal("Teléfono",     datos.pacienteTel,           col2, y + 6 + lineH * 2);
  labelVal("Email",        datos.pacienteEmail ?? "—",  col1, y + 6 + lineH * 4);
  labelVal("Atendido por", datos.creadoPor ?? "—",      col2, y + 6 + lineH * 4);
  y += 42;

  // Datos adicionales del paciente
  const dp = datos.datosPaciente;
  if (dp && (dp.direccion || dp.fechaNacimiento || dp.contactoNombre)) {
    checkPage(28);
    doc.setFillColor(239, 243, 251);
    doc.roundedRect(M, y, ANCHO, 26, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...AZUL_OSCURO);
    doc.text("DATOS ADICIONALES DEL PACIENTE", M + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_TEXTO);
    let dy = y + 12;
    if (dp.direccion)   { doc.text(`Dirección: ${dp.direccion}${dp.ciudad ? ` — ${dp.ciudad}` : ""}`, M + 4, dy); dy += 5; }
    if (dp.fechaNacimiento) { doc.text(`Fecha de nacimiento: ${dp.fechaNacimiento}`, M + 4, dy); dy += 5; }
    if (dp.contactoNombre) {
      doc.text(`Contacto emergencia: ${dp.contactoNombre} (${dp.contactoParentesco ?? "—"}) · Tel: ${dp.contactoTelefono ?? "—"}`, M + 4, dy);
    }
    y += 32;
  }

  // ══════════════════════════════════════════════════════
  // MÉDICO RESPONSABLE
  // ══════════════════════════════════════════════════════
  doc.setFillColor(...AZUL_OSCURO);
  doc.roundedRect(M, y, ANCHO, 8, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(`Médico responsable: ${datos.ipsMedico}  ·  ${datos.ipsRm}`, M + 4, y + 5.5);
  y += 12;

  // ══════════════════════════════════════════════════════
  // SECCIÓN AUXILIAR / ENFERMERÍA — SIGNOS VITALES
  // ══════════════════════════════════════════════════════
  const vit = datos.vitales;
  const hayVitales = vit && (vit.oximetria || vit.tension || vit.frecuenciaCardiaca ||
    vit.frecuenciaRespiratoria || vit.temperatura || vit.peso || vit.talla || vit.glucemia);

  if (hayVitales || datos.creadoPor) {
    checkPage(55);
    // Encabezado sección enfermería
    doc.setFillColor(...VERDE);
    doc.roundedRect(M, y, ANCHO, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("REGISTRO AUXILIAR / ENFERMERÍA", M + 4, y + 6);
    if (datos.creadoPor) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(167, 243, 208);
      doc.text(`Registrado por: ${datos.creadoPor}`, W - M - 4, y + 6, { align: "right" });
    }
    y += 12;

    if (hayVitales) {
      // Tabla de signos vitales — 4 columnas
      const vitItems: [string, string, string][] = [
        ["SpO₂ / Oximetría", vit!.oximetria ? `${vit!.oximetria} %` : "—", ""],
        ["Tensión Arterial", vit!.tension || "—", "mmHg"],
        ["Frec. Cardíaca",   vit!.frecuenciaCardiaca ? `${vit!.frecuenciaCardiaca} lpm` : "—", ""],
        ["Frec. Respiratoria", vit!.frecuenciaRespiratoria ? `${vit!.frecuenciaRespiratoria} rpm` : "—", ""],
        ["Temperatura",      vit!.temperatura ? `${vit!.temperatura} °C` : "—", ""],
        ["Peso",             vit!.peso ? `${vit!.peso} kg` : "—", ""],
        ["Talla",            vit!.talla ? `${vit!.talla} cm` : "—", ""],
        ["IMC",              vit!.imc || "—", "kg/m²"],
        ["Glucemia",         vit!.glucemia || "—", ""],
      ];

      // Cabecera tabla
      const cols = 4;
      const cellW = ANCHO / cols;
      const cellH = 12;
      const totalRows = Math.ceil(vitItems.length / cols);
      const tableH = totalRows * cellH + 8;

      checkPage(tableH + 6);
      doc.setFillColor(239, 243, 251);
      doc.roundedRect(M, y, ANCHO, tableH, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...AZUL_OSCURO);
      doc.text("SIGNOS VITALES", M + 4, y + 5);
      y += 8;

      vitItems.forEach((item, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const cx = M + col * cellW;
        const cy = y + row * cellH;

        // Borde celda
        doc.setDrawColor(197, 213, 240);
        doc.setLineWidth(0.3);
        doc.rect(cx, cy, cellW, cellH, "S");

        // Label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6.5);
        doc.setTextColor(...GRIS_CLARO);
        doc.text(item[0], cx + 2, cy + 4);

        // Valor — más grande
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...AZUL_OSCURO);
        doc.text(item[1], cx + 2, cy + 10);
      });

      y += totalRows * cellH + 4;

      // Observaciones de enfermería
      if (vit!.observaciones) {
        checkPage(14);
        doc.setFillColor(255, 251, 235);
        doc.roundedRect(M, y, ANCHO, 12, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(146, 64, 14);
        doc.text("OBS. ENFERMERÍA:", M + 4, y + 5);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...GRIS_TEXTO);
        const obsLines = doc.splitTextToSize(vit!.observaciones, ANCHO - 40);
        doc.text(obsLines, M + 38, y + 5);
        y += 14 + (obsLines.length > 1 ? (obsLines.length - 1) * 4 : 0);
      }
    }
    y += 4;
  }

  // ══════════════════════════════════════════════════════
  // PRESCRIPCIÓN SUEROTERAPIA
  // ══════════════════════════════════════════════════════
  const presc = datos.prescripcion;
  if (presc && (presc.dosis_vitC || presc.dosis_compB)) {
    checkPage(40);
    doc.setFillColor(...MORADO);
    doc.roundedRect(M, y, ANCHO, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("PRESCRIPCIÓN MÉDICA — SUEROTERAPIA", M + 4, y + 6);
    y += 12;

    checkPage(22);
    doc.setFillColor(...MORADO_CLAR);
    doc.roundedRect(M, y, ANCHO, 20, 2, 2, "F");

    const prescItems = [
      ["Vitamina C", presc.dosis_vitC || "—"],
      ["Complejo B", presc.dosis_compB || "—"],
      ["Vía de administración", presc.via || "—"],
    ];
    const pw = ANCHO / prescItems.length;
    prescItems.forEach(([lbl, val], i) => {
      const px = M + i * pw;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6.5);
      doc.setTextColor(...MORADO);
      doc.text(lbl.toUpperCase(), px + 4, y + 7);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...GRIS_TEXTO);
      doc.text(val, px + 4, y + 15);
    });
    y += 25;

    // Trazabilidad de insumos
    if (presc.trazabilidad && Object.keys(presc.trazabilidad).length) {
      checkPage(22);
      const trItems = Object.entries(presc.trazabilidad).filter(([, v]) => v);
      if (trItems.length) {
        doc.setFillColor(245, 243, 255);
        const trH = 8 + Math.ceil(trItems.length / 3) * 8;
        doc.roundedRect(M, y, ANCHO, trH, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...MORADO);
        doc.text("TRAZABILIDAD DE INSUMOS", M + 4, y + 6);
        const trW = ANCHO / 3;
        trItems.forEach(([k, v], i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const tx = M + col * trW + 4;
          const ty = y + 13 + row * 8;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(6);
          doc.setTextColor(...GRIS_CLARO);
          const labels: Record<string, string> = {
            nacl: "NaCl 0.9%", vitC: "Vitamina C", compB: "Complejo B",
            jeringa: "Jeringa", pericraneal: "Pericraneal", macrogotero: "Macrogotero",
          };
          doc.text((labels[k] ?? k).toUpperCase(), tx, ty);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7.5);
          doc.setTextColor(...GRIS_TEXTO);
          doc.text(String(v), tx, ty + 4.5);
        });
        y += trH + 6;
      }
    }
  }

  // ══════════════════════════════════════════════════════
  // PARÁMETROS LÁSER
  // ══════════════════════════════════════════════════════
  const laser = datos.parametrosLaser;
  if (laser && laser.length > 0) {
    checkPage(30);
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(M, y, ANCHO, 9, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(255, 255, 255);
    doc.text("PARÁMETROS TÉCNICOS — TERAPIA LÁSER", M + 4, y + 6);
    y += 12;

    checkPage(12 + laser.length * 6);
    const headers = ["Fototipo", "Pieza", "Modo", "Frecuencia", "Fluencia", "Energía", "Área", "Pases"];
    const colsL = headers.length;
    const cellWL = ANCHO / colsL;
    const hdrH = 7;

    // Header
    doc.setFillColor(254, 226, 226);
    doc.rect(M, y, ANCHO, hdrH, "F");
    headers.forEach((h, i) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(6);
      doc.setTextColor(185, 28, 28);
      doc.text(h, M + i * cellWL + 2, y + 4.5);
    });
    y += hdrH;

    laser.forEach((row, ri) => {
      checkPage(6);
      const rowH = 6;
      if (ri % 2 === 0) { doc.setFillColor(255, 245, 245); doc.rect(M, y, ANCHO, rowH, "F"); }
      const vals = [row.fototipo, row.pieza, row.modo, row.frecuencia, row.fluencia, row.energia, row.area, row.pases];
      vals.forEach((v, i) => {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...GRIS_TEXTO);
        doc.text(v || "—", M + i * cellWL + 2, y + 4);
      });
      doc.setDrawColor(254, 202, 202);
      doc.setLineWidth(0.2);
      doc.line(M, y + rowH, M + ANCHO, y + rowH);
      y += rowH;
    });
    y += 6;
  }

  // ══════════════════════════════════════════════════════
  // CUESTIONARIO MÉDICO (escleroterapia / paquete)
  // ══════════════════════════════════════════════════════
  const cuest = datos.cuestionario;
  if (cuest && Object.keys(cuest).length > 0) {
    const entries = Object.entries(cuest).filter(([, v]) => v);
    if (entries.length > 0) {
      checkPage(20);
      doc.setFillColor(13, 81, 217);
      doc.roundedRect(M, y, ANCHO, 9, 2, 2, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.text("CUESTIONARIO MÉDICO PREVIO", M + 4, y + 6);
      y += 12;

      const rowH = 6.5;
      entries.forEach((entry, i) => {
        checkPage(rowH + 2);
        const [pregunta, respuesta] = entry;
        if (i % 2 === 0) { doc.setFillColor(239, 243, 251); doc.rect(M, y, ANCHO, rowH, "F"); }
        // Respuesta (Si/No) — badge colored
        const esSi = String(respuesta).toLowerCase() === "si" || String(respuesta).toLowerCase() === "sí";
        doc.setFillColor(esSi ? 254 : 240, esSi ? 226 : 253, esSi ? 226 : 244);
        doc.roundedRect(M + 2, y + 1, 12, 4.5, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(6);
        doc.setTextColor(esSi ? 185 : 5, esSi ? 28 : 150, esSi ? 28 : 105);
        doc.text(String(respuesta).toUpperCase(), M + 8, y + 4, { align: "center" });
        // Pregunta
        doc.setFont("helvetica", "normal");
        doc.setFontSize(6.5);
        doc.setTextColor(...GRIS_TEXTO);
        doc.text(pregunta, M + 17, y + 4.5, { maxWidth: ANCHO - 20 });
        y += rowH;
      });
      y += 4;
    }
  }

  // ══════════════════════════════════════════════════════
  // TEXTO DEL CONSENTIMIENTO
  // ══════════════════════════════════════════════════════
  checkPage(20);
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
    doc.setTextColor(esTitulo ? AZUL_OSCURO[0] : GRIS_TEXTO[0], esTitulo ? AZUL_OSCURO[1] : GRIS_TEXTO[1], esTitulo ? AZUL_OSCURO[2] : GRIS_TEXTO[2]);
    doc.text(linea, M, y);
    y += esTitulo ? 5 : 4.2;
  }

  y += 6;
  checkPage(55);

  // ══════════════════════════════════════════════════════
  // FIRMAS
  // ══════════════════════════════════════════════════════
  const FIRMA_H = 46;
  doc.setFillColor(239, 243, 251);
  doc.roundedRect(M, y, ANCHO, FIRMA_H, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...AZUL_OSCURO);
  doc.text("CONSENTIMIENTO — FIRMAS", M + 4, y + 7);

  const firmaImgH = 16;
  const firmaImgY = y + 10;
  const firmaLineY = firmaImgY + firmaImgH + 2;
  const firmaW = ANCHO / 2 - 8;

  if (datos.firmaConsentimiento) {
    try {
      const fmt = datos.firmaConsentimiento.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(datos.firmaConsentimiento, fmt, M + 4, firmaImgY, firmaW, firmaImgH);
    } catch { /* firma inválida */ }
  }

  const x2 = M + ANCHO / 2 + 4;
  if (datos.firmaDoctor) {
    try {
      const fmt = datos.firmaDoctor.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
      doc.addImage(datos.firmaDoctor, fmt, x2, firmaImgY, firmaW, firmaImgH);
    } catch { /* imagen inválida */ }
  }

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

  // ══════════════════════════════════════════════════════
  // APROBACIÓN / RECHAZO MÉDICO
  // ══════════════════════════════════════════════════════
  if (datos.estadoPDF === "APROBADO" && datos.aprobadoPor) {
    checkPage(55);
    doc.setFillColor(...VERDE);
    doc.roundedRect(M, y, ANCHO, 10, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("✓ VISTO BUENO MÉDICO — CONSENTIMIENTO APROBADO", M + 4, y + 6.5);
    y += 14;

    checkPage(45);
    doc.setFillColor(...VERDE_CLARO);
    doc.roundedRect(M, y, ANCHO, 44, 2, 2, "F");
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, ANCHO, 44, 2, 2, "S");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(6, 78, 59);
    doc.text("DATOS DE APROBACIÓN", M + 4, y + 8);

    let ay = y + 15;
    for (const [label, valor] of [
      ["Aprobado por", datos.aprobadoPor],
      ["Fecha de aprobación", datos.fechaAprobacion ?? "—"],
      ["IPS", datos.ipsNombre],
    ]) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(...GRIS_CLARO);
      doc.text(String(label), M + 4, ay);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(17, 24, 39);
      doc.text(String(valor), M + 4, ay + 4);
      ay += 10;
    }

    const firmaAprobX = M + ANCHO / 2 + 4;
    if (datos.firmaAprobador) {
      try {
        const fmt = datos.firmaAprobador.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
        doc.addImage(datos.firmaAprobador, fmt, firmaAprobX, y + 10, firmaW, 16);
      } catch { /* imagen inválida */ }
    }
    doc.setDrawColor(134, 239, 172);
    doc.setLineWidth(0.5);
    doc.line(firmaAprobX, y + 28, firmaAprobX + firmaW, y + 28);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...GRIS_CLARO);
    doc.text("Firma del médico aprobador", firmaAprobX, y + 32);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(6, 78, 59);
    doc.text(datos.aprobadoPor, firmaAprobX, y + 36);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...GRIS_CLARO);
    doc.text(datos.ipsRm, firmaAprobX, y + 40);
    y += 50;

  } else if (datos.estadoPDF === "RECHAZADO") {
    checkPage(22);
    doc.setFillColor(254, 226, 226);
    doc.roundedRect(M, y, ANCHO, 16, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28);
    doc.text("✕ CONSENTIMIENTO RECHAZADO POR EL MÉDICO", M + 4, y + 6);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("El paciente debe ser informado del motivo de rechazo.", M + 4, y + 11);
    y += 22;
  }

  // ══════════════════════════════════════════════════════
  // PIE DE PÁGINA EN TODAS LAS PÁGINAS
  // ══════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFillColor(...AZUL_OSCURO);
    doc.rect(0, 285, W, 12, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(197, 213, 240);
    doc.text(
      `© ${new Date().getFullYear()} ${datos.ipsNombre} · NIT ${datos.ipsNit} · CliniSign by JM Ingeniero · Todos los derechos reservados`,
      M, 290
    );
    doc.text(`Página ${i} de ${totalPages}`, W - M, 290, { align: "right" });
  }

  return doc.output("blob");
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}
