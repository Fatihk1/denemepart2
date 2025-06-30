/**
 * Görseli maksimum 512px uzun kenar olacak şekilde yeniden boyutlandırır
 * @param {File} file - Sıkıştırılacak görsel dosyası
 * @param {number} maxWidth - Maksimum genişlik (varsayılan: 512)
 * @param {number} maxHeight - Maksimum yükseklik (varsayılan: 512)
 * @param {number} quality - JPEG kalitesi 0-1 arası (varsayılan: 0.6)
 * @returns {Promise<File>} Sıkıştırılmış görsel dosyası
 */
export async function compressImage(file, maxWidth = 512, maxHeight = 512, quality = 0.6) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Orijinal boyutları al
      let { width, height } = img;
      
      // En boy oranını koru
      if (width > height) {
        // Yatay görsel
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        // Dikey görsel
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Canvas boyutunu ayarla
      canvas.width = width;
      canvas.height = height;
      
      // Görseli canvas'a çiz
      ctx.drawImage(img, 0, 0, width, height);
      
      // Canvas'ı blob'a çevir
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // Yeni dosya oluştur
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Görsel sıkıştırılamadı'));
          }
        },
        'image/jpeg',
        quality
      );
    };
    
    img.onerror = () => {
      reject(new Error('Görsel yüklenemedi'));
    };
    
    // Görseli yükle
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Birden fazla görseli sıkıştırır
 * @param {File[]} files - Sıkıştırılacak görsel dosyaları
 * @param {number} maxWidth - Maksimum genişlik
 * @param {number} maxHeight - Maksimum yükseklik
 * @param {number} quality - JPEG kalitesi
 * @returns {Promise<File[]>} Sıkıştırılmış görsel dosyaları
 */
export async function compressImages(files, maxWidth = 512, maxHeight = 512, quality = 0.6) {
  const compressedFiles = [];
  
  for (const file of files) {
    try {
      const compressedFile = await compressImage(file, maxWidth, maxHeight, quality);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error(`Görsel sıkıştırma hatası: ${error.message}`);
      // Hata durumunda orijinal dosyayı ekle
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
} 