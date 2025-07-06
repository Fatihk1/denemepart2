import { compressImages } from './imageCompressor.js';

// n8n production webhook linki
const N8N_TEST_WEBHOOK_URL = 'https://n8n.srv807771.hstgr.cloud/webhook/450787bc-537b-4005-b4c8-c1efdc2aa0cd';

export async function sendRiskImagesToWebhook(selectedImages, selectedCompanyId) {
  if (!selectedImages || selectedImages.length === 0) {
    alert('Lütfen en az bir fotoğraf seçin.');
    return;
  }

  try {
    // Görselleri sıkıştır - 512px uzun kenar, %60 kalite
    const files = selectedImages.map(img => img.file);
    const compressedFiles = await compressImages(files, 512, 512, 0.6);
    
    const formData = new FormData();
    compressedFiles.forEach((file) => {
      formData.append('data[]', file);
    });
    
    if (selectedCompanyId) {
      formData.append('companyId', selectedCompanyId);
    }
    
    const response = await fetch(N8N_TEST_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    
    if (response.ok) {
      const data = await response.json();
      return data;
    } else {
      alert('Gönderim sırasında hata oluştu.');
      return null;
    }
  } catch (err) {
    alert('Bir hata oluştu: ' + err.message);
    return null;
  }
} 