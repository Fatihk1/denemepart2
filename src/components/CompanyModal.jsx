import React, { useState, useEffect } from 'react';

const DANGER_CLASSES = ['Az Tehlikeli', 'Tehlikeli', 'Çok Tehlikeli'];

const CompanyModal = ({ open, onClose, onSave, company }) => {
  const [form, setForm] = useState({
    company_name: '',
    danger_class: '',
    employee_count: '',
    phone: '',
    email: ''
  });
  const [edit, setEdit] = useState(false);
  const [initialForm, setInitialForm] = useState(null);

  useEffect(() => {
    if (company) {
      const initial = {
        company_name: company.name || company.company_name || '',
        danger_class: company.danger_class || '',
        employee_count: company.employee_count || '',
        phone: company.phone || '',
        email: company.email || company.mail || ''
      };
      setForm(initial);
      setInitialForm(initial);
      setEdit(false);
    }
  }, [company, open]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();
    onSave(form);
    setEdit(false);
  };

  const handleEdit = () => setEdit(true);
  const handleCancel = () => {
    setForm(initialForm);
    setEdit(false);
    onClose();
  };
  const handleClose = () => {
    setForm(initialForm);
    setEdit(false);
    onClose();
  };

  return open ? (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl relative">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-2xl" onClick={handleClose}>&times;</button>
        <h2 className="text-xl font-bold mb-4">Firma Bilgileri</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input name="company_name" value={form.company_name} onChange={handleChange} required placeholder="Firma Adı" className="w-full px-3 py-2 border rounded-lg font-semibold" disabled={!edit} />
          <select name="danger_class" value={form.danger_class} onChange={handleChange} required className="w-full px-3 py-2 border rounded-lg" disabled={!edit}>
            <option value="">Tehlike Sınıfı</option>
            {DANGER_CLASSES.map(dc => <option key={dc} value={dc}>{dc}</option>)}
          </select>
          <input name="employee_count" value={form.employee_count} onChange={handleChange} required placeholder="Çalışan Sayısı" type="number" min={0} className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <input name="phone" value={form.phone} onChange={handleChange} required placeholder="Telefon" className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <input name="email" value={form.email} onChange={handleChange} required placeholder="Email" className="w-full px-3 py-2 border rounded-lg" disabled={!edit} />
          <div className="flex gap-3 mt-6 justify-end">
            {!edit ? (
              <>
                <button type="button" onClick={handleEdit} className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md">Düzenle</button>
                <button type="button" onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Kapat</button>
              </>
            ) : (
              <>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md">Kaydet</button>
                <button type="button" onClick={handleCancel} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md">Kapat</button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  ) : null;
};

export default CompanyModal; 