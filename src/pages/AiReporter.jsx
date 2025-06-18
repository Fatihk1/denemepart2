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

const AI_REPORTABLE = [
  'Risk Değerlendirme Raporu',
  'Acil Durum Planı',
  'Yıllık Çalışma Planı',
  'Çalışan ISG Eğitim Belgesi',
  'Görev Atama Belgesi',
];

const AiReporter = () => {
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [popupReport, setPopupReport] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setCompanies([]);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (!error) setCompanies(data);
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      const found = companies.find(c => c.id === selectedCompanyId);
      setSelectedCompany(found || null);
      // Raporları çek
      const fetchReports = async () => {
        const { data } = await supabase
          .from('reports')
          .select('*')
          .eq('company_id', selectedCompanyId);
        setReports(data || []);
      };
      fetchReports();
    } else {
      setSelectedCompany(null);
      setReports([]);
    }
  }, [selectedCompanyId, companies]);

  const handleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Gruplama
  const grouped = GROUPS.map(group => {
    let groupReports = reports.filter(r => group.types.includes(r.type));
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

  // Popup içeriği
  const renderPopup = () => {
    if (!popupReport) return null;
    const isAI = AI_REPORTABLE.includes(popupReport.type) || (popupReport.type === 'Görev Atama Belgesi');
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
        <div className="bg-white p-6 rounded-xl shadow-xl min-w-[320px] max-w-md w-full flex flex-col gap-4">
          <div className="text-lg font-bold mb-2">{popupReport.display || popupReport.type}</div>
          {isAI ? (
            <>
              <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition" onClick={() => alert('AI rapor oluşturma yakında!')}>AI Rapor Oluştur</button>
              <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold mt-2" onClick={() => setPopupReport(null)}>Kapat</button>
            </>
          ) : (
            <>
              <div className="text-red-600 text-sm mb-2">Bu belge ilgili kurum ya da kuruluşlardan alınmalıdır.</div>
              <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold" onClick={() => setPopupReport(null)}>Kapat</button>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen w-screen flex flex-col items-start bg-fixed bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/src/assets/backgrounds/bg1.jpg)', backgroundColor: '#fff' }}>
      <div className="w-full max-w-2xl mx-auto bg-white bg-opacity-90 rounded-2xl shadow p-4 mt-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">AI Raportör</h1>
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2 text-left">Firma Seçiniz</label>
          {loading ? (
            <div className="text-gray-500">Firmalar yükleniyor...</div>
          ) : (
            <select
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
              value={selectedCompanyId}
              onChange={e => setSelectedCompanyId(e.target.value)}
            >
              <option value="">Firma seçin...</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          )}
        </div>
        {selectedCompany && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border text-sm text-gray-700">
            <div><b>Firma Adı:</b> {selectedCompany.company_name}</div>
            <div><b>Nace Kod:</b> {selectedCompany.nace_code}</div>
            <div><b>Tehlike S:</b> {selectedCompany.danger_class}</div>
            <div><b>Çalışan S:</b> {selectedCompany.employee_count ?? 0}</div>
          </div>
        )}
        {/* Accordion rapor listesi */}
        {selectedCompany && (
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
                        <div key={r.id} className="flex items-center px-4 py-2 gap-4 cursor-pointer hover:bg-indigo-50" onClick={() => setPopupReport(r)}>
                          <span className="flex-1 text-base">{r.display}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {renderPopup()}
    </div>
  );
};

export default AiReporter; 