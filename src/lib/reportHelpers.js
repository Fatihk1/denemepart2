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

export async function syncEmployeeHealthReports(company_id) {
  // 1. O şirkete ait tüm sağlık raporu satırlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'Sağlık Raporu');

  // 2. O şirkete ait tüm çalışanları çek
  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her çalışan için yeni sağlık raporu satırı ekle
  if (employees && employees.length > 0) {
    const inserts = employees.map(emp => ({
      company_id,
      type: 'Sağlık Raporu',
      target: `${emp.first_name} ${emp.last_name}`,
      target_id: emp.id,
      target_table: 'employees',
      created_by: 'user',
      status: emp.health_report ? 'var' : 'yok',
      valid_until: emp.report_refresh || null
    }));
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
}

export async function syncMachineMaintenanceReports(company_id) {
  // 1. O şirkete ait tüm Periyodik Bakım Çizelgesi raporlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'Periyodik Bakım Çizelgesi');

  // 2. O şirkete ait tüm makineleri çek
  const { data: machines } = await supabase
    .from('machines')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her makine için yeni Periyodik Bakım Çizelgesi raporu ekle
  if (machines && machines.length > 0) {
    const inserts = machines.map(machine => ({
      company_id,
      type: 'Periyodik Bakım Çizelgesi',
      target: machine.name || machine.machine_name || '',
      target_id: machine.id,
      target_table: 'machines',
      created_by: 'user',
      status: machine.maintenance_validity_date ? 'var' : 'yok',
      valid_until: machine.maintenance_validity_date || null
    }));
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
}

export async function syncChemicalMsdsReports(company_id) {
  // 1. O şirkete ait tüm MSDS raporlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'MSDS');

  // 2. O şirkete ait tüm kimyasalları çek
  const { data: chemicals } = await supabase
    .from('chemicals')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her kimyasal için yeni MSDS raporu ekle
  if (chemicals && chemicals.length > 0) {
    const inserts = chemicals.map(chem => ({
      company_id,
      type: 'MSDS',
      target: chem.name || chem.chemical_name || '',
      target_id: chem.id,
      target_table: 'chemicals',
      created_by: 'user',
      status: chem.msds ? 'var' : 'yok',
      valid_until: null
    }));
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
} 