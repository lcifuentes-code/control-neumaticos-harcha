// ============================================================
// NEUMATRACK · Configuración Supabase
// ============================================================
const SUPABASE_URL  = 'https://pitijaenpnuedkclzhom.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdGlqYWVucG51ZWRrY2x6aG9tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NTQ5MjEsImV4cCI6MjA4OTMzMDkyMX0.HsdzwO0wxcmSQ3vEIaAbSE3EUAxq32IREKoiAWMxmy8';

const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON);
