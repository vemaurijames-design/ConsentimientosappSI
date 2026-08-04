import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL  ?? "";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";
const BUCKET        = import.meta.env.VITE_SUPABASE_BUCKET ?? "consentimientos";

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Sube un PDF (Blob) a Supabase Storage y devuelve la URL pública permanente.
 * Retorna null si Supabase no está configurado (modo offline).
 */
export async function subirPDF(
  pdfBlob: Blob,
  radicado: string,
  pacienteDoc: string
): Promise<string | null> {
  if (!supabase) {
    console.warn("Supabase no configurado — PDF no subido a la nube.");
    return null;
  }

  const fecha    = new Date().toISOString().slice(0, 10);
  const fileName = `${fecha}/${pacienteDoc}_${radicado}.pdf`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, pdfBlob, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    console.error("Error subiendo PDF:", error.message);
    return null;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data?.publicUrl ?? null;
}
