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

export async function syncPpeDeliveryReports(company_id) {
  // 1. O şirkete ait tüm KKD Teslim Tutanağı raporlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'KKD Teslim Tutanağı');

  // 2. O şirkete ait tüm ppe teslimlerini çek
  const { data: deliveries } = await supabase
    .from('ppe_deliveries')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her teslim için yeni KKD Teslim Tutanağı raporu ekle
  if (deliveries && deliveries.length > 0) {
    const inserts = deliveries.map(delivery => ({
      company_id,
      type: 'KKD Teslim Tutanağı',
      target: delivery.employee_first_name && delivery.employee_last_name ? `${delivery.employee_first_name} ${delivery.employee_last_name}` : '',
      target_id: delivery.id,
      target_table: 'ppe_deliveries',
      created_by: 'user',
      status: delivery.usage_instruction === 'var' ? 'var' : 'yok',
      valid_until: null
    }));
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
}

export async function syncFireAidMaintenanceReports(company_id) {
  // 1. O şirkete ait tüm Periyodik Bakım Çizelgesi (Yangın/İlkyardım) raporlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'Periyodik Bakım Çizelgesi (Yangın/İlkyardım)');

  // 2. O şirkete ait tüm yangın/ilkyardım ekipmanlarını çek
  const { data: equipments } = await supabase
    .from('fire_first_aid_equipments')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her ekipman için yeni Periyodik Bakım Çizelgesi raporu ekle
  if (equipments && equipments.length > 0) {
    const inserts = equipments.map(eq => {
      // Geçerlilik tarihi: last_check_date + period (gün cinsinden)
      let valid_until = null;
      if (eq.last_check_date && eq.period) {
        const d = new Date(eq.last_check_date);
        d.setDate(d.getDate() + Number(eq.period));
        valid_until = d.toISOString().slice(0, 10);
      }
      return {
        company_id,
        type: 'Periyodik Bakım Çizelgesi (Yangın/İlkyardım)',
        target: eq.equipment_type || '',
        target_id: eq.id,
        target_table: 'fire_first_aid_equipments',
        created_by: 'user',
        status: eq.last_check_date ? 'var' : 'yok',
        valid_until
      };
    });
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
}

export async function syncAssignmentReports(company_id) {
  // 1. O şirkete ait tüm Görev Atama Belgesi raporlarını sil
  await supabase
    .from('reports')
    .delete()
    .eq('company_id', company_id)
    .eq('type', 'Görev Atama Belgesi');

  // 2. O şirkete ait tüm atamaları çek
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('company_id', company_id);

  // 3. Her atama için yeni Görev Atama Belgesi raporu ekle
  if (assignments && assignments.length > 0) {
    const inserts = assignments.map(ass => ({
      company_id,
      type: 'Görev Atama Belgesi',
      target: ass.employee_id ? String(ass.employee_id) : '',
      target_id: ass.id,
      target_table: 'assignments',
      created_by: 'user',
      status: ass.assignment_form === 'Var' ? 'var' : 'yok',
      valid_until: null
    }));
    if (inserts.length > 0) {
      await supabase.from('reports').insert(inserts);
    }
  }
} 