import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbdxnhprhkionfaalkur.supabase.co';
const supabaseAnonKey = 'sb_publishable_WenUajUncm1ihzja8zR4lA_bnFsjwQ_';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
