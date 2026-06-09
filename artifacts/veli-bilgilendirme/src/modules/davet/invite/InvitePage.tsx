import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DavetLayout } from '@/modules/davet/layout/DavetLayout';
import { PageHeader } from '@/modules/davet/layout/PageHeader';
import { SectionCard } from '@/modules/davet/layout/SectionCard';
import { Button } from '@/components/davet-ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/davet-ui/form';
import { Input } from '@/components/davet-ui/input';
import { Textarea } from '@/components/davet-ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/davet-ui/select';
import { Checkbox } from '@/components/davet-ui/checkbox';
import { useToast } from '@/modules/davet/hooks/use-toast';
import { generateDavetMetni, substituteVariables } from '@/modules/davet/utils/textGenerator';
import { parseExcelFile } from '@/modules/davet/utils/excelParser';
import { StudentRecord } from '@/modules/davet/types';
import { Download, Copy } from 'lucide-react';
import { POSTER_ASPECT_SPECS, PosterCanvas } from '@/modules/davet/components/PosterCanvas';
import {
  buildExportFileName,
  exportPosterDesign,
} from '@/modules/davet/utils/exportUtils';
import {
  clampLines,
  getInviteDateLine,
  getInviteTimeLine,
  getPosterBodyClass,
  getPosterKurumClass,
  getPosterMetaClass,
  getPosterMetaLabelClass,
  getPosterTitleClass,
  hasValue,
  truncateText,
} from '@/modules/davet/utils/layoutUtils';
import { Alert, AlertDescription } from '@/components/davet-ui/alert';
import { Label } from '@/components/davet-ui/label';

const programTurleri = [
  'Veli Toplantısı', 'Yurt Tanıtımı', 'Kahvaltı Programı', 'Seminer', 
  'Tanışma Programı', 'Yatılı Alıştırma Daveti', 'Yaz Kampı Daveti', 
  'Deneme Sınavı Daveti', 'Özel Davet'
];

const formSchema = z.object({
  kurumAdi: z.string().min(2, 'Kurum adı gereklidir'),
  programTuru: z.string().min(1, 'Program türü seçiniz'),
  davetBasligi: z.string().min(2, 'Başlık gereklidir'),
  tarih: z.string().min(1, 'Tarih gereklidir'),
  saat: z.string().min(1, 'Saat gereklidir'),
  yer: z.string().min(2, 'Yer gereklidir'),
  kisaAciklama: z.string().min(5, 'Davet metni gereklidir'),
  katilimNotu: z.string().optional(),
  iletisimTelefon: z.string().optional(),
  sablon: z.string().default('1'),
});

