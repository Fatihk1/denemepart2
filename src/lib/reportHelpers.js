import { supabase } from './supabaseClient';

export async function addReportIfNotExists({ company_id, type, target, created_by = 'user', valid_until = null, target_id = null, target_table = null, status = null }) {
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('company_id', company_id)
    .eq('type', type)
    .eq('target', target)
    .maybeSingle();

  if (!existing) {
    await supabase.from('reports').insert([
      { company_id, type, target, created_by, valid_until, target_id, target_table, status }
    ]);
  }
} 