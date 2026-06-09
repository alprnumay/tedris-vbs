import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  buildInviteRenderModel,
} from '@/modules/davet/invite/inviteTemplateHelpers';
import {
  DEFAULT_INVITE_TEMPLATE_ID,
  getInviteTemplate,
  INVITE_TEMPLATES,
  migrateLegacyInviteTemplateId,
} from '@/modules/davet/invite/inviteTemplates';
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
  tarih: z.string().optional(),
  saat: z.string().optional(),
  yer: z.string().optional(),
  kisaAciklama: z.string().min(5, 'Davet metni gereklidir'),
  katilimNotu: z.string().optional(),
  iletisimTelefon: z.string().optional(),
  qrLink: z.string().optional(),
  sablon: z.string().default(DEFAULT_INVITE_TEMPLATE_ID),
});

export default function InvitePage() {
  const { toast } = useToast();
  const exportRef = useRef<HTMLDivElement>(null);
  const inviteSpec = POSTER_ASPECT_SPECS["invite-landscape"];
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
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
      qrLink: '',
      sablon: DEFAULT_INVITE_TEMPLATE_ID,
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const link = values.qrLink?.trim() ?? '';
    if (!link) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(link, { width: 320, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [values.qrLink]);

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

    const templateId = migrateLegacyInviteTemplateId(values.sablon);
    const template = getInviteTemplate(templateId);
    const model = buildInviteRenderModel(
      values,
      aciklama,
      selectedStudent,
      {
        hasLogo: Boolean(logoPreview),
        hasPhoto: Boolean(photoPreview),
        hasQr: Boolean(values.qrLink?.trim() && qrDataUrl),
      },
    );
    const TemplateComponent = template.Component;
    return (
      <TemplateComponent
        model={model}
        logoPreview={logoPreview}
        photoPreview={photoPreview}
        qrDataUrl={qrDataUrl}
      />
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
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {INVITE_TEMPLATES.map((tpl) => (
                        <Button
                          key={tpl.id}
                          type="button"
                          variant={migrateLegacyInviteTemplateId(values.sablon) === tpl.id ? 'default' : 'outline'}
                          size="sm"
                          className="h-auto min-h-10 whitespace-normal py-2 text-left justify-start"
                          onClick={() => form.setValue('sablon', tpl.id)}
                        >
                          <span className="block font-semibold">{tpl.label}</span>
                          <span className="block text-[10px] font-normal opacity-80">{tpl.description}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Logo Yükle (Opsiyonel)</label>
                    <Input type="file" accept="image/*" onChange={handleLogoUpload} />
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Arka Plan Görseli (Opsiyonel)</label>
                    <Input type="file" accept="image/*" onChange={handlePhotoUpload} />
                    <p className="text-[11px] text-muted-foreground">Fotoğraflı Davetiye şablonunda kullanılır.</p>
                  </div>

                  <FormField control={form.control} name="qrLink" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kayıt / QR Linki (Opsiyonel)</FormLabel>
                      <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

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