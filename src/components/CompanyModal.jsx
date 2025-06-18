import React, { useState, useEffect } from 'react';
import vdler from '../data/vd.json';
import iller from '../data/il.json';
import ilceler from '../data/ilce.json';
import naceList from '../data/nace.json';

const DANGER_CLASSES = ['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli'];

const initialState = {
  company_name: '',
  tax_office: '',
  tax_number: '',
  nace_code: '',
  faaliyet_tanimi: '',
  sgk_number: '',
  address: '',
  city: '',
  district: '',
  working_start: '',
  working_end: '',
  danger_class: '',
};

const CompanyModal = ({ open, onClose, onSave, company, onDelete }) => {
  const [form, setForm] = useState(initialState);
  const [edit, setEdit] = useState(false);
  const [initialForm, setInitialForm] = useState(initialState);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [taxOfficeInput, setTaxOfficeInput] = useState('');
  const [showTaxOfficeList, setShowTaxOfficeList] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDeleteStep2, setShowDeleteStep2] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [naceInput, setNaceInput] = useState('');
  const [showNaceList, setShowNaceList] = useState(false);

  const allTaxOffices = Object.values(vdler).flat();
  const sortedIller = [...iller].sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  useEffect(() => {
    if (!company || !iller || iller.length === 0) return;
    const cityId = iller.find(il => il.name === company.city)?.id || '';
    const districts = cityId ? ilceler.filter((ilce) => ilce.il_id === cityId) : [];
    setFilteredDistricts(districts);
    const districtName = districts.find(d => d.name === company.district)?.name || '';
    const initial = {
      company_name: company.name || company.company_name || '',
      tax_office: company.tax_office || '',
      tax_number: company.tax_number || '',
      nace_code: company.nace_code || '',
      faaliyet_tanimi: company.faaliyet_tanimi || '',
      sgk_number: company.sgk_number || '',
      address: company.address || '',
      city: cityId,
      district: districtName,
      working_start: company.working_hours ? company.working_hours.split(' - ')[0] : '',
      working_end: company.working_hours ? company.working_hours.split(' - ')[1] : '',
      danger_class: company.danger_class || '',
    };
    setForm(initial);
    setInitialForm(initial);
    setTaxOfficeInput(company.tax_office || '');
    setNaceInput(company.nace_code || '');
    setEdit(false);
  }, [company, open]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (name === 'city') {
      setForm(f => ({ ...f, district: '' }));
      setFilteredDistricts(ilceler.filter((ilce) => ilce.il_id === value));
    }
  };

  const handleTaxOfficeInput = (e) => {
    setTaxOfficeInput(e.target.value);
    setForm(f => ({ ...f, tax_office: '' }));
    setShowTaxOfficeList(true);
  };
  const handleTaxOfficeSelect = (vdadi) => {
    setForm(f => ({ ...f, tax_office: vdadi }));
    setTaxOfficeInput(vdadi);
    setShowTaxOfficeList(false);
  };
  const handleTaxOfficeBlur = () => {
    setTimeout(() => setShowTaxOfficeList(false), 100);
  };
  const filteredTaxOffices = taxOfficeInput.length < 2 ? [] : allTaxOffices.filter(vd =>
    vd.vdadi.toLowerCase().startsWith(taxOfficeInput.toLowerCase())
  ).slice(0, 10);

  const handleNaceInput = (e) => {
    setNaceInput(e.target.value);
    setForm(f => ({ ...f, nace_code: '', faaliyet_tanimi: '', danger_class: '' }));
    setShowNaceList(true);
  };
  const handleNaceSelect = (nace) => {
    setForm(f => ({ ...f, nace_code: nace.nace_kod, faaliyet_tanimi: nace.tanim, danger_class: nace.tehlike_sinifi }));
    setNaceInput(nace.nace_kod);
    setShowNaceList(false);
  };
  const handleNaceBlur = () => {
    setTimeout(() => setShowNaceList(false), 100);
  };
  const filteredNace = naceInput.length < 2 ? [] : naceList.filter(nace =>
    nace.nace_kod.startsWith(naceInput) ||
    nace.tanim.toLowerCase().includes(naceInput.toLowerCase())
  ).slice(0, 10);

  const handleSaveClick = (e) => {
    e.preventDefault();
    setShowConfirmSave(true);
  };

  const handleConfirmSave = () => {
    if (!iller || iller.length === 0) return;
    const cityName = iller.find(il => il.id === form.city)?.name || '';
    onSave({ ...form, city: cityName, district: form.district });
    setEdit(false);
    setShowConfirmSave(false);
  };

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setForm(initialForm);
    setTaxOfficeInput(initialForm.tax_office || '');
    setNaceInput(initialForm.nace_code || '');
    setEdit(false);
    if (onClose) onClose();
  };
  const handleClose = () => {
    setForm(initialForm);
    setTaxOfficeInput(initialForm.tax_office || '');
    setNaceInput(initialForm.nace_code || '');
    setEdit(false);
    if (onClose) onClose();
  };
  const handleDelete = () => {
    setShowDeleteStep2(false);
    setShowConfirmDelete(false);
    if (onDelete) onDelete(company);
    if (onClose) onClose();
  };

  return open ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl" onClick={handleClose} type="button">&times;</button>
        <h2 className="text-xl font-bold mb-4">Firma Bilgileri</h2>
        <form onSubmit={handleSaveClick} className="space-y-3">
          <input name="company_name" value={form.company_name} onChange={handleChange} required placeholder="Firma Adı" className="w-full px-3 py-2 border rounded-lg font-semibold" disabled={!edit} />
          <div className="relative">
            <input
              name="tax_office"
              value={taxOfficeInput}
              onChange={handleTaxOfficeInput}
              onFocus={() => setShowTaxOfficeList(true)}
              onBlur={handleTaxOfficeBlur}
              required
              placeholder="Vergi Dairesi"
              className="w-full px-3 py-2 border rounded-lg"
              autoComplete="off"
              disabled={!edit}
            />
            {showTaxOfficeList && filteredTaxOffices.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border rounded-lg shadow max-h-48 overflow-auto mt-1">
                {filteredTaxOffices.map((vd) => (
                  <li
                    key={vd.kod}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    onMouseDown={() => handleTaxOfficeSelect(vd.vdadi)}
                  >
                    {vd.vdadi}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input name="tax_number" value={form.tax_number} onChange={handleChange} placeholder="Vergi Numarası" className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <div className="relative">
            <input
              name="nace_code"
              value={naceInput}
              onChange={handleNaceInput}
              onFocus={() => setShowNaceList(true)}
              onBlur={handleNaceBlur}
              required
              placeholder="NACE Kodu veya Faaliyet"
              className="w-full px-3 py-2 border rounded-lg"
              autoComplete="off"
              disabled={!edit}
            />
            {showNaceList && filteredNace.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 bg-white border rounded-lg shadow max-h-48 overflow-auto mt-1">
                {filteredNace.map((nace) => (
                  <li
                    key={nace.nace_kod}
                    className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                    onMouseDown={() => handleNaceSelect(nace)}
                  >
                    <span className="font-mono font-semibold">{nace.nace_kod}</span> - {nace.tanim}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <input name="faaliyet_tanimi" value={form.faaliyet_tanimi} readOnly placeholder="Faaliyet Tanımı" className="w-full px-3 py-2 border rounded-lg bg-gray-100 text-gray-700" />
          <select name="danger_class" value={form.danger_class || ''} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" disabled={!edit}>
            <option value="">Tehlike Sınıfı Seçiniz</option>
            <option value="Az Tehlikeli">Az Tehlikeli</option>
            <option value="Tehlikeli">Tehlikeli</option>
            <option value="Çok Tehlikeli">Çok Tehlikeli</option>
          </select>
          <input name="sgk_number" value={form.sgk_number} onChange={handleChange} placeholder="İşyeri SGK Sicil Numarası" className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <input name="address" value={form.address} onChange={handleChange} placeholder="Adres" className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <div className="flex gap-2">
            <select name="city" value={form.city} onChange={handleChange} required className="w-1/2 px-3 py-2 border rounded-lg" disabled={!edit}>
              <option value="">İl Seçiniz</option>
              {sortedIller.map((il) => (
                <option key={il.id} value={il.id}>{il.name}</option>
              ))}
            </select>
            <select name="district" value={form.district} onChange={handleChange} required className="w-1/2 px-3 py-2 border rounded-lg" disabled={!edit}>
              <option value="">İlçe Seçiniz</option>
              {filteredDistricts.map((ilce) => (
                <option key={ilce.id} value={ilce.name}>{ilce.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Başlangıç Saati</label>
              <input type="time" name="working_start" value={form.working_start} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
            </div>
            <div className="w-1/2">
              <label className="block text-xs text-gray-500 mb-1">Bitiş Saati</label>
              <input type="time" name="working_end" value={form.working_end} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
            </div>
          </div>
          <div className="flex gap-3 mt-6 items-center">
            {!edit ? (
              <>
                <div className="flex-1"></div>
                <button type="button" onClick={handleEdit} className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md">Düzenle</button>
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Kapat</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setShowConfirmDelete(true)} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md mr-auto">Sil</button>
                <button type="button" onClick={handleSaveClick} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Kaydet</button>
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Kapat</button>
              </>
            )}
          </div>
        </form>
        {showConfirmDelete && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/40">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
              <div className="text-lg font-semibold text-red-700">Firmanızı silmek üzeresiniz. Bu işlem <b>GERİ ALINAMAZ</b>.</div>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold" onClick={() => { setShowConfirmDelete(false); setShowDeleteStep2(true); }}>Devam Et</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold" onClick={() => setShowConfirmDelete(false)}>Kapat</button>
              </div>
            </div>
          </div>
        )}
        {showDeleteStep2 && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/40">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
              <div className="text-lg font-semibold text-red-700">Firmanızı sildiğinizde aşağıdaki verileriniz de silinecektir:<br/>Çalışanlar, Makineler, KKD, ve firmanıza atadığınız Tüm Raporlar.<br/>Onaylıyor musunuz?</div>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold" onClick={handleDelete}>Evet</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold" onClick={() => setShowDeleteStep2(false)}>Hayır</button>
              </div>
            </div>
          </div>
        )}
        {showConfirmSave && (
          <div className="fixed inset-0 flex items-center justify-center z-60 bg-black/40">
            <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col gap-4">
              <div className="text-lg font-semibold">Verileriniz güncellenecektir, onaylıyor musunuz?</div>
              <div className="flex gap-4 justify-end">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold" onClick={handleConfirmSave}>Evet</button>
                <button className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold" onClick={() => setShowConfirmSave(false)}>Hayır</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;
};

export default CompanyModal; 