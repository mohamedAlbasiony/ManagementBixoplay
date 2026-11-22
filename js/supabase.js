import { createClient } from
  "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

// New BIXOPLAY Supabase project
const supabaseUrl = "https://phrxmoszcbohodxedqff.supabase.co";

const supabaseKey = "sb_publishable_s5i--w6hLDaE2r2cI-Zrgw_id9yAKCM";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);