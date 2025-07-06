import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { sendRiskImagesToWebhook } from '../lib/aiReportApi';
import html2pdf from 'html2pdf.js';
import riskReportTemplate from '../templates/riskReport.html?raw';

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
  const [showUpload, setShowUpload] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [riskResults, setRiskResults] = useState([]);
  const [currentRiskIndex, setCurrentRiskIndex] = useState(0);
  const [removedRisks, setRemovedRisks] = useState([]);
  const [editedRisks, setEditedRisks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editRisk, setEditRisk] = useState(null);
  const [showRemoveWarning, setShowRemoveWarning] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [initialRiskCount, setInitialRiskCount] = useState(0);
  const [viewedRisks, setViewedRisks] = useState([]);

  const handleClosePopup = () => {
    setPopupReport(null);
    setShowUpload(false);
    setSelectedImage(null);
    setPreviewUrl(null);
    setSelectedImages([]);
  };

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
    const isRisk = popupReport.type === 'Risk Değerlendirme Raporu';

    // Görsel seçilince önizleme (çoklu)
    const handleImageChange = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        const newImages = files.map(file => ({ file, url: URL.createObjectURL(file) }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    };

    // Kamera ile fotoğraf çekme (çoklu)
    const handleTakePhoto = (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        const newImages = files.map(file => ({ file, url: URL.createObjectURL(file) }));
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    };

    // Fotoğraf silme
    const handleRemoveImage = (url) => {
      setSelectedImages(prev => prev.filter(img => img.url !== url));
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
        <div className={`bg-white p-6 rounded-xl shadow-xl min-w-[320px] max-w-md w-full flex flex-col gap-4 transition-all duration-500 ${showUpload ? 'max-h-[90vh]' : ''}`} style={{ maxHeight: showUpload ? '90vh' : '320px', position: 'relative' }}>
          {/* Sağ üst köşe X butonu */}
          <button
            type="button"
            onClick={handleClosePopup}
            aria-label="Kapat"
            className="absolute top-2 right-2 z-10 bg-white border border-gray-300 rounded-full p-1 shadow hover:bg-gray-100 transition w-8 h-8 flex items-center justify-center"
            style={{lineHeight:0}}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500"><path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" /></svg>
          </button>
          <div className="text-lg font-bold mb-2">{popupReport.display || popupReport.type}</div>
          {isAI ? (
            <>
              {!showUpload && isRisk && (
                <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition" onClick={() => setShowUpload(true)}>AI Rapor Oluştur</button>
              )}
              {showUpload && isRisk && (
                <div className="flex flex-col gap-4 animate-slideDown">
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold">Görsel Yükle veya Fotoğraf Çek</label>
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-2 rounded-lg text-center">
                        Galeriden Yükle
                        <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
                      </label>
                      <label className="flex-1 cursor-pointer bg-green-100 hover:bg-green-200 text-green-700 px-3 py-2 rounded-lg text-center">
                        Fotoğraf Çek
                        <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleTakePhoto} />
                      </label>
                    </div>
                  </div>
                  {/* Seçilen fotoğraflar slider/kare */}
                  {selectedImages.length > 0 && (
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {selectedImages.map((img, idx) => (
                        <div key={img.url} className="relative flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-300 bg-gray-100 group">
                          <img src={img.url} alt={`Seçilen ${idx+1}`} className="object-cover w-full h-full" />
                          <button type="button" onClick={() => handleRemoveImage(img.url)} className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-1.5 shadow-lg group-hover:scale-110 transition border border-gray-300 w-7 h-7 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-red-500"><path fillRule="evenodd" d="M10 8.586l4.95-4.95a1 1 0 111.414 1.414L11.414 10l4.95 4.95a1 1 0 01-1.414 1.414L10 11.414l-4.95 4.95a1 1 0 01-1.414-1.414L8.586 10l-4.95-4.95A1 1 0 115.05 3.636L10 8.586z" clipRule="evenodd" /></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <button 
                    className={`w-full py-2 text-white rounded-lg font-semibold transition ${
                      isCompressing 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`} 
                    onClick={handleStartAnalysis}
                    disabled={isCompressing}
                  >
                    {isCompressing ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Görseller Sıkıştırılıyor...
                      </div>
                    ) : (
                      'AI ile Tehlike Analizi Başlat'
                    )}
                  </button>
                  <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold mt-2" onClick={handleClosePopup}>Kapat</button>
                </div>
              )}
              {!isRisk && (
                <>
                  <button className="w-full py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition" onClick={() => alert('AI rapor oluşturma yakında!')}>AI Rapor Oluştur</button>
                  <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold mt-2" onClick={handleClosePopup}>Kapat</button>
                </>
              )}
            </>
          ) : (
            <>
              <div className="text-red-600 text-sm mb-2">Bu belge ilgili kurum ya da kuruluşlardan alınmalıdır.</div>
              <button className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold" onClick={handleClosePopup}>Kapat</button>
            </>
          )}
        </div>
      </div>
    );
  };

  // AI analiz başlatma fonksiyonu
  const handleStartAnalysis = async () => {
    if (selectedImages.length === 0) {
      alert('Lütfen en az bir fotoğraf seçin.');
      return;
    }
    setIsCompressing(true);
    try {
      const result = await sendRiskImagesToWebhook(selectedImages, selectedCompanyId);
      setIsCompressing(false);
      if (result) {
        const risks = Array.isArray(result) && result[0]?.json ? result.map(item => ({...item.json, durum: 'etkin'})) : result.map(r => ({...r, durum: 'etkin'}));
        setRiskResults(risks);
        setInitialRiskCount(risks.length);
        setCurrentRiskIndex(0);
        setEditedRisks([]);
        setEditMode(false);
        setEditRisk(null);
        setShowSummary(false);
        setViewedRisks([0]);
        handleClosePopup();
      }
    } catch (error) {
      setIsCompressing(false);
      console.error('Analiz hatası:', error);
    }
  };

  const handleRiskStatusToggle = () => {
    const updated = [...riskResults];
    updated[currentRiskIndex].durum = updated[currentRiskIndex].durum === 'etkin' ? 'giderildi' : 'etkin';
    setRiskResults(updated);
  };

  const handleEdit = () => {
    setEditMode(true);
    setEditRisk({ ...riskResults[currentRiskIndex] });
  };

  const handleEditChange = (field, value) => {
    setEditRisk(prev => ({ ...prev, [field]: value, risk_puani: field === 'etki' || field === 'olasilik' ? (parseInt(field === 'etki' ? value : prev.etki) * parseInt(field === 'olasilik' ? value : prev.olasilik)) : prev.risk_puani }));
  };

  const saveEdit = () => {
    const updated = [...riskResults];
    updated[currentRiskIndex] = editRisk;
    if (!editedRisks.includes(currentRiskIndex)) {
      setEditedRisks([...editedRisks, currentRiskIndex]);
    }
    setRiskResults(updated);
    setEditMode(false);
    setEditRisk(null);
  };

  const goToNextRisk = () => {
    if (!viewedRisks.includes(currentRiskIndex)) {
      setViewedRisks([...viewedRisks, currentRiskIndex]);
    }
    if (currentRiskIndex < riskResults.length - 1) {
      setCurrentRiskIndex(currentRiskIndex + 1);
      if (!viewedRisks.includes(currentRiskIndex + 1)) {
        setViewedRisks([...viewedRisks, currentRiskIndex + 1]);
      }
      setEditMode(false);
      setEditRisk(null);
    }
  };

  const goToPrevRisk = () => {
    if (currentRiskIndex > 0) {
      setCurrentRiskIndex(currentRiskIndex - 1);
      if (!viewedRisks.includes(currentRiskIndex - 1)) {
        setViewedRisks([...viewedRisks, currentRiskIndex - 1]);
      }
      setEditMode(false);
      setEditRisk(null);
    }
  };

  const allViewed = viewedRisks.length === riskResults.length;
  const risksToSave = riskResults.filter(r => r.durum === 'etkin');
  const removedCount = riskResults.filter(r => r.durum === 'giderildi').length;
  const editedCount = editedRisks.length;
  const approvedCount = risksToSave.length;

  const handleSaveReport = async () => {
    if (!selectedCompanyId || !riskResults) {
      alert("Firma ve risk verisi eksik!");
      return;
    }
    const { error } = await supabase.from('risk_reports').insert([
      {
        company_id: selectedCompanyId,
        risk_json: riskResults,
        // İstersen report_json, title, description gibi alanları da ekleyebilirsin
      }
    ]);
    if (error) {
      alert("Kayıt sırasında hata oluştu: " + error.message);
    } else {
      alert("AI raporu başarıyla kaydedildi!");
      setRiskResults([]); // null değil, boş dizi!
      setShowSummary(false);
    }
  };

  // HTML şablonunu doldurma fonksiyonu
  function fillTemplate(template, data) {
    // Ekip tablosu
    const ekipTablosu = data.ekip.map(e =>
      `<tr>
        <td style="border:1px solid #aaa; padding:6px;">${e.ad}</td>
        <td style="border:1px solid #aaa; padding:6px;">${e.gorev}</td>
        <td style="border:1px solid #aaa; padding:6px;">${e.belge}</td>
      </tr>`
    ).join('');
    // Risk tablosu
    const riskTablosu = data.riskler.map(r =>
      `<tr>
        <td style="border:1px solid #aaa; padding:6px;">${r.tehlike_kaynagi}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.tehlike}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.risk}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.olasilik}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.etki}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.risk_puani}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.azaltici_onleyici_faaliyet}</td>
        <td style="border:1px solid #aaa; padding:6px;">${r.durum}</td>
      </tr>`
    ).join('');
    // İmza alanı
    const ekipImza = data.ekip.map(e => e.ad).concat(['', '', '']).slice(0, 3);
    return template
      .replace('{{isyeri_adi}}', data.isyeri_adi)
      .replace('{{adres}}', data.adres)
      .replace('{{faaliyet_konusu}}', data.faaliyet_konusu)
      .replace('{{nace_kodu}}', data.nace_kodu)
      .replace('{{calisan_sayisi}}', data.calisan_sayisi)
      .replace('{{rapor_tarihi}}', data.rapor_tarihi)
      .replace('{{ekip_tablosu}}', ekipTablosu)
      .replace('{{risk_tablosu}}', riskTablosu)
      .replace('{{ekip_1}}', ekipImza[0])
      .replace('{{ekip_2}}', ekipImza[1])
      .replace('{{ekip_3}}', ekipImza[2]);
  }

  function downloadPdfFromHtml(htmlString) {
    const element = document.createElement('div');
    element.innerHTML = htmlString;
    html2pdf()
      .set({ margin: 10, filename: 'risk-analiz-raporu.pdf', html2canvas: { scale: 2 } })
      .from(element)
      .save();
  }

  // Raporu Oluştur butonunda kullanılacak fonksiyon
  const handleDownloadReport = () => {
    if (!selectedCompany || !riskResults) {
      alert('Firma ve risk verisi eksik!');
      return;
    }
    // Sadece o anki riskResults ile çalış
    const data = {
      isyeri_adi: selectedCompany.company_name,
      adres: selectedCompany.address,
      faaliyet_konusu: selectedCompany.activity,
      nace_kodu: selectedCompany.nace_code,
      calisan_sayisi: selectedCompany.employee_count,
      rapor_tarihi: new Date().toLocaleDateString('tr-TR'),
      ekip: selectedCompany.team || [], // örnek: [{ad: '...', gorev: '...', belge: '...'}]
      riskler: riskResults
    };
    const html = fillTemplate(riskReportTemplate, data);
    downloadPdfFromHtml(html);
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
      {Array.isArray(riskResults) && riskResults.length > 0 && !showSummary && currentRiskIndex < riskResults.length && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white p-6 rounded-xl shadow-xl min-w-[400px] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="absolute top-2 left-4 text-sm text-gray-500">{'<'} {currentRiskIndex + 1}/{initialRiskCount} {'>'}</div>
            <div className="text-lg font-bold mb-2 text-center">Risk Analiz Sonucu</div>
            <div className="border-t border-b py-2 mb-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="font-semibold">Tehlike Kaynağı:</div>
                <div>{editMode ? <input className="border rounded p-1 w-full" value={editRisk.tehlike_kaynagi} onChange={e => handleEditChange('tehlike_kaynagi', e.target.value)} /> : riskResults[currentRiskIndex].tehlike_kaynagi}</div>
                <div className="font-semibold">Tehlike:</div>
                <div>{editMode ? <input className="border rounded p-1 w-full" value={editRisk.tehlike} onChange={e => handleEditChange('tehlike', e.target.value)} /> : riskResults[currentRiskIndex].tehlike}</div>
                <div className="font-semibold">Risk:</div>
                <div>{editMode ? <input className="border rounded p-1 w-full" value={editRisk.risk} onChange={e => handleEditChange('risk', e.target.value)} /> : riskResults[currentRiskIndex].risk}</div>
                <div className="font-semibold">Olasılık:</div>
                <div>{editMode ? <select className="border rounded p-1 w-full" value={editRisk.olasilik} onChange={e => handleEditChange('olasilik', e.target.value)}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select> : riskResults[currentRiskIndex].olasilik}</div>
                <div className="font-semibold">Etki:</div>
                <div>{editMode ? <select className="border rounded p-1 w-full" value={editRisk.etki} onChange={e => handleEditChange('etki', e.target.value)}>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}</select> : riskResults[currentRiskIndex].etki}</div>
                <div className="font-semibold">Risk Puanı:</div>
                <div>{editMode ? <input className="border rounded p-1 w-full bg-gray-100" value={editRisk.risk_puani} readOnly /> : riskResults[currentRiskIndex].risk_puani}</div>
                <div className="font-semibold">Azaltıcı Önlem:</div>
                <div>{editMode ? <input className="border rounded p-1 w-full" value={editRisk.azaltici_onleyici_faaliyet} onChange={e => handleEditChange('azaltici_onleyici_faaliyet', e.target.value)} /> : riskResults[currentRiskIndex].azaltici_onleyici_faaliyet}</div>
                <div className="font-semibold">Durum:</div>
                <div className={riskResults[currentRiskIndex].durum === 'giderildi' ? 'text-red-600 font-bold' : 'text-green-700 font-bold'}>{riskResults[currentRiskIndex].durum === 'giderildi' ? 'Giderildi' : 'Etkin'}</div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <button className={`flex-1 py-2 rounded-lg font-semibold ${riskResults[currentRiskIndex].durum === 'giderildi' ? 'bg-gray-400 text-white' : 'bg-red-600 text-white'}`} onClick={handleRiskStatusToggle}>
                {riskResults[currentRiskIndex].durum === 'giderildi' ? 'Etkinleştir' : 'Risk Giderildi'}
              </button>
              <button className="flex-1 py-2 bg-yellow-500 text-white rounded-lg font-semibold" onClick={editMode ? saveEdit : handleEdit}>{editMode ? 'Kaydet' : 'Düzenle'}</button>
              <button className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold" onClick={goToNextRisk} disabled={currentRiskIndex === riskResults.length - 1}>Onayla</button>
            </div>
            <div className="flex justify-between mt-2">
              {currentRiskIndex > 0 && (
                <button className="p-2 text-xl" onClick={goToPrevRisk}>&larr;</button>
              )}
              {currentRiskIndex < riskResults.length - 1 && (
                <button className="p-2 text-xl" onClick={goToNextRisk}>&rarr;</button>
              )}
            </div>
            <div className="mt-4 w-full">
              {allViewed ? (
                <button className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold" onClick={() => setShowSummary(true)}>
                  {approvedCount} Risk ile Rapor Oluştur
                </button>
              ) : (
                <div className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold text-center">
                  Raporu oluşturmak için tüm riskleri görüntülemeniz gerekmektedir.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {showSummary && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
          <div className="bg-white p-6 rounded-xl shadow-xl min-w-[340px] max-w-lg w-full flex flex-col gap-4 relative">
            <div className="text-lg font-bold mb-2">Risk Analiz Raporu Özeti</div>
            <div>Tespit edilen risk sayısı: {initialRiskCount}</div>
            <div>Kaldırılan risk sayısı: {removedCount}</div>
            <div>Düzenlenen risk sayısı: {editedCount}</div>
            <div>Onaylanan risk sayısı: {approvedCount}</div>
            <div className="mt-2 font-semibold">Onaylanan ve Düzenlenen Toplam {approvedCount} Risk ile Risk Analiz Raporunuz Oluşturulacaktır.</div>
            <button className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold mt-4" onClick={handleSaveReport}>Raporu Supabase'ye Kaydet</button>
            <button className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold mt-2" onClick={handleDownloadReport}>PDF Olarak İndir</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiReporter; 