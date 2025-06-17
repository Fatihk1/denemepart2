import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const GROUPS = [
  {
    key: 'genel',
    title: 'Genel Raporlar',
    types: [
      'İşveren ISG Eğitim Belgesi',
      'Risk Değerlendirme Raporu',
      'Acil Durum Planı',
      'Yıllık Çalışma Planı',
      'Çalışan ISG Eğitim Belgesi',
    ],
  },
  {
    key: 'gorev',
    title: 'Görev Atama Belgeleri',
    types: ['Görev Atama Belgesi'],
  },
  {
    key: 'ekipman',
    title: 'Acil Durum Ekipmanları',
    types: ['Periyodik Bakım Çizelgesi (Yangın/İlkyardım)'],
  },
  {
    key: 'makine',
    title: 'Makine ve Kimyasallar',
    types: ['Periyodik Bakım Çizelgesi', 'MSDS'],
  },
  {
    key: 'saglik',
    title: 'Sağlık Raporları',
    types: ['Sağlık Raporu'],
  },
];

const ReportSection = ({ companyId }) => {
  const [reports, setReports] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('reports')
        .select('*')
        .eq('company_id', companyId);
      setReports(data || []);
    };
    if (companyId) fetchReports();
  }, [companyId]);

  const handleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCheck = (id) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Gruplama
  const grouped = GROUPS.map(group => {
    let groupReports = reports.filter(r => group.types.includes(r.type));
    // Görev Atama Belgeleri için görev adı da göster
    if (group.key === 'gorev') {
      groupReports = groupReports.map(r => ({ ...r, display: `${r.target} ${r.gorev ? '(' + r.gorev + ')' : ''}`.trim() }));
    } else if (group.key === 'genel') {
      groupReports = groupReports.map(r => ({ ...r, display: r.type }));
    } else if (group.key === 'ekipman' || group.key === 'makine') {
      groupReports = groupReports.map(r => ({ ...r, display: `${r.type}${r.target ? ' (' + r.target + ')' : ''}`.trim() }));
    } else {
      groupReports = groupReports.map(r => ({ ...r, display: r.target || r.type }));
    }
    return { ...group, reports: groupReports };
  });

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-xl font-bold mb-4">Rapor Listesi</h2>
      <div className="flex flex-col gap-4">
        {grouped.map(group => (
          <div key={group.key} className="border rounded-xl shadow-sm">
            <button
              className="w-full flex justify-between items-center px-4 py-3 font-semibold text-lg bg-gray-100 rounded-t-xl focus:outline-none"
              onClick={() => handleExpand(group.key)}
            >
              <span>{group.title}</span>
              <span className={`transform transition-transform ${expanded[group.key] ? 'rotate-90' : ''}`}>▶</span>
            </button>
            {expanded[group.key] && (
              <div className="divide-y">
                {group.reports.length === 0 ? (
                  <div className="px-4 py-3 text-gray-400">Kayıt yok</div>
                ) : (
                  group.reports.map(r => (
                    <div key={r.id} className="flex items-center px-4 py-2 gap-4">
                      <input
                        type="checkbox"
                        checked={!!checked[r.id]}
                        onChange={() => handleCheck(r.id)}
                        className="w-5 h-5 accent-blue-600"
                      />
                      <span className="flex-1 text-base">{r.display}</span>
                      {/* id ve diğer bilgiler state'te tutuluyor */}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportSection; 