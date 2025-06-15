import { supabase } from './supabaseClient';

export async function addReportIfNotExists({ company_id, type, target, created_by = 'user', valid_until = null }) {
  const { data: existing } = await supabase
    .from('reports')
    .select('id')
    .eq('company_id', company_id)
    .eq('type', type)
    .eq('target', target)
    .maybeSingle();

  if (!existing) {
    await supabase.from('reports').insert([
      { company_id, type, target, created_by, valid_until }
    ]);
  }
} 