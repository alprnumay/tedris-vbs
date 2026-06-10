import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
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
import { Download, Plus, Trash2, SlidersHorizontal } from 'lucide-react';
import { POSTER_ASPECT_SPECS, PosterCanvas } from '@/modules/davet/components/PosterCanvas';
import { buildExportFileName, exportPosterDesign } from '@/modules/davet/utils/exportUtils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/davet-ui/accordion';
import { Alert, AlertDescription } from '@/components/davet-ui/alert';
import { cn } from '@/lib/utils';
import {
  buildBoardingRenderModel,
  purposeToDefaultTemplate,
  USAGE_PURPOSE_OPTIONS,
  type BoardingTemplateId,
  type BoardingUsagePurpose,
} from '@/modules/davet/boarding/boardingTemplateHelpers';
import {
  BOARDING_TEMPLATES,
  DEFAULT_BOARDING_TEMPLATE_ID,
  getBoardingTemplate,
  migrateLegacyBoardingTemplateId,
} from '@/modules/davet/boarding/boardingTemplates';
import { BoardingTemplatePicker } from '@/modules/davet/boarding/BoardingTemplatePicker';
import type { BoardingCustomAdjustments, BoardingLayerId } from '@/modules/davet/boarding/boardingLayoutAdjustments';
import { BoardingLayoutEditorProvider } from '@/modules/davet/boarding/BoardingLayoutEditorContext';
import { BoardingLayerSettingsPanel } from '@/modules/davet/boarding/BoardingLayerSettingsPanel';
import { BoardingLayoutKeyboardHandler } from '@/modules/davet/boarding/BoardingLayoutKeyboardHandler';

const programTurleri = [
  'İlk Yatılı Alıştırma', 'Hafta Sonu Yatılı', 'Nehari\'den Yatılıya Geçiş',
  'Tanışma ve Uyum Gecesi', 'Yaz Kampı Öncesi Alıştırma',
];

const ihtiyacListesi = [
  'Pijama Takımı', 'Diş Fırçası ve Macunu', 'Yedek Kıyafet',
  'Kitap', 'Defter ve Kalem', 'Terlik', 'Havlu',
];

const formSchema = z.object({
  kullanimAmaci: z.enum(['program', 'davet', 'kayit']),
  kurumAdi: z.string().min(2, 'Kurum adı gereklidir'),
  programBasligi: z.string().min(2, 'Başlık gereklidir'),
  programTuru: z.string().min(1, 'Program türü seçiniz'),
  tarih: z.string().min(1, 'Tarih gereklidir'),
  baslangicSaati: z.string().min(1, 'Başlangıç saati gereklidir'),
  bitisSaati: z.string().min(1, 'Bitiş saati gereklidir'),
  yer: z.string().optional(),
  sinifSeviyesi: z.string().min(1, 'Sınıf seviyesi gereklidir'),
  kontenjan: z.string().min(1, 'Kontenjan gereklidir'),
  veliGuvenMesaji: z.string().min(5, 'Veli güven mesajı gereklidir'),
  kisaAciklama: z.string().min(5, 'Açıklama gereklidir'),
  iletisim: z.string().optional(),
  qrLink: z.string().optional(),
  sablon: z.string().default(DEFAULT_BOARDING_TEMPLATE_ID),
});

export default function BoardingProgramPage() {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const posterSpec = POSTER_ASPECT_SPECS['boarding-landscape'];

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [gorseller, setGorseller] = useState<string[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [advancedEditMode, setAdvancedEditMode] = useState(false);
  const [selectedLayerId, setSelectedLayerId] = useState<BoardingLayerId | null>(null);
  const [customAdjustments, setCustomAdjustments] = useState<BoardingCustomAdjustments>({});

  const [akis, setAkis] = useState([
    { saat: '18:00', baslik: 'Karşılama', aciklama: 'Yurda giriş ve yerleşme' },
    { saat: '18:30', baslik: 'Akşam Yemeği', aciklama: 'Birlikte yemek' },
    { saat: '19:15', baslik: 'Tanışma', aciklama: 'Oyunlar ve etkinlikler' },
    { saat: '20:00', baslik: 'Etüt', aciklama: 'Kitap okuma ve ders' },
    { saat: '21:00', baslik: 'Değerler Eğitimi', aciklama: 'Sohbet' },
    { saat: '22:00', baslik: 'Yatış', aciklama: 'Uykuya hazırlık' },
  ]);
  const [ihtiyaclar, setIhtiyaclar] = useState<string[]>(ihtiyacListesi.slice(0, 4));

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      kullanimAmaci: 'program',
      kurumAdi: 'Merkez Yurdu',
      programBasligi: 'Yatılı Alıştırma Programı',
      programTuru: 'İlk Yatılı Alıştırma',
      tarih: '',
      baslangicSaati: '18:00',
      bitisSaati: '10:00',
      yer: 'Merkez Yurdu',
      sinifSeviyesi: '4-8. Sınıf Karma',
      kontenjan: '20 Kişi',
      veliGuvenMesaji: 'Talebelerimiz bizim için bir emanettir. Tüm uyku ve güvenlik tedbirlerimizi alarak programımızı düzenliyoruz.',
      kisaAciklama: 'Talebelerimizin yatılı ortama alışması için keyifli bir program hazırladık.',
      iletisim: '',
      qrLink: '',
      sablon: DEFAULT_BOARDING_TEMPLATE_ID,
    },
  });

  const values = form.watch();
  const activeTemplateId = migrateLegacyBoardingTemplateId(values.sablon) as BoardingTemplateId;

  useEffect(() => {
    setSelectedLayerId(null);
  }, [activeTemplateId]);

  useEffect(() => {
    if (!advancedEditMode) setSelectedLayerId(null);
  }, [advancedEditMode]);

  useEffect(() => {
    let cancelled = false;
    const link = values.qrLink?.trim() ?? '';
    if (!link) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(link, { width: 280, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [values.qrLink]);

  const handlePurposeChange = (purpose: BoardingUsagePurpose) => {
    form.setValue('kullanimAmaci', purpose);
    form.setValue('sablon', purposeToDefaultTemplate(purpose));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleGorselUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (gorseller.length >= 4) {
      toast({ title: 'Sınır Aşıldı', description: 'En fazla 4 görsel yükleyebilirsiniz.', variant: 'destructive' });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGorseller((prev) => [...prev, reader.result as string]);
    reader.readAsDataURL(file);
  };

  const toggleIhtiyac = (item: string) => {
    setIhtiyaclar((prev) => (prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]));
  };

  const addAkis = () => setAkis((prev) => [...prev, { saat: '', baslik: '', aciklama: '' }]);
  const updateAkis = (index: number, field: string, value: string) => {
    setAkis((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };
  const removeAkis = (index: number) => setAkis((prev) => prev.filter((_, i) => i !== index));

  const exportHataMesaji = (err: unknown) => {
    const kod = err instanceof Error ? err.message : '';
    if (kod === 'PREVIEW_MISSING') toast({ title: 'Hata', description: 'Önizleme alanı bulunamadı.', variant: 'destructive' });
    else if (kod === 'EMPTY_EXPORT') toast({ title: 'Hata', description: 'Boş dosya oluşturulamadı.', variant: 'destructive' });
    else toast({ title: 'Hata', description: 'İndirme başarısız oldu.', variant: 'destructive' });
  };

  const runExport = async (format: 'png' | 'pdf') => {
    const prevEdit = advancedEditMode;
    const prevLayer = selectedLayerId;
    setAdvancedEditMode(false);
    setSelectedLayerId(null);
    await new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

    try {
      await exportPosterDesign(
        exportRef.current,
        buildExportFileName('yatili-alistirma', values.kurumAdi, format),
        posterSpec,
        format,
        { scale: 3, backgroundColor: '#ffffff' },
      );
      toast({ title: 'Başarılı', description: format === 'png' ? 'Afiş PNG indirildi.' : 'Afiş PDF indirildi.' });
    } catch (err) {
      exportHataMesaji(err);
    } finally {
      setAdvancedEditMode(prevEdit);
      setSelectedLayerId(prevLayer);
    }
  };

  const renderPoster = () => {
    const model = buildBoardingRenderModel(values, akis, ihtiyaclar, {
      hasLogo: Boolean(logoPreview),
      hasImages: gorseller.length > 0,
      hasQr: Boolean(values.qrLink?.trim() && qrDataUrl),
    });
    const Template = getBoardingTemplate(activeTemplateId).Component;
    return (
      <div className={cn('h-full w-full', advancedEditMode && 'cursor-crosshair')} onClick={() => advancedEditMode && setSelectedLayerId(null)}>
        <Template model={model} logoPreview={logoPreview} images={gorseller} qrDataUrl={qrDataUrl} />
      </div>
    );
  };

  return (
    <DavetLayout>
      <div className="space-y-5 pb-12">
        <PageHeader
          accent="indigo"
          title="Yatılı Alıştırma Programı"
          description="Program afişi, davet veya kayıt görseli oluşturun."
        />

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 md:gap-8">
          <div className="xl:col-span-5">
            <SectionCard noPadding className="overflow-hidden max-h-[88vh] overflow-y-auto">
              <Form {...form}>
                <form>
                  <div className="border-b px-6 py-4">
                    <FormField control={form.control} name="kullanimAmaci" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">Kullanım Amacı</FormLabel>
                        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {USAGE_PURPOSE_OPTIONS.map((opt) => (
                            <Button
                              key={opt.id}
                              type="button"
                              variant={field.value === opt.id ? 'default' : 'outline'}
                              size="sm"
                              className="h-auto min-h-10 whitespace-normal py-2"
                              onClick={() => handlePurposeChange(opt.id)}
                            >
                              {opt.label}
                            </Button>
                          ))}
                        </div>
                      </FormItem>
                    )} />
                  </div>

                  <Accordion type="single" collapsible defaultValue="temel" className="w-full">
                    <AccordionItem value="temel" className="border-b px-6">
                      <AccordionTrigger className="py-4 hover:no-underline"><span className="font-semibold">Temel Bilgiler</span></AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-6">
                        <FormField control={form.control} name="programTuru" render={({ field }) => (
                          <FormItem>
                            <FormLabel>Program Türü</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent>{programTurleri.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </FormItem>
                        )} />
                        <FormField control={form.control} name="kurumAdi" render={({ field }) => (
                          <FormItem><FormLabel>Kurum/Yurt Adı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="programBasligi" render={({ field }) => (
                          <FormItem><FormLabel>Program Başlığı</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="kisaAciklama" render={({ field }) => (
                          <FormItem><FormLabel>Açıklama</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                        )} />
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="tarih" render={({ field }) => (
                            <FormItem><FormLabel>Tarih</FormLabel><FormControl><Input type="date" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="sinifSeviyesi" render={({ field }) => (
                            <FormItem><FormLabel>Sınıf</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <FormField control={form.control} name="baslangicSaati" render={({ field }) => (
                            <FormItem><FormLabel>Başlangıç</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                          )} />
                          <FormField control={form.control} name="bitisSaati" render={({ field }) => (
                            <FormItem><FormLabel>Bitiş</FormLabel><FormControl><Input type="time" {...field} /></FormControl></FormItem>
                          )} />
                        </div>
                        <FormField control={form.control} name="yer" render={({ field }) => (
                          <FormItem><FormLabel>Yer</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="kontenjan" render={({ field }) => (
                          <FormItem><FormLabel>Kontenjan</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="veliGuvenMesaji" render={({ field }) => (
                          <FormItem><FormLabel>Alt Bilgi / Güven Notu</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl></FormItem>
                        )} />
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="akis" className="border-b px-6">
                      <AccordionTrigger className="py-4 hover:no-underline"><span className="font-semibold">Program Akışı</span></AccordionTrigger>
                      <AccordionContent className="space-y-3 pb-6">
                        <div className="flex justify-end"><Button type="button" variant="outline" size="sm" onClick={addAkis}><Plus className="mr-1 h-4 w-4" />Satır Ekle</Button></div>
                        {akis.map((item, index) => (
                          <div key={index} className="flex gap-2 rounded-md border bg-muted/40 p-3">
                            <Input className="h-9 w-20 bg-background" placeholder="Saat" value={item.saat} onChange={(e) => updateAkis(index, 'saat', e.target.value)} />
                            <div className="flex-1 space-y-2">
                              <Input className="h-9 bg-background font-medium" placeholder="Başlık" value={item.baslik} onChange={(e) => updateAkis(index, 'baslik', e.target.value)} />
                              <Input className="h-8 bg-background text-xs" placeholder="Kısa açıklama" value={item.aciklama} onChange={(e) => updateAkis(index, 'aciklama', e.target.value)} />
                            </div>
                            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-destructive" onClick={() => removeAkis(index)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="ihtiyac" className="border-b px-6">
                      <AccordionTrigger className="py-4 hover:no-underline"><span className="font-semibold">Gereksinimler</span></AccordionTrigger>
                      <AccordionContent className="pb-6">
                        <div className="grid grid-cols-2 gap-2">
                          {ihtiyacListesi.map((item) => (
                            <label key={item} className="flex cursor-pointer items-center gap-2 rounded border bg-background p-2 text-sm">
                              <Checkbox checked={ihtiyaclar.includes(item)} onCheckedChange={() => toggleIhtiyac(item)} />
                              {item}
                            </label>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="medya" className="border-b px-6">
                      <AccordionTrigger className="py-4 hover:no-underline"><span className="font-semibold">Medya</span></AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-6">
                        <div><label className="text-sm font-medium">Logo</label><Input type="file" accept="image/*" className="mt-1" onChange={handleLogoUpload} /></div>
                        <div>
                          <label className="text-sm font-medium">Görsel (maks. 4)</label>
                          <Input type="file" accept="image/*" className="mt-1" onChange={handleGorselUpload} disabled={gorseller.length >= 4} />
                        </div>
                        <FormField control={form.control} name="qrLink" render={({ field }) => (
                          <FormItem><FormLabel>QR / Kayıt Linki</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl></FormItem>
                        )} />
                        <FormField control={form.control} name="iletisim" render={({ field }) => (
                          <FormItem><FormLabel>İletişim</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
                        )} />
                        {gorseller.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2">
                            {gorseller.map((g, i) => (
                              <div key={i} className="relative aspect-video overflow-hidden rounded border">
                                <img src={g} alt="" className="h-full w-full object-cover" />
                                <Button type="button" size="sm" variant="destructive" className="absolute bottom-1 right-1 h-7 text-xs" onClick={() => setGorseller((p) => p.filter((_, j) => j !== i))}>Sil</Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="sablon" className="px-6">
                      <AccordionTrigger className="py-4 hover:no-underline"><span className="font-semibold text-primary">Şablon & İndir</span></AccordionTrigger>
                      <AccordionContent className="space-y-4 pb-6">
                        <BoardingTemplatePicker
                          templates={BOARDING_TEMPLATES}
                          value={activeTemplateId}
                          onChange={(id) => form.setValue('sablon', id)}
                        />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </form>
              </Form>
            </SectionCard>
          </div>

          <div className="xl:col-span-7 space-y-4">
            <div className="flex flex-wrap gap-2 justify-end">
              <Button type="button" variant={advancedEditMode ? 'default' : 'outline'} onClick={() => setAdvancedEditMode((v) => !v)}>
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {advancedEditMode ? 'Düzenlemeyi Kapat' : 'Gelişmiş Düzenle'}
              </Button>
              <Button type="button" variant="outline" onClick={() => runExport('pdf')}><Download className="mr-2 h-4 w-4" />PDF</Button>
              <Button type="button" onClick={() => runExport('png')}><Download className="mr-2 h-4 w-4" />PNG</Button>
            </div>

            {advancedEditMode ? (
              <Alert className="border-indigo-200 bg-indigo-50/80 text-indigo-900">
                <AlertDescription className="text-sm">Afişte bir alana dokunun; konum, boyut ve hizalama ayarlayın.</AlertDescription>
              </Alert>
            ) : null}

            <BoardingLayoutEditorProvider
              editMode={advancedEditMode}
              templateId={activeTemplateId}
              selectedLayerId={selectedLayerId}
              setSelectedLayerId={setSelectedLayerId}
              customAdjustments={customAdjustments}
              setCustomAdjustments={setCustomAdjustments}
            >
              <BoardingLayoutKeyboardHandler />
              <div className="rounded-xl border bg-slate-100/60 p-3 md:p-5">
                <PosterCanvas ref={exportRef} aspect="boarding-landscape" className="w-full max-w-none">
                  {renderPoster()}
                </PosterCanvas>
              </div>
              {advancedEditMode ? <BoardingLayerSettingsPanel /> : null}
            </BoardingLayoutEditorProvider>
          </div>
        </div>
      </div>
    </DavetLayout>
  );
}
