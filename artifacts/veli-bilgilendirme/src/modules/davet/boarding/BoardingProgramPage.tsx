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
import { Download, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getBoardingPosterAspect,
  POSTER_ASPECT_SPECS,
  PosterCanvas,
} from '@/modules/davet/components/PosterCanvas';
import {
  buildExportFileName,
  exportPosterDesign,
} from '@/modules/davet/utils/exportUtils';
import {
  clampLines,
  formatBoardingDate,
  formatBoardingTimeRange,
  formatChecklistForPoster,
  formatProgramFlowForPoster,
  getPosterBodyClass,
  getPosterKurumClass,
  getPosterMetaClass,
  getPosterMetaLabelClass,
  getPosterTitleClass,
  getProgramFlowClass,
  truncateText,
} from '@/modules/davet/utils/layoutUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/davet-ui/accordion';

const programTurleri = [
  'İlk Yatılı Alıştırma', 'Hafta Sonu Yatılı', 'Nehari\'den Yatılıya Geçiş', 
  'Tanışma ve Uyum Gecesi', 'Yaz Kampı Öncesi Alıştırma'
];

const ihtiyacListesi = [
  'Pijama Takımı', 'Diş Fırçası ve Macunu', 'Yedek Kıyafet', 
  'Kitap', 'Defter ve Kalem', 'Terlik', 'Havlu'
];

const formSchema = z.object({
  kurumAdi: z.string().min(2, 'Kurum adı gereklidir'),
  programBasligi: z.string().min(2, 'Başlık gereklidir'),
  programTuru: z.string().min(1, 'Program türü seçiniz'),
  tarih: z.string().min(1, 'Tarih gereklidir'),
  baslangicSaati: z.string().min(1, 'Başlangıç saati gereklidir'),
  bitisSaati: z.string().min(1, 'Bitiş saati gereklidir'),
  sinifSeviyesi: z.string().min(1, 'Sınıf seviyesi gereklidir'),
  kontenjan: z.string().min(1, 'Kontenjan gereklidir'),
  veliGuvenMesaji: z.string().min(5, 'Veli güven mesajı gereklidir'),
  kisaAciklama: z.string().min(5, 'Açıklama gereklidir'),
  sablon: z.string().default('1'),
});

