import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import EmployeeSection from '../components/EmployeeSection';
import MachineSection from '../components/MachineSection';
import ChemicalSection from '../components/ChemicalSection';
import PpeSection from '../components/PpeSection';
import FireSection from '../components/FireSection';
import AssignmentSection from '../components/AssignmentSection';
import ReportSection from '../components/ReportSection';
import CompanyModal from '../components/CompanyModal';

const categories = [
  { key: 'employees', label: 'Çalışanlar' },
  { key: 'machines', label: 'Makineler' },
  { key: 'chemicals', label: 'Kimyasallar' },
  { key: 'ppe', label: 'KKD' },
  { key: 'fire', label: 'Yangın/İlkyardım' },
  { key: 'assignments', label: 'Görev Atama' },
  { key: 'reports', label: 'Rapor Listesi' },
];

const tableMap = {
  employees: 'employees',
  machines: 'machines',
  chemicals: 'chemicals',
  ppe: 'ppe_deliveries',
  fire: 'fire_first_aid_equipments',
  assignments: 'assignments',
  reports: 'reports'
};

const CompanyDetail = () => {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('employees');
  const [counts, setCounts] = useState({});
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      const { data } = await supabase.from('companies').select('*').eq('id', id).single();
      setCompany(data);
    };
    if (id) fetchCompany();
  }, [id]);

  useEffect(() => {
    const fetchCounts = async () => {
      const newCounts = {};
      for (const cat of categories) {
        const { count } = await supabase
          .from(tableMap[cat.key])
          .select('*', { count: 'exact', head: true })
          .eq('company_id', id);
        newCounts[cat.key] = count || 0;
      }
      setCounts(newCounts);
    };
    if (id) fetchCounts();
  }, [id]);

  const handleCompanySave = async (form) => {
    await supabase.from('companies').update({
      company_name: form.company_name,
      tax_office: form.tax_office,
      tax_number: form.tax_number,
      nace_code: form.nace_code,
      sgk_number: form.sgk_number,
      address: form.address,
      city: form.city,
      district: form.district,
      working_hours: form.working_start + ' - ' + form.working_end,
      danger_class: form.danger_class
    }).eq('id', id);
    setShowCompanyModal(false);
    const { data } = await supabase.from('companies').select('*').eq('id', id).single();
    setCompany(data);
  };

  if (!company) return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 cursor-pointer" onClick={() => setShowCompanyModal(true)}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-semibold">{company.name}</div>
              <div className="text-gray-600">Tehlike Sınıfı: {company.danger_class}</div>
              <div className="text-gray-600">Çalışan Sayısı: {company.employee_count}</div>
            </div>
            <div>
              <div className="text-gray-600">{company.phone}</div>
              <div className="text-gray-600">{company.email}</div>
            </div>
          </div>
        </div>
        <CompanyModal 
          open={showCompanyModal} 
          onClose={() => setShowCompanyModal(false)} 
          onSave={handleCompanySave} 
          onDelete={null}
          company={company} 
        />
        <div className="flex gap-4 mb-8 overflow-x-auto whitespace-nowrap">
          {categories.map(cat => (
            <div
              key={cat.key}
              className={`flex flex-col items-center px-4 py-2 rounded-xl shadow cursor-pointer transition border-2 flex-shrink-0 w-32 ${activeTab === cat.key ? 'border-blue-600 bg-white' : 'border-transparent bg-white/70 hover:bg-white'}`}
              onClick={() => setActiveTab(cat.key)}
            >
              <span className="font-semibold text-base">{cat.label}</span>
              <span className="text-xs text-gray-400 mt-1">{(counts[cat.key] ?? 0) + ' kayıt'}</span>
            </div>
          ))}
        </div>
        {activeTab === 'employees' && <EmployeeSection companyId={id} dangerClass={company.danger_class} />}
        {activeTab === 'machines' && <MachineSection companyId={id} />}
        {activeTab === 'chemicals' && <ChemicalSection companyId={id} />}
        {activeTab === 'ppe' && <PpeSection companyId={id} company={company} />}
        {activeTab === 'fire' && <FireSection companyId={id} />}
        {activeTab === 'assignments' && <AssignmentSection companyId={id} company={company} />}
        {activeTab === 'reports' && <ReportSection companyId={id} />}
      </div>
    </div>
  );
};

export default CompanyDetail;
