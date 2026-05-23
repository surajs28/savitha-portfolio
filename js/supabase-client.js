// js/supabase-client.js - Shared Supabase Client Initialization
const SUPABASE_URL = 'https://ivfcaobarjvoamlrmcdt.supabase.co';
const SUPABASE_KEY = 'sb_publishable_uNUXJ5dzviwyYNXXYPe9fQ_zKKfkyIi';

// Initialize Supabase Client (assumes local js/supabase.js is loaded)
let supabase = null;
if (window.supabase) {
  supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
} else {
  console.error('Supabase library is not loaded. Please make sure js/supabase.js is loaded before this script.');
}