export default function InvitePage() {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const inviteSpec = POSTER_ASPECT_SPECS["invite-landscape"];
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [useExcel, setUseExcel] = useState(false);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kurumAdi: 'Merkez Yurdu',
      programTuru: 'Veli Toplantısı',
      davetBasligi: 'Veli Toplantısı Daveti',
      tarih: '',
      saat: '',
      yer: 'Yurt Konferans Salonu',
      kisaAciklama: generateDavetMetni('Veli Toplantısı'),
      katilimNotu: 'Katılımınız önemle rica olunur.',
      iletisimTelefon: '',
      sablon: '1'
    },
  });

  const values = form.watch();

  const handleProgramTuruChange = (val: string) => {
    form.setValue('programTuru', val);
    form.setValue('davetBasligi', `${val} Daveti`);
    form.setValue('kisaAciklama', generateDavetMetni(val));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const records = await parseExcelFile(file);
        setStudents(records);
        if (records.length > 0) setSelectedStudent(records[0]);
        toast({ title: 'Excel Yüklendi', description: `${records.length} kayıt bulundu.` });
      } catch (err) {
        toast({ title: 'Hata', description: 'Excel dosyası okunamadı.', variant: 'destructive' });
      }
    }
  };

  const exportHataMesaji = (err: unknown) => {
    const kod = err instanceof Error ? err.message : "";
    if (kod === "PREVIEW_MISSING") {
      toast({ title: "Hata", description: "Önizleme alanı bulunamadı.", variant: "destructive" });
      return;
    }
    if (kod === "EMPTY_EXPORT") {
      toast({ title: "Hata", description: "Boş dosya oluşturulamadı. Lütfen tekrar deneyin.", variant: "destructive" });
      return;
    }
    toast({ title: "Hata", description: "İndirme başarısız oldu.", variant: "destructive" });
  };

  const downloadImage = async () => {
    try {
      await exportPosterDesign(
        exportRef.current,
        buildExportFileName("veli-daveti", values.kurumAdi, "png"),
        inviteSpec,
        "png",
        { scale: 3, backgroundColor: "#ffffff" },
      );
      toast({ title: "Başarılı", description: "Davetiye PNG olarak indirildi." });
    } catch (err) {
      exportHataMesaji(err);
    }
  };

  const downloadPdf = async () => {
    try {
      await exportPosterDesign(
        exportRef.current,
        buildExportFileName("veli-daveti", values.kurumAdi, "pdf"),
        inviteSpec,
        "pdf",
        { scale: 3, backgroundColor: "#ffffff" },
      );
      toast({ title: "Başarılı", description: "Davetiye PDF olarak indirildi." });
    } catch (err) {
      exportHataMesaji(err);
    }
  };

  const copyMessage = () => {
    const msg = `Saygın Velimiz${selectedStudent ? ` ${selectedStudent.veliAdi || ''}` : ''},\n\n` +
      `${selectedStudent ? `Öğrencimiz ${selectedStudent.talebeAdi} için ` : ''}` +
      `${values.tarih} tarihinde saat ${values.saat}'de ${values.yer} adresinde düzenleyeceğimiz ${values.programTuru} programına davetlisiniz.\n\n` +
      `${values.kisaAciklama}\n\n` +
      `${values.katilimNotu || ''}\n\n` +
      `Saygılarımızla,\n${values.kurumAdi}`;
    
    navigator.clipboard.writeText(msg);
    toast({ title: 'Başarılı', description: 'Mesaj panoya kopyalandı.' });
  };

  const renderTemplateContent = () => {
    let aciklama = values.kisaAciklama;
    if (selectedStudent) {
      aciklama = substituteVariables(aciklama, {
        talebeAdi: selectedStudent.talebeAdi,
        sinif: selectedStudent.sinif || '',
        veliAdi: selectedStudent.veliAdi || '',
      });
    }

    const { sablon } = values;
    const titleClass = getPosterTitleClass(values.davetBasligi);
    const bodyClass = getPosterBodyClass(aciklama);
    const bodyText = clampLines(aciklama, 4, 280);
    const kurumLabel = truncateText(values.kurumAdi, 48);
    const yerText = truncateText(values.yer, 80);
    const katilimText = values.katilimNotu ? truncateText(values.katilimNotu, 120) : "";
    const baslikText = truncateText(values.davetBasligi, 90);
    const tarihLine = getInviteDateLine(values.tarih);
    const saatLine = getInviteTimeLine(values.saat);
    const showYer = hasValue(values.yer);

    if (sablon === '1') {
      return (
        <div className="w-full h-full flex overflow-hidden bg-[#1e3a8a] text-white">
          <div className="w-[58%] px-12 py-10 flex flex-col justify-center relative overflow-hidden min-h-0">
            {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain absolute top-8 left-10" />}
            <div className={`text-blue-200 mb-4 ${getPosterKurumClass()}`}>{kurumLabel}</div>
            <h1 className={`font-serif font-bold mb-5 ${titleClass}`}>{baslikText}</h1>
            <p className={`${bodyClass} text-blue-100 max-w-2xl`}>{bodyText}</p>
            {selectedStudent && (
              <div className="mt-8 pt-6 border-t border-blue-800">
                <p className="text-[22px] italic">Sayın {selectedStudent.veliAdi || 'Velimiz'},</p>
                <p className="text-[20px] text-blue-200 mt-1">Öğrencimiz <span className="font-semibold text-white">{selectedStudent.talebeAdi}</span></p>
              </div>
            )}
          </div>
          <div className="w-[42%] bg-white text-slate-800 px-12 py-10 flex flex-col justify-center overflow-hidden min-h-0">
            <div className="space-y-6">
              <div>
                <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Tarih</div>
                <div className={`${getPosterMetaClass()} text-[#1e3a8a]`}>{tarihLine}</div>
              </div>
              {saatLine && (
                <div>
                  <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Saat</div>
                  <div className={`${getPosterMetaClass()} text-[#1e3a8a]`}>{saatLine}</div>
                </div>
              )}
              {showYer && (
              <div>
                <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Yer</div>
                <div className="text-[22px] text-slate-700 line-clamp-3 leading-snug">{yerText}</div>
              </div>
              )}
              {katilimText && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 italic text-slate-600 text-sm line-clamp-3">
                  {katilimText}
                </div>
              )}
              {values.iletisimTelefon && (
                <div className="pt-4 mt-8 border-t border-slate-200">
                  <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">İletişim</div>
                  <div className="text-lg text-slate-700">{values.iletisimTelefon}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '2') {
      return (
        <div className="w-full h-full bg-white relative flex items-stretch justify-center p-8 overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-4 bg-[#1e3a8a]"></div>
          <div className="absolute bottom-0 inset-x-0 h-4 bg-[#1e3a8a]"></div>
          <div className="w-full h-full border-[3px] border-[#1e3a8a] p-2 flex">
            <div className="w-full h-full border border-[#1e3a8a] flex flex-col items-center justify-between text-center px-12 py-10 relative overflow-hidden min-h-0">
              <div className="flex flex-col items-center w-full">
                {logoPreview && <img src={logoPreview} alt="Logo" className="h-24 object-contain mb-4" />}
                <h2 className={`text-[#1e3a8a] mb-3 ${getPosterKurumClass()}`}>{kurumLabel}</h2>
                <h1 className={`font-serif text-slate-900 mb-5 max-w-5xl ${titleClass}`}>{baslikText}</h1>
                {selectedStudent && (
                  <div className="mb-5">
                    <span className="text-[22px] italic text-slate-600">Sayın {selectedStudent.veliAdi || 'Velimiz'},</span>
                    <div className="text-[20px] font-medium text-slate-800 mt-1">Öğrencimiz {selectedStudent.talebeAdi}</div>
                  </div>
                )}
                <p className={`${bodyClass} text-slate-600 max-w-5xl`}>{bodyText}</p>
              </div>
              <div className="flex gap-12 text-left border-t border-slate-200 pt-8 w-full max-w-4xl justify-center flex-wrap">
                <div>
                  <div className={`${getPosterMetaLabelClass()} text-slate-400`}>Tarih</div>
                  <div className={`${getPosterMetaClass()} text-[#1e3a8a]`}>{tarihLine}</div>
                </div>
                {saatLine && (
                  <div>
                    <div className={`${getPosterMetaLabelClass()} text-slate-400`}>Saat</div>
                    <div className={`${getPosterMetaClass()} text-[#1e3a8a]`}>{saatLine}</div>
                  </div>
                )}
                {showYer && (
                  <div className="min-w-[200px]">
                    <div className={`${getPosterMetaLabelClass()} text-slate-400`}>Yer</div>
                    <div className={`${getPosterMetaClass()} text-[#1e3a8a] line-clamp-2`}>{yerText}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '3') {
      return (
        <div className="w-full h-full bg-gradient-to-br from-[#0f172a] to-[#1e3a8a] text-white p-10 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mt-20 -mr-20"></div>
          
          <div className="flex justify-between items-start z-10 w-full mb-10">
            <div className="flex items-center gap-6">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain bg-white/10 p-2 rounded" />}
              <div className={`text-[#d4a017] border-l-2 border-[#d4a017] pl-4 ${getPosterKurumClass()}`}>{kurumLabel}</div>
            </div>
            <div className="text-right bg-white/10 px-6 py-4 rounded-xl border border-white/15 min-w-[240px]">
              <div className={`${getPosterMetaLabelClass()} text-slate-300 mb-1`}>Tarih</div>
              <div className="text-[32px] font-serif text-[#d4a017] leading-tight">{tarihLine}</div>
              {saatLine && (
                <>
                  <div className={`${getPosterMetaLabelClass()} text-slate-300 mt-3 mb-1`}>Saat</div>
                  <div className="text-[24px] text-white/90">{saatLine}</div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center z-10 w-full max-w-5xl min-h-0 overflow-hidden">
            <h1 className={`font-serif font-bold text-white mb-4 ${titleClass}`}>{baslikText}</h1>
            
            {selectedStudent && (
              <p className="text-2xl text-[#d4a017] italic mb-6">Sayın {selectedStudent.veliAdi || 'Velimiz'} ({selectedStudent.talebeAdi})</p>
            )}
            
            <p className={`${bodyClass} text-slate-300 leading-snug font-light mb-6`}>{bodyText}</p>

            <div className="flex justify-between items-end mt-auto pt-4 border-t border-white/20">
              <div className="flex gap-8">
                {showYer && (
                <div>
                  <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Yer</div>
                  <div className="text-[22px] font-medium line-clamp-2">{yerText}</div>
                </div>
                )}
                {values.iletisimTelefon && (
                  <div>
                    <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">İletişim</div>
                    <div className="text-xl font-medium">{values.iletisimTelefon}</div>
                  </div>
                )}
              </div>
              {katilimText && (
                <div className="text-[#d4a017] italic max-w-sm text-right text-sm line-clamp-3">{katilimText}</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '4') {
      return (
        <div className="w-full h-full flex overflow-hidden">
          <div className="w-[35%] bg-slate-900 text-white p-8 flex flex-col items-center justify-center text-center overflow-hidden min-h-0">
            {logoPreview && <img src={logoPreview} alt="Logo" className="h-24 object-contain mb-6" />}
            <h2 className="text-lg uppercase tracking-widest text-slate-400 mb-4">{kurumLabel}</h2>
            <div className="w-24 h-1 bg-primary mb-6"></div>
            <h1 className={`font-bold leading-tight ${titleClass}`}>{baslikText}</h1>
          </div>
          <div className="w-[65%] bg-slate-50 p-10 flex flex-col justify-center relative overflow-hidden min-h-0">
            <div className="absolute top-12 right-12 text-right bg-white/90 px-6 py-4 rounded-xl shadow-sm border border-slate-200">
              <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Tarih</div>
              <div className={`${getPosterMetaClass()} text-slate-800`}>{tarihLine}</div>
              {saatLine && (
                <>
                  <div className={`${getPosterMetaLabelClass()} text-slate-400 mt-3 mb-1`}>Saat</div>
                  <div className="text-[24px] font-semibold text-slate-600">{saatLine}</div>
                </>
              )}
            </div>
            
            <div className="max-w-2xl mt-12">
              {selectedStudent && (
                <div className="mb-8">
                  <span className="text-2xl text-slate-800">Sayın <span className="font-bold">{selectedStudent.veliAdi || 'Velimiz'}</span>,</span>
                  <div className="text-xl text-slate-600 mt-2">Öğrencimiz {selectedStudent.talebeAdi} adına,</div>
                </div>
              )}
              
              <p className={`${bodyClass} text-slate-700 leading-snug mb-6`}>{bodyText}</p>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex gap-4 items-start mb-4">
                  <div className="bg-slate-100 p-3 rounded-lg text-slate-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-widest text-slate-400 font-bold">Yer</div>
                    <div className="text-lg font-medium text-slate-800 line-clamp-2">{yerText}</div>
                  </div>
                </div>
                
                {(katilimText || values.iletisimTelefon) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between gap-4">
                    {katilimText && <div className="italic text-slate-500 text-sm line-clamp-2">{katilimText}</div>}
                    {values.iletisimTelefon && <div className="font-medium text-slate-700">{values.iletisimTelefon}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '5') {
      return (
        <div className="w-full h-full bg-[#f8fafc] flex flex-col relative overflow-hidden">
          <div className="h-28 bg-[#1e293b] w-full flex items-center px-10 justify-between text-white shrink-0">
            <div className="flex items-center gap-4 min-w-0">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-14 object-contain bg-white rounded p-1 shrink-0" />}
              <h2 className="text-xl font-medium tracking-wider uppercase truncate">{kurumLabel}</h2>
            </div>
            <div className="text-right">
              <div className="text-[22px] font-semibold">{tarihLine}</div>
              {saatLine && <div className="text-[20px] text-slate-300 mt-1">{saatLine}</div>}
            </div>
          </div>
          
          <div className="flex-1 flex p-10 min-h-0 overflow-hidden">
            <div className="w-[70%] pr-10 flex flex-col justify-center overflow-hidden min-h-0">
              <h1 className={`font-bold text-slate-800 mb-4 ${titleClass}`}>{baslikText}</h1>
              
              {selectedStudent && (
                <p className="text-2xl text-slate-600 mb-6 italic">Sayın {selectedStudent.veliAdi || 'Velimiz'} ({selectedStudent.talebeAdi})</p>
              )}
              
              <p className={`${bodyClass} text-slate-600 leading-snug mb-6`}>{bodyText}</p>
              
              <div className="bg-white p-5 rounded-lg border border-slate-200 flex items-center gap-4 max-w-full">
                <div className="bg-slate-100 p-3 rounded-full text-slate-600 shrink-0">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                </div>
                <div className="min-w-0">
                  <div className="text-sm uppercase text-slate-500 font-bold">Mekan</div>
                  <div className="text-xl font-semibold text-slate-800 line-clamp-2">{yerText}</div>
                </div>
              </div>
            </div>
            
            <div className="w-[30%] flex flex-col items-center justify-center pl-8 border-l border-slate-200">
              <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 flex flex-col items-center text-center">
                <div className="w-48 h-48 bg-slate-100 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center mb-6">
                  <div className="text-slate-400 flex flex-col items-center">
                    <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                    <span>QR Kod Alanı</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Kayıt İçin Tarayınız</h3>
                <p className="text-slate-500 text-sm">Lütfen katılım durumunuzu bildirmek için QR kodu okutun.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-[#faf5eb] flex relative overflow-hidden min-h-0">
        <div className="absolute top-0 right-0 w-[40%] h-full bg-[#991b1b] opacity-5"></div>
        <div className="absolute -bottom-64 -left-64 w-96 h-96 bg-[#991b1b] rounded-full opacity-10 blur-3xl"></div>
        
        <div className="w-full h-full px-12 py-10 flex flex-col justify-between relative z-10 overflow-hidden">
          <div className="flex justify-between items-start border-b-2 border-[#991b1b]/20 pb-6">
            <div className="flex items-center gap-4 min-w-0">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain mix-blend-multiply shrink-0" />}
              <h2 className="text-[28px] font-serif text-[#991b1b] truncate">{kurumLabel}</h2>
            </div>
            <div className="text-right bg-white/80 px-6 py-4 rounded-xl shadow-sm border border-[#991b1b]/10">
              <div className={`${getPosterMetaLabelClass()} text-slate-500 mb-1`}>Tarih</div>
              <div className={`${getPosterMetaClass()} text-slate-800`}>{tarihLine}</div>
              {saatLine && (
                <>
                  <div className={`${getPosterMetaLabelClass()} text-[#991b1b] mt-3 mb-1`}>Saat</div>
                  <div className="text-[24px] text-[#991b1b] font-semibold">{saatLine}</div>
                </>
              )}
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto text-center overflow-hidden py-6">
            <h1 className={`font-serif font-bold text-slate-900 mb-5 ${titleClass}`}>{baslikText}</h1>
            
            {selectedStudent && (
              <div className="mb-10 text-2xl">
                <span className="text-slate-600">Kıymetli Velimiz</span> <span className="font-serif font-semibold text-[#991b1b]">{selectedStudent.veliAdi || ''}</span>,
                <div className="mt-2 text-xl text-slate-500">Değerli öğrencimiz {selectedStudent.talebeAdi} adına...</div>
              </div>
            )}
            
            <p className={`${bodyClass} text-slate-700 leading-snug mb-8 font-light`}>{bodyText}</p>
            
            <div className="flex flex-col items-center gap-4">
              {showYer && (
              <div className="px-8 py-4 bg-[#991b1b]/5 rounded-full text-[24px] font-medium text-slate-800 inline-flex items-center gap-3 max-w-full">
                <svg className="w-7 h-7 text-[#991b1b] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                <span className="line-clamp-2">{yerText}</span>
              </div>
              )}
              
              {katilimText && (
                <p className="text-base text-slate-500 italic line-clamp-2">{katilimText}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-12">
        <PageHeader
          accent="blue"
          title="Veliye Davet Hazırla"
          description="Veli toplantısı, tanıtım ve özel programlar için davet görseli oluşturun."
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          <div className="xl:col-span-4 space-y-6">
            <SectionCard className="max-h-[85vh] overflow-y-auto">
              <Form {...form}>
                <form className="space-y-4">
                  <FormField control={form.control} name="kurumAdi" render={({ field }) => (
                    <FormItem><FormLabel>Kurum/Yurt Adı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="programTuru" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Türü</FormLabel>
                      <Select value={field.value} onValueChange={handleProgramTuruChange}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {programTurleri.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="davetBasligi" render={({ field }) => (
                    <FormItem><FormLabel>Davet Başlığı</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="tarih" render={({ field }) => (
                      <FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="saat" render={({ field }) => (
                      <FormItem><FormLabel>Saat</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="yer" render={({ field }) => (
                    <FormItem><FormLabel>Yer/Adres</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="kisaAciklama" render={({ field }) => (
                    <FormItem><FormLabel>Davet Metni</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="katilimNotu" render={({ field }) => (
                    <FormItem><FormLabel>Katılım Notu (Opsiyonel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="iletisimTelefon" render={({ field }) => (
                    <FormItem><FormLabel>İletişim (Opsiyonel)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Şablon Seçimi</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <Button 
                          key={num} 
                          type="button" 
                          variant={values.sablon === String(num) ? 'default' : 'outline'} 
                          size="sm"
                          onClick={() => form.setValue('sablon', String(num))}
                        >
                          Şablon {num}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Logo Yükle (Opsiyonel)</label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Checkbox id="useExcel" checked={useExcel} onCheckedChange={(c) => setUseExcel(!!c)} />
                    <label htmlFor="useExcel" className="text-sm font-medium leading-none cursor-pointer">
                      Excel'den kişiye özel davetiye üret
                    </label>
                  </div>

                  {useExcel && (
                    <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                      <Alert className="bg-blue-50/50 text-blue-800 border-blue-200">
                        <AlertDescription className="text-xs">
                          Bu bilgiler sadece önizleme ve indirme için kullanılır.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label>Excel Dosyası Yükle (.xlsx)</Label>
                        <Input type="file" accept=".xlsx, .xls, .csv" onChange={handleExcelUpload} />
                      </div>

                      {students.length > 0 && (
                        <div className="mt-4">
                          <Label className="mb-2 block">Kayıtlar ({students.length})</Label>
                          <div className="max-h-40 overflow-y-auto border rounded bg-background">
                            <table className="w-full text-sm">
                              <thead className="bg-muted sticky top-0">
                                <tr>
                                  <th className="p-2 text-left">Talebe</th>
                                  <th className="p-2 text-left">Veli</th>
                                </tr>
                              </thead>
                              <tbody>
                                {students.map((s, i) => (
                                  <tr 
                                    key={i} 
                                    className={`cursor-pointer hover:bg-muted/50 ${selectedStudent?.sira === s.sira ? 'bg-primary/10' : ''}`}
                                    onClick={() => setSelectedStudent(s)}
                                  >
                                    <td className="p-2 border-b">{s.talebeAdi}</td>
                                    <td className="p-2 border-b">{s.veliAdi}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </form>
              </Form>
            </SectionCard>
          </div>

          <div className="xl:col-span-8 space-y-4">
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={copyMessage}><Copy className="w-4 h-4 mr-2" /> WhatsApp Metni</Button>
              <Button type="button" variant="outline" onClick={downloadPdf}><Download className="w-4 h-4 mr-2" /> PDF İndir</Button>
              <Button type="button" onClick={downloadImage}><Download className="w-4 h-4 mr-2" /> PNG İndir</Button>
            </div>
            
            <div className="bg-muted/30 border rounded-lg p-4 md:p-8 flex items-start justify-center min-h-[600px] w-full min-w-0">
              <PosterCanvas ref={exportRef} aspect="invite-landscape" className="max-w-full">
                {renderTemplateContent()}
              </PosterCanvas>
            </div>
          </div>
        </div>
      </div>
    </DavetLayout>
  );
}