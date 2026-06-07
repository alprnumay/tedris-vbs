import * as XLSX from 'xlsx';
import { StudentRecord } from '@/modules/davet/types';

export const parseExcelFile = (file: File): Promise<StudentRecord[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet) as any[];

        const records: StudentRecord[] = jsonData.map((row, index) => {
          // Field mapping logic based on common headers
          let talebeAdi = '';
          let sinif = '';
          let veliAdi = '';
          let telefon = '';

          Object.keys(row).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (['talebe', 'talebe adi', 'talebe adi soyadi', 'ogrenci', 'ogrenci adi', 'ad soyad', 'isim'].includes(lowerKey)) {
              talebeAdi = String(row[key]);
            }
            if (['sinif', 'sinifi'].includes(lowerKey)) {
              sinif = String(row[key]);
            }
            if (['veli', 'veli adi'].includes(lowerKey)) {
              veliAdi = String(row[key]);
            }
            if (['telefon', 'numara'].includes(lowerKey)) {
              telefon = String(row[key]);
            }
          });

          let durum: StudentRecord['durum'] = 'hazir';
          if (!talebeAdi) {
            durum = 'eksik-isim';
          }

          return {
            sira: index + 1,
            talebeAdi,
            sinif,
            veliAdi,
            telefon,
            durum
          };
        });

        resolve(records);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};
