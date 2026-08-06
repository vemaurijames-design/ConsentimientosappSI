import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL       ?? "";
const SUPABASE_KEY  = import.meta.env.VITE_SUPABASE_ANON_KEY  ?? "";
const SERVICE_KEY   = import.meta.env.VITE_SUPABASE_SERVICE_KEY ?? "";
const BUCKET        = import.meta.env.VITE_SUPABASE_BUCKET     ?? "consentimientos";

// Cliente público (anon) — lectura de licencia + subida de PDFs
export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

// Cliente admin (service role) — escritura de licencias desde panel master
export const supabaseAdmin = SUPABASE_URL && SERVICE_KEY
  ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;

// ─── PDF Storage ──────────────────────────────────────────────────────────────

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
    .upload(fileName, pdfBlob, { contentType: "application/pdf", upsert: true });
  if (error) { console.error("Error subiendo PDF:", error.message); return null; }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data?.publicUrl ?? null;
}

// ─── Licencias ───────────────────────────────────────────────────────────────

export interface Licencia {
  id:             string;
  client_id:      string;
  nombre_cliente: string;
  nit:            string;
  plan:           "mensual" | "trimestral" | "semestral" | "anual";
  expira_en:      string;   // ISO timestamp
  activo:         boolean;
  notas:          string;
  created_at:     string;
  updated_at:     string;
}

/** Lee la licencia del cliente actual (por VITE_CLIENT_ID) */
export async function getLicencia(clientId: string): Promise<Licencia | null> {
  if (!supabase || !clientId) return null;
  const { data, error } = await supabase
    .from("licencias")
    .select("*")
    .eq("client_id", clientId)
    .single();
  if (error) { console.warn("getLicencia:", error.message); return null; }
  return data as Licencia;
}

/** Lee TODAS las licencias (requiere service role key — solo master admin) */
export async function getAllLicencias(): Promise<Licencia[]> {
  const client = supabaseAdmin ?? supabase;
  if (!client) return [];
  const { data, error } = await client
    .from("licencias")
    .select("*")
    .order("expira_en", { ascending: true });
  if (error) { console.error("getAllLicencias:", error.message); return []; }
  return (data ?? []) as Licencia[];
}

/** Crea o actualiza una licencia (requiere service role key) */
export async function upsertLicencia(lic: Partial<Licencia> & { client_id: string }): Promise<Licencia | null> {
  const client = supabaseAdmin ?? supabase;
  if (!client) return null;
  const { data, error } = await client
    .from("licencias")
    .upsert({ ...lic, updated_at: new Date().toISOString() }, { onConflict: "client_id" })
    .select()
    .single();
  if (error) { console.error("upsertLicencia:", error.message); return null; }
  return data as Licencia;
}

/** Activa/desactiva una licencia */
export async function toggleLicencia(id: string, activo: boolean): Promise<boolean> {
  const client = supabaseAdmin ?? supabase;
  if (!client) return false;
  const { error } = await client
    .from("licencias")
    .update({ activo, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

/** Calcula días restantes hasta el vencimiento */
export function diasRestantes(expiraEn: string): number {
  const diff = new Date(expiraEn).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** Estado de la licencia */
export function estadoLicencia(lic: Licencia | null): "loading" | "ok" | "warning" | "expired" | "blocked" {
  if (!lic) return "loading";
  if (!lic.activo) return "blocked";
  const dias = diasRestantes(lic.expira_en);
  if (dias <= 0) return "expired";
  if (dias <= 3) return "warning";
  return "ok";
}
