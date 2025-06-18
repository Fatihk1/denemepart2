// n8n test webhook linki
const N8N_TEST_WEBHOOK_URL = 'https://n8n.srv807771.hstgr.cloud/webhook-test/450787bc-537b-4005-b4c8-c1efdc2aa0cd';

export async function sendRiskImagesToWebhook(selectedImages, selectedCompanyId) {
  if (!selectedImages || selectedImages.length === 0) {
    alert('Lütfen en az bir fotoğraf seçin.');
    return;
  }
  const formData = new FormData();
  selectedImages.forEach((img) => {
    formData.append('data[]', img.file);
  });
  if (selectedCompanyId) {
    formData.append('companyId', selectedCompanyId);
  }
  try {
    const response = await fetch(N8N_TEST_WEBHOOK_URL, {
      method: 'POST',
      body: formData,
    });
    if (response.ok) {
      alert('Fotoğraflar başarıyla gönderildi!');
    } else {
      alert('Gönderim sırasında hata oluştu.');
    }
  } catch (err) {
    alert('Bir hata oluştu: ' + err.message);
  }
} 