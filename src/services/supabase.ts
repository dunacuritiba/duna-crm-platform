import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dqrpsaadedsvccpbptea.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxcnBzYWFkZWRzdmNjcGJwdGVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyNzA5MzcsImV4cCI6MjEwOTg0NjkzN30.6QxzAXQoE1wq2-TxXyRQfrnrYXDrTk-GskefCucklo4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
