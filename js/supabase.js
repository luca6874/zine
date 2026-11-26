
// ========================================
// CINE DE NOSOTROS
// CONEXIÓN CON SUPABASE
// ========================================

const SUPABASE_URL = "https://jbpwzuntcnxftygnqjdx.supabase.co";
const SUPABASE_KEY = "sb_publishable_rbfnpsKUhVjDZCC1evpACw_dltCe56n";

// Crear conexión
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// Hacer disponible para los demás archivos
window.supabaseClient = supabaseClient;

console.log("Conexión con Supabase inicializada");