export default function BoardingProgramPage() {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [gorseller, setGorseller] = useState<string[]>([]);
  
  const [akis, setAkis] = useState([
    { saat: '18:00', baslik: 'Karşılama', aciklama: 'Yurda giriş ve yerleşme' },
    { saat: '18:30', baslik: 'Akşam Yemeği', aciklama: 'Birlikte yemek' },
    { saat: '19:15', baslik: 'Tanışma', aciklama: 'Oyunlar ve etkinlikler' },
    { saat: '20:00', baslik: 'Etüt', aciklama: 'Kitap okuma ve ders' },
    { saat: '21:00', baslik: 'Değerler Eğitimi', aciklama: 'Sohbet' },
    { saat: '22:00', baslik: 'Yatış', aciklama: 'Uykuya hazırlık' }
  ]);
  
  const [ihtiyaclar, setIhtiyaclar] = useState<string[]>(ihtiyacListesi.slice(0, 4));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kurumAdi: 'Merkez Yurdu',
      programBasligi: 'Yatılı Alıştırma Programı',
      programTuru: 'İlk Yatılı Alıştırma',
      tarih: '',
      baslangicSaati: '18:00',
      bitisSaati: '10:00',
      sinifSeviyesi: '4-8. Sınıf Karma',
      kontenjan: '20 Kişi',
      veliGuvenMesaji: 'Talebelerimiz bizim için bir emanettir. Tüm uyku ve güvenlik tedbirlerimizi alarak programımızı düzenliyoruz.',
      kisaAciklama: 'Talebelerimizin yatılı ortama alışması için keyifli bir program hazırladık.',
      sablon: '1'
    },
  });

  const values = form.watch();
  const posterAspect = getBoardingPosterAspect(values.sablon);
  const posterSpec = POSTER_ASPECT_SPECS[posterAspect];

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

  const handleGorselUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gorseller.length >= 4) {
      toast({ title: 'Sınır Aşıldı', description: 'En fazla 4 görsel yükleyebilirsiniz.', variant: 'destructive' });
      return;
    }
    
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setGorseller([...gorseller, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeGorsel = (index: number) => {
    setGorseller(gorseller.filter((_, i) => i !== index));
  };

  const toggleIhtiyac = (item: string) => {
    if (ihtiyaclar.includes(item)) {
      setIhtiyaclar(ihtiyaclar.filter(i => i !== item));
    } else {
      setIhtiyaclar([...ihtiyaclar, item]);
    }
  };

  const addAkis = () => {
    setAkis([...akis, { saat: '', baslik: '', aciklama: '' }]);
  };

  const updateAkis = (index: number, field: string, value: string) => {
    const newAkis = [...akis];
    newAkis[index] = { ...newAkis[index], [field]: value };
    setAkis(newAkis);
  };

  const removeAkis = (index: number) => {
    setAkis(akis.filter((_, i) => i !== index));
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
        buildExportFileName("yatili-alistirma", values.kurumAdi, "png"),
        posterSpec,
        "png",
        { scale: 3, backgroundColor: "#ffffff" },
      );
      toast({ title: "Başarılı", description: "Afiş PNG olarak indirildi." });
    } catch (err) {
      exportHataMesaji(err);
    }
  };

  const downloadPdf = async () => {
    try {
      await exportPosterDesign(
        exportRef.current,
        buildExportFileName("yatili-alistirma", values.kurumAdi, "pdf"),
        posterSpec,
        "pdf",
        { scale: 3, backgroundColor: "#ffffff" },
      );
      toast({ title: "Başarılı", description: "Afiş PDF olarak indirildi." });
    } catch (err) {
      exportHataMesaji(err);
    }
  };

  const renderGorseller = () => {
    if (gorseller.length === 0) return null;

    if (gorseller.length === 1) {
      return <img src={gorseller[0]} alt="Görsel 1" className="w-full h-full object-cover" />;
    }
    if (gorseller.length === 2) {
      return (
        <div className="flex w-full h-full gap-2">
          <img src={gorseller[0]} alt="Görsel 1" className="w-1/2 h-full object-cover" />
          <img src={gorseller[1]} alt="Görsel 2" className="w-1/2 h-full object-cover" />
        </div>
      );
    }
    if (gorseller.length === 3) {
      return (
        <div className="flex w-full h-full gap-2">
          <img src={gorseller[0]} alt="Görsel 1" className="w-2/3 h-full object-cover" />
          <div className="w-1/3 flex flex-col gap-2">
            <img src={gorseller[1]} alt="Görsel 2" className="w-full h-1/2 object-cover" />
            <img src={gorseller[2]} alt="Görsel 3" className="w-full h-1/2 object-cover" />
          </div>
        </div>
      );
    }
    if (gorseller.length === 4) {
      return (
        <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2">
          {gorseller.map((g, i) => (
            <img key={i} src={g} alt={`Görsel ${i+1}`} className="w-full h-full object-cover" />
          ))}
        </div>
      );
    }
    return null;
  };

  const renderTemplateContent = () => {
    const sablon = values.sablon;
    const flow = formatProgramFlowForPoster(akis);
    const checklist = formatChecklistForPoster(ihtiyaclar);
    const titleClass = getPosterTitleClass(values.programBasligi);
    const bodyClass = getPosterBodyClass(values.kisaAciklama);
    const bodyText = clampLines(values.kisaAciklama, 3, 220);
    const guvenText = truncateText(values.veliGuvenMesaji, 160);
    const baslikText = truncateText(values.programBasligi, 90);
    const kurumLabel = truncateText(values.kurumAdi, 48);
    const flowTextClass = getProgramFlowClass(flow.compact);
    const tarihLine = formatBoardingDate(values.tarih);
    const saatLine = formatBoardingTimeRange(values.baslangicSaati, values.bitisSaati);
    const gorselVar = gorseller.length > 0;

    if (sablon === '1') {
      return (
        <div className="w-full h-full bg-[#0f172a] text-white p-8 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPC9zdmc+')]"></div>
          
          <div className="flex justify-between items-start z-10 border-b border-white/20 pb-6 mb-8">
            <div className="flex items-center gap-6">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 bg-white p-1 rounded object-contain" />}
              <div>
                <div className="text-[#d4a017] tracking-[0.2em] text-xs font-bold uppercase mb-1">{kurumLabel}</div>
                <h1 className={`font-serif font-bold text-white ${titleClass}`}>{baslikText}</h1>
              </div>
            </div>
            <div className="text-right flex gap-4">
              <div className="bg-white/10 px-5 py-3 rounded-lg backdrop-blur min-w-[140px]">
                <div className={`${getPosterMetaLabelClass()} text-[#d4a017] mb-1`}>Tarih</div>
                <div className={`${getPosterMetaClass()} text-white`}>{tarihLine}</div>
              </div>
              {saatLine && (
                <div className="bg-white/10 px-5 py-3 rounded-lg backdrop-blur min-w-[160px]">
                  <div className={`${getPosterMetaLabelClass()} text-[#d4a017] mb-1`}>Saat</div>
                  <div className={`${getPosterMetaClass()} text-white`}>{saatLine}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex gap-6 z-10 min-h-0 overflow-hidden">
            <div className="w-[34%] flex flex-col gap-4 min-h-0 overflow-hidden">
              <p className={`${bodyClass} text-slate-300 italic border-l-4 border-[#d4a017] pl-4 line-clamp-4`}>{bodyText}</p>
              
              <div className="bg-[#1e293b]/80 border border-slate-700 p-5 rounded-xl backdrop-blur-sm mt-auto overflow-hidden">
                <h3 className="text-[#d4a017] font-semibold mb-3 uppercase tracking-widest text-[18px]">Gereksinimler</h3>
                <ul className="space-y-2 flex flex-wrap gap-2">
                  {checklist.visible.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[16px] text-slate-200 bg-white/5 px-3 py-1.5 rounded-full">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#d4a017] shrink-0"></div>
                      {item}
                    </li>
                  ))}
                  {checklist.extraLabel && (
                    <li className="text-xs text-slate-400 italic">{checklist.extraLabel}</li>
                  )}
                </ul>
              </div>
            </div>

            <div className="w-[34%] bg-white/5 rounded-xl p-5 border border-white/10 overflow-hidden flex flex-col min-h-0">
              <h3 className="text-[22px] font-bold mb-4 text-white border-b border-white/10 pb-3 shrink-0">Program Akışı</h3>
              <div className={`space-y-3 flex-1 overflow-hidden ${flowTextClass}`}>
                {flow.items.map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="text-[#d4a017] font-bold w-14 shrink-0">{item.saat}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white line-clamp-1">{item.baslik}</div>
                      {item.aciklama && <div className="text-[16px] text-slate-400 mt-0.5 line-clamp-1">{item.aciklama}</div>}
                    </div>
                  </div>
                ))}
                {flow.note && <p className="text-[16px] text-slate-400 italic pt-1">{flow.note}</p>}
              </div>
            </div>

            <div className="w-[32%] flex flex-col min-h-0">
              {gorselVar && (
              <div className="h-[55%] min-h-[200px] rounded-xl overflow-hidden bg-slate-800 border border-white/10 mb-4 shrink-0">
                {renderGorseller()}
              </div>
              )}
              <div className={`bg-[#d4a017]/20 border border-[#d4a017]/30 p-4 rounded-xl text-center ${gorselVar ? "flex-1" : "flex-1 flex items-center justify-center"}`}>
                <p className="text-[18px] font-medium text-[#d4a017] line-clamp-4 leading-snug">"{guvenText}"</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '2') {
      return (
        <div className="w-full h-full bg-[#f8fafc] text-slate-900 p-8 flex relative overflow-hidden">
          <div className="w-1/2 flex flex-col pr-12 border-r-2 border-slate-200">
            <div className="mb-10">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 object-contain mb-6" />}
              <div className="text-slate-500 font-bold tracking-widest text-sm uppercase mb-2">{values.kurumAdi}</div>
              <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">{values.programBasligi}</h1>
              <p className="text-xl text-slate-600 mb-6">{values.kisaAciklama}</p>
            </div>
            
            <div className="flex gap-6 mb-10">
              <div className="flex-1 bg-white p-4 rounded-xl border shadow-sm">
                <div className="text-sm text-slate-500 uppercase font-bold">Tarih</div>
                <div className="text-xl font-semibold text-[#1e3a8a]">{values.tarih || '-'}</div>
              </div>
              <div className="flex-1 bg-white p-4 rounded-xl border shadow-sm">
                <div className="text-sm text-slate-500 uppercase font-bold">Saat</div>
                <div className="text-xl font-semibold text-[#1e3a8a]">{values.baslangicSaati} - {values.bitisSaati}</div>
              </div>
            </div>

            <div className="mt-auto bg-[#1e3a8a] text-white p-6 rounded-xl shadow-lg">
              <p className="text-lg font-medium italic text-center text-blue-100">"{values.veliGuvenMesaji}"</p>
            </div>
          </div>

          <div className="w-1/2 pl-12 flex flex-col">
            <h2 className="text-3xl font-bold text-[#1e3a8a] mb-8 flex items-center gap-4">
              Program Akışı
              <div className="h-1 flex-1 bg-blue-100 rounded-full"></div>
            </h2>
            
            <div className="flex-1 space-y-6 overflow-hidden relative">
              <div className="absolute left-3 top-2 bottom-2 w-1 bg-blue-100 rounded-full"></div>
              {flow.items.map((item, i) => (
                <div key={i} className="flex gap-6 relative z-10">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a8a] text-white flex items-center justify-center font-bold text-xs shrink-0 ring-4 ring-[#f8fafc]">
                    {i + 1}
                  </div>
                  <div className="bg-white p-4 rounded-xl border shadow-sm flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-bold text-lg text-slate-800">{item.baslik}</div>
                      <div className="text-[#1e3a8a] font-bold bg-blue-50 px-3 py-1 rounded-full text-sm">{item.saat}</div>
                    </div>
                    <div className="text-slate-600">{item.aciklama}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '3') {
      return (
        <div className="w-full h-full flex bg-white text-slate-900 overflow-hidden">
          <div className={`${gorselVar ? "w-[42%]" : "w-[38%]"} h-full bg-slate-100 relative shrink-0`}>
            {gorselVar ? (
              <img src={gorseller[0]} alt="Kapak" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1e3a8a] flex flex-col items-center justify-center text-white p-10 text-center">
                {logoPreview && <img src={logoPreview} alt="Logo" className="h-28 object-contain mb-6 bg-white p-2 rounded-xl" />}
                <h2 className={`mb-3 text-white/80 ${getPosterKurumClass()}`}>{kurumLabel}</h2>
                <h1 className={`font-bold text-white ${titleClass}`}>{baslikText}</h1>
              </div>
            )}
            {gorselVar && logoPreview && (
              <div className="absolute top-6 left-6 bg-white p-3 rounded-xl shadow-lg">
                <img src={logoPreview} alt="Logo" className="h-14 object-contain" />
              </div>
            )}
          </div>
          
          <div className={`${gorselVar ? "w-[58%]" : "w-[62%]"} p-10 flex flex-col min-h-0 overflow-hidden`}>
            <div className="mb-6 border-b pb-5 shrink-0">
              <h2 className={`text-slate-500 mb-2 ${getPosterKurumClass()}`}>{kurumLabel}</h2>
              <h1 className={`font-bold text-[#1e3a8a] ${titleClass}`}>{baslikText}</h1>
            </div>

            <div className="grid grid-cols-2 gap-5 mb-6 shrink-0">
              <div>
                <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Tarih</div>
                <div className={`${getPosterMetaClass()} text-slate-800`}>{tarihLine}</div>
              </div>
              {saatLine && (
              <div>
                <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Saat</div>
                <div className={`${getPosterMetaClass()} text-slate-800`}>{saatLine}</div>
              </div>
              )}
              <div className="col-span-2">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Sınıf</div>
                <div className="text-xl font-semibold text-slate-800">{values.sinifSeviyesi}</div>
              </div>
            </div>

            <p className={`${bodyClass} text-slate-600 mb-6 leading-relaxed line-clamp-3 shrink-0`}>{bodyText}</p>

            <div className="flex-1 grid grid-cols-2 gap-6 min-h-0 overflow-hidden">
              <div className="overflow-hidden">
                <h3 className="text-[22px] font-bold text-[#1e3a8a] mb-4">Program Akışı</h3>
                <div className={`space-y-3 ${flowTextClass}`}>
                  {flow.items.map((item, i) => (
                    <div key={i} className="flex gap-3">
                      <div className="font-bold text-slate-800 w-14 shrink-0">{item.saat}</div>
                      <div>
                        <div className="font-semibold text-slate-700">{item.baslik}</div>
                      </div>
                    </div>
                  ))}
                  {flow.note && <div className="text-[16px] text-slate-400 italic">{flow.note}</div>}
                </div>
              </div>
              
              <div className="overflow-hidden">
                <h3 className="text-[22px] font-bold text-[#1e3a8a] mb-4">Gereksinimler</h3>
                <ul className="space-y-2 text-[18px] text-slate-600">
                  {checklist.visible.map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1e3a8a]"></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 pt-5 border-t text-[18px] italic text-slate-500 font-medium line-clamp-3 shrink-0">
              "{guvenText}"
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '4') {
      return (
        <div className="w-full h-full bg-[#eef2ff] p-8 flex flex-col text-slate-800 overflow-hidden">
          <div className="flex justify-between items-center mb-8 shrink-0">
            <div className="flex items-center gap-6">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain mix-blend-multiply" />}
              <div className="text-xl font-bold uppercase tracking-widest text-[#1e3a8a]">{values.kurumAdi}</div>
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold text-slate-900">{values.programBasligi}</h1>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-200 mb-6 text-center relative overflow-hidden shrink-0">
            <h2 className="text-[32px] font-serif text-[#1e3a8a] leading-snug relative z-10 text-balance italic line-clamp-3">
              "{guvenText}"
            </h2>
          </div>

          <div className="flex gap-6 flex-1 min-h-0">
            <div className="w-[32%] bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-center shrink-0">
              <div className="space-y-5">
                <div>
                  <div className={`${getPosterMetaLabelClass()} text-slate-400`}>Tarih</div>
                  <div className={`${getPosterMetaClass()} text-slate-800`}>{tarihLine}</div>
                  {saatLine && <div className="text-[22px] text-slate-600 mt-1">{saatLine}</div>}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sınıf Seviyesi</div>
                  <div className="text-2xl font-semibold text-slate-800">{values.sinifSeviyesi}</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-wider">Kontenjan</div>
                  <div className="text-2xl font-semibold text-slate-800">{values.kontenjan}</div>
                </div>
              </div>
            </div>

            <div className="w-[68%] bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col min-h-0 overflow-hidden">
              <h3 className="text-[22px] font-bold text-[#1e3a8a] mb-4 border-b pb-3 shrink-0">Özet Program Akışı & Gereksinimler</h3>
              <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
                <div className="w-1/2 flex flex-col gap-3 overflow-hidden">
                  {flow.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-50 p-3 rounded-lg shrink-0">
                      <div className="font-bold text-[#1e3a8a] w-14 text-[18px]">{item.saat}</div>
                      <div className="font-medium text-slate-700 text-[18px] line-clamp-1">{item.baslik}</div>
                    </div>
                  ))}
                  {flow.note && <div className="text-[16px] text-slate-400 mt-1">{flow.note}</div>}
                </div>
                <div className="w-1/2 border-l pl-6 overflow-hidden">
                  <p className={`${bodyClass} text-slate-600 mb-4 italic line-clamp-3`}>{bodyText}</p>
                  <div className="flex flex-wrap gap-2">
                    {checklist.visible.map((item, i) => (
                      <span key={i} className="bg-blue-50 text-blue-800 px-3 py-2 rounded-full text-[16px] font-medium border border-blue-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '5') {
      return (
        <div className="w-full h-full bg-white flex flex-col">
          <div className="bg-[#1e3a8a] text-white p-8 flex justify-between items-center px-16 shadow-md z-10">
            <div className="flex items-center gap-6">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-16 bg-white p-1 rounded" />}
              <h2 className="text-2xl font-bold tracking-widest uppercase">{values.kurumAdi}</h2>
            </div>
            <h1 className="text-3xl font-bold">{values.programBasligi}</h1>
          </div>

          <div className="flex-1 flex p-16 bg-slate-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-slate-200 to-transparent"></div>
            
            <div className="w-[65%] pr-16 flex flex-col relative z-10">
              <p className="text-2xl text-slate-700 leading-relaxed mb-10 font-medium">{values.kisaAciklama}</p>
              
              <div className="grid grid-cols-2 gap-6 mb-10">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className={`${getPosterMetaLabelClass()} text-slate-400 mb-1`}>Zaman Planı</div>
                  <div className={`${getPosterMetaClass()} text-[#1e3a8a]`}>{tarihLine}</div>
                  {saatLine && <div className="text-[20px] text-slate-600 font-medium mt-1">{saatLine}</div>}
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                  <div className="text-slate-400 uppercase font-bold text-sm mb-1">Katılım Detayları</div>
                  <div className="text-xl font-bold text-[#1e3a8a]">{values.sinifSeviyesi}</div>
                  <div className="text-lg text-slate-600 font-medium">Kontenjan: {values.kontenjan}</div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex-1">
                <h3 className="text-lg font-bold text-slate-800 mb-6 uppercase tracking-wider">Program Akışı</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {flow.items.map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="font-bold text-[#1e3a8a] w-12">{item.saat}</div>
                      <div>
                        <div className="font-semibold text-slate-800">{item.baslik}</div>
                        <div className="text-xs text-slate-500">{item.aciklama}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="w-[35%] flex flex-col items-center justify-center relative z-10">
              <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 flex flex-col items-center text-center w-full max-w-sm">
                <h3 className="text-[26px] font-bold text-[#1e3a8a] mb-6 uppercase tracking-widest border-b-2 border-slate-100 pb-4 w-full">Ön Kayıt Bilgisi</h3>
                <p className="text-[20px] text-slate-700 font-medium leading-relaxed mb-4">
                  Kayıt ve detaylı bilgi için kurumumuzla iletişime geçebilirsiniz.
                </p>
                <div className="text-[22px] font-bold text-[#1e3a8a] mb-2">{values.kontenjan}</div>
                <div className="bg-yellow-100 text-yellow-800 px-4 py-3 rounded-lg font-bold text-[16px] w-full mt-2">
                  Kontenjan sınırlıdır
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '6') {
      return (
        <div className="w-full h-full bg-[#f0fdf4] text-slate-800 p-12 flex flex-col items-center text-center border-[16px] border-[#22c55e] rounded-[3rem]">
          {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain mb-6" />}
          <h2 className="text-2xl font-bold text-emerald-700 tracking-wider mb-2 uppercase">{values.kurumAdi}</h2>
          <h1 className="text-6xl font-black text-slate-800 mb-8 drop-shadow-sm text-balance">{values.programBasligi}</h1>
          
          <p className="text-2xl text-slate-600 mb-10 max-w-4xl font-medium">{values.kisaAciklama}</p>
          
          <div className="flex gap-8 mb-12 w-full justify-center">
            <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-emerald-100 w-64 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              </div>
              <div className="font-bold text-2xl text-slate-800">{tarihLine}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-emerald-100 w-64 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <div className="font-bold text-2xl text-slate-800">{values.baslangicSaati} - {values.bitisSaati}</div>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-md border-2 border-emerald-100 w-64 flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
              </div>
              <div className="font-bold text-2xl text-slate-800">{values.sinifSeviyesi}</div>
            </div>
          </div>
          
          <div className="bg-emerald-600 text-white p-8 rounded-3xl w-full max-w-4xl shadow-xl mt-auto">
            <h3 className="font-bold text-xl mb-4 text-emerald-100">Yanında Neler Getirmelisin?</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {checklist.visible.map((item, i) => (
                <span key={i} className="bg-white text-emerald-800 px-4 py-2 rounded-xl font-bold">{item}</span>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (sablon === '7') {
      return (
        <div className="w-full h-full bg-[#1a472a] text-[#f8fafc] p-12 flex flex-col relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPgo8cmVjdCB3aWR0aD0iOCIgaGVpZ2h0PSI4IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz4KPHBhdGggZD0iTTAgMEw4IDhaIiBzdHJva2U9IiNmZmYiIHN0cm9rZS1vcGFjaXR5PSIwLjA1Ii8+Cjwvc3ZnPg==')] opacity-30"></div>
          
          <div className="flex z-10 h-full gap-12">
            <div className="w-1/2 flex flex-col justify-center">
              {logoPreview && <img src={logoPreview} alt="Logo" className="h-24 object-contain mb-8 bg-white/10 p-2 rounded-xl" />}
              <div className="text-emerald-300 font-bold tracking-[0.2em] text-sm uppercase mb-4">{values.kurumAdi}</div>
              <h1 className="text-6xl font-black text-white mb-8 leading-tight">{values.programBasligi}</h1>
              
              <div className="bg-[#2d5a3f] p-6 rounded-2xl border border-emerald-700/50 mb-8 shadow-inner">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-emerald-300 text-xs font-bold uppercase mb-1">Tarih</div>
                    <div className="text-2xl font-bold">{values.tarih || '-'}</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 text-xs font-bold uppercase mb-1">Zaman</div>
                    <div className="text-xl font-bold">{values.baslangicSaati} - {values.bitisSaati}</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 text-xs font-bold uppercase mb-1">Sınıf</div>
                    <div className="text-xl font-bold">{values.sinifSeviyesi}</div>
                  </div>
                  <div>
                    <div className="text-emerald-300 text-xs font-bold uppercase mb-1">Kontenjan</div>
                    <div className="text-xl font-bold">{values.kontenjan}</div>
                  </div>
                </div>
              </div>
              
              <p className="text-lg text-emerald-100 leading-relaxed font-medium">{values.kisaAciklama}</p>
            </div>
            
            <div className="w-1/2 flex gap-6">
              <div className="w-1/2 bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20">
                <h3 className="text-2xl font-bold text-white mb-8 border-b border-white/20 pb-4">Kamp Akışı</h3>
                <div className="space-y-6 relative">
                  <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-emerald-500/50"></div>
                  {flow.items.map((item, i) => (
                    <div key={i} className="flex gap-4 relative z-10">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border-4 border-[#1a472a]"></div>
                      <div>
                        <div className="font-bold text-emerald-300 mb-1">{item.saat}</div>
                        <div className="font-bold text-white text-lg">{item.baslik}</div>
                        <div className="text-sm text-emerald-100/80 mt-1">{item.aciklama}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="w-1/2 flex flex-col gap-6">
                <div className="flex-1 bg-white/10 p-8 rounded-3xl backdrop-blur-sm border border-white/20 flex flex-col justify-center">
                  <h3 className="text-xl font-bold text-white mb-6 border-b border-white/20 pb-4">Gereksinimler</h3>
                  <ul className="space-y-4">
                    {checklist.visible.map((item, i) => (
                      <li key={i} className="flex items-center gap-3 font-medium text-emerald-50">
                        <div className="w-2 h-2 bg-emerald-400 rounded-sm rotate-45"></div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {gorseller.length > 0 && (
                  <div className="h-48 rounded-3xl overflow-hidden border border-white/20">
                    <img src={gorseller[0]} alt="Kamp" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-white text-black p-12 flex flex-col justify-between border-8 border-black">
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h2 className={`mb-3 ${getPosterKurumClass()} text-black`}>{kurumLabel}</h2>
            <h1 className={`font-black uppercase tracking-tight max-w-4xl ${titleClass}`}>{baslikText}</h1>
          </div>
          {logoPreview && <img src={logoPreview} alt="Logo" className="h-20 object-contain shrink-0" />}
        </div>
        
        <div className="flex gap-10 border-t-4 border-b-4 border-black py-6 my-4 flex-1 min-h-0 overflow-hidden">
          <div className="w-1/3 flex flex-col justify-between border-r-4 border-black pr-10">
            <div className="space-y-6">
              <div>
                <div className={`${getPosterMetaLabelClass()} text-black/60 mb-1`}>Tarih</div>
                <div className="text-[32px] font-black leading-tight">{tarihLine}</div>
              </div>
              {saatLine && (
              <div>
                <div className={`${getPosterMetaLabelClass()} text-black/60 mb-1`}>Zaman</div>
                <div className="text-[28px] font-black leading-tight">{saatLine}</div>
              </div>
              )}
              <div>
                <div className={`${getPosterMetaLabelClass()} text-black/60 mb-1`}>Sınıf</div>
                <div className="text-[28px] font-black leading-tight">{values.sinifSeviyesi}</div>
              </div>
            </div>
            {gorseller.length > 0 && (
              <div className="h-48 w-full border-4 border-black overflow-hidden mt-8">
                <img src={gorseller[0]} alt="Görsel" className="w-full h-full object-cover grayscale" />
              </div>
            )}
          </div>
          
          <div className="w-1/3 border-r-4 border-black pr-10 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-[22px] font-bold uppercase tracking-widest mb-4 shrink-0">Program</h3>
            <div className={`space-y-3 flex-1 overflow-hidden ${flowTextClass}`}>
              {flow.items.map((item, i) => (
                <div key={i} className="flex justify-between gap-2 border-b-2 border-black/20 pb-2">
                  <div className="font-bold shrink-0">{item.saat}</div>
                  <div className="font-bold text-right line-clamp-1">{item.baslik}</div>
                </div>
              ))}
              {flow.note && <p className="text-[16px] font-medium pt-1">{flow.note}</p>}
            </div>
          </div>
          
          <div className="w-1/3 flex flex-col min-h-0 overflow-hidden">
            <h3 className="text-[22px] font-bold uppercase tracking-widest mb-4 shrink-0">Gereksinimler</h3>
            <ul className="space-y-2 text-[18px] font-bold mb-4">
              {checklist.visible.map((item, i) => (
                <li key={i} className="flex gap-2 before:content-['+']">{item}</li>
              ))}
              {checklist.extraLabel && <li className="text-[16px] font-normal">{checklist.extraLabel}</li>}
            </ul>
            <p className={`${bodyClass} font-bold mt-auto italic text-balance border-l-4 border-black pl-4 line-clamp-4`}>
              {bodyText}
            </p>
          </div>
        </div>
        
        <div className="text-center font-bold text-[22px] uppercase tracking-wide line-clamp-2 shrink-0 pt-2">
          {guvenText}
        </div>
      </div>
    );
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-12">
        <PageHeader
          accent="indigo"
          title="Yatılı Alıştırma Programı"
          description="Tarih, akış ve veli bilgileriyle yatılı alıştırma afişi hazırlayın."
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          <div className="xl:col-span-5 space-y-6">
            <SectionCard noPadding className="overflow-hidden">
              <Form {...form}>
                <form>
                  <Accordion type="single" collapsible defaultValue="genel-bilgiler" className="w-full">
                    
                    <AccordionItem value="genel-bilgiler" className="border-b px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-lg">1. Genel Bilgiler</span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-6 pt-2">
                        <FormField control={form.control} name="kurumAdi" render={({ field }) => (
                          <FormItem><FormLabel>Kurum/Yurt Adı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />

                        <FormField control={form.control} name="programBasligi" render={({ field }) => (
                          <FormItem><FormLabel>Program Başlığı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="tarih" render={({ field }) => (
                            <FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="sinifSeviyesi" render={({ field }) => (
                            <FormItem><FormLabel>Sınıf</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField control={form.control} name="baslangicSaati" render={({ field }) => (
                            <FormItem><FormLabel>Başlangıç Saati</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bitisSaati" render={({ field }) => (
                            <FormItem><FormLabel>Bitiş Saati</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                          )} />
                        </div>

                        <FormField control={form.control} name="kontenjan" render={({ field }) => (
                          <FormItem><FormLabel>Kontenjan</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />

                        <FormField control={form.control} name="kisaAciklama" render={({ field }) => (
                          <FormItem><FormLabel>Kısa Açıklama</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                        )} />

                        <FormField control={form.control} name="veliGuvenMesaji" render={({ field }) => (
                          <FormItem><FormLabel>Veli Güven Mesajı</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                        )} />

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Logo Yükle (Opsiyonel)</label>
                          <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="program-akisi" className="border-b px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-lg">2. Program Akışı</span>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-6 pt-2">
                        <div className="flex justify-end mb-2">
                          <Button type="button" variant="outline" size="sm" onClick={addAkis}>
                            <Plus className="w-4 h-4 mr-1"/> Satır Ekle
                          </Button>
                        </div>
                        <div className="space-y-3">
                          {akis.map((item, index) => (
                            <div key={index} className="flex items-start gap-2 bg-muted/50 p-3 rounded-md border">
                              <Input className="w-20 h-9 bg-background" placeholder="Saat" value={item.saat} onChange={e => updateAkis(index, 'saat', e.target.value)} />
                              <div className="flex-1 space-y-2">
                                <Input className="h-9 bg-background font-medium" placeholder="Başlık" value={item.baslik} onChange={e => updateAkis(index, 'baslik', e.target.value)} />
                                <Input className="h-8 text-xs bg-background" placeholder="Kısa açıklama" value={item.aciklama} onChange={e => updateAkis(index, 'aciklama', e.target.value)} />
                              </div>
                              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive shrink-0" onClick={() => removeAkis(index)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="getirilecekler" className="border-b px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-lg">3. Getirilecekler</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pt-2">
                        <div className="grid grid-cols-2 gap-3">
                          {ihtiyacListesi.map(item => (
                            <div key={item} className="flex items-center space-x-2 border p-2 rounded bg-background hover:bg-muted/50 transition-colors">
                              <Checkbox id={`ihtiyac-${item}`} checked={ihtiyaclar.includes(item)} onCheckedChange={() => toggleIhtiyac(item)} />
                              <label htmlFor={`ihtiyac-${item}`} className="text-sm cursor-pointer select-none font-medium flex-1">{item}</label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="gorseller" className="border-b px-6">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-lg">4. Görseller</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pt-2 space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Afiş Görseli Ekle (Maks. 4)</label>
                          <Input type="file" accept="image/*" onChange={handleGorselUpload} disabled={gorseller.length >= 4} />
                          <p className="text-xs text-muted-foreground">Şablona göre farklı yerleşimlerde kullanılır.</p>
                        </div>
                        
                        {gorseller.length > 0 && (
                          <div className="grid grid-cols-2 gap-3 mt-4">
                            {gorseller.map((g, i) => (
                              <div key={i} className="relative group rounded-md overflow-hidden border-2 aspect-video">
                                <img src={g} alt={`Görsel ${i}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Button type="button" variant="destructive" size="sm" onClick={() => removeGorsel(i)}>Sil</Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="sablon" className="px-6 border-none">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-lg text-primary">5. Şablon Seç & İndir</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-6 pt-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                            <Button 
                              key={num} 
                              type="button" 
                              variant={values.sablon === String(num) ? 'default' : 'outline'} 
                              size="sm"
                              className={values.sablon === String(num) ? 'ring-2 ring-primary ring-offset-1' : ''}
                              onClick={() => form.setValue('sablon', String(num))}
                            >
                              Şablon {num}
                            </Button>
                          ))}
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-dashed">
                          <Button type="button" variant="outline" className="flex-1" onClick={downloadPdf}>
                            <Download className="w-4 h-4 mr-2" /> PDF İndir
                          </Button>
                          <Button type="button" className="flex-1" onClick={downloadImage}>
                            <Download className="w-4 h-4 mr-2" /> PNG İndir
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                  </Accordion>
                </form>
              </Form>
            </SectionCard>
          </div>

          <div className="xl:col-span-7">
            <div className="bg-muted/30 border rounded-lg p-4 md:p-8 flex items-start justify-center min-h-[700px] w-full min-w-0 sticky top-8">
              <PosterCanvas ref={exportRef} aspect={posterAspect} className="max-w-full">
                {renderTemplateContent()}
              </PosterCanvas>
            </div>
          </div>
        </div>
      </div>
    </DavetLayout>
  );
}