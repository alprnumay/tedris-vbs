import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { DavetLayout } from '@/modules/davet/layout/DavetLayout';
import { Button } from '@/components/davet-ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/davet-ui/form';
import { Input } from '@/components/davet-ui/input';
import { Textarea } from '@/components/davet-ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/davet-ui/select';
import { useToast } from '@/modules/davet/hooks/use-toast';
import { createShowcasePost, ShowcaseAuthError, uploadShowcaseImage } from '@/modules/davet/utils/showcaseApi';
import { Badge } from '@/components/davet-ui/badge';
import { X, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/davet-ui/label';

const formSchema = z.object({
  yurtAdi: z.string().min(2, 'Yurt adı en az 2 karakter olmalıdır'),
  mintika: z.string().min(2, 'Mıntıka adı gerekli'),
  kategori: z.string().min(1, 'Kategori seçiniz'),
  baslik: z.string().min(5, 'Başlık en az 5 karakter olmalıdır'),
  amac: z.string().min(10, 'Lütfen amacı detaylandırın'),
  talebelerNeYapti: z.string().min(10, 'Süreci detaylandırın'),
  kazanim: z.string().min(10, 'Kazanımları belirtin'),
  uygulamaYontemi: z.string().min(10, 'Uygulama yöntemini anlatın'),
  digerYurtlarNasil: z.string().min(10, 'Önerilerinizi yazın'),
  sonuc: z.string().min(10, 'Sonucu özetleyin'),
  hocaAdi: z.string().min(2, 'Hoca adı gerekli'),
});

const kategoriler = [
  'Etüt Çalışması', 'Kitap Okuma', 'Kur\'an-ı Kerim', 'Değerler Eğitimi', 
  'Sosyal Etkinlik', 'Spor Etkinliği', 'Rehberlik', 'Veli Katılımı', 
  'Yatılı Alıştırma', 'Kamp/Program', 'Başarı/Tebrik', 'Diğer'
];

export default function ShareShowcasePage() {
  const { toast } = useToast();
  const [etiketler, setEtiketler] = useState<string[]>([]);
  const [etiketInput, setEtiketInput] = useState('');
  const [fotografPreview, setFotografPreview] = useState<string>('');
  const [fotografFile, setFotografFile] = useState<File | null>(null);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [basarili, setBasarili] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yurtAdi: '', mintika: '', kategori: '', baslik: '',
      amac: '', talebelerNeYapti: '', kazanim: '', uygulamaYontemi: '',
      digerYurtlarNasil: '', sonuc: '', hocaAdi: ''
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Hata', description: 'Görsel boyutu en fazla 5MB olabilir.', variant: 'destructive' });
        return;
      }
      setFotografFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotografPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!fotografFile) {
      toast({ title: 'Görsel gerekli', description: 'Lütfen çalışmaya ait bir görsel yükleyin.', variant: 'destructive' });
      return;
    }

    setGonderiliyor(true);
    try {
      const { url } = await uploadShowcaseImage(fotografFile);
      await createShowcasePost({
        ...values,
        etiketler,
        imageUrl: url,
      });
      setBasarili(true);
      toast({
        title: "Başarılı",
        description: "Çalışmanız onaya gönderildi.",
      });
      form.reset();
      setEtiketler([]);
      setFotografPreview('');
      setFotografFile(null);
    } catch (err) {
      const msg =
        err instanceof ShowcaseAuthError
          ? 'Çalışma paylaşmak için giriş yapmanız gerekiyor.'
          : err instanceof Error
            ? err.message
            : 'Kayıt yapılamadı.';
      toast({ title: 'Hata', description: msg, variant: 'destructive' });
    } finally {
      setGonderiliyor(false);
    }
  }

  const handleAddEtiket = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (etiketInput.trim() && !etiketler.includes(etiketInput.trim())) {
        setEtiketler([...etiketler, etiketInput.trim()]);
        setEtiketInput('');
      }
    }
  };

  const removeEtiket = (tag: string) => {
    setEtiketler(etiketler.filter(t => t !== tag));
  };

  if (basarili) {
    return (
      <DavetLayout>
        <div className="max-w-lg mx-auto py-16 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto" />
          <h1 className="text-2xl font-bold">Çalışmanız onaya gönderildi</h1>
          <p className="text-muted-foreground">Yönetici onayından sonra &quot;Yayındaki Çalışmalar&quot; bölümünde görünecektir.</p>
          <Button onClick={() => setBasarili(false)}>Yeni çalışma paylaş</Button>
        </div>
      </DavetLayout>
    );
  }

  return (
    <DavetLayout>
      <div className="space-y-6 max-w-4xl mx-auto pb-12">
        <div>
          <h1 className="text-2xl font-bold">Faydalı Çalışma Paylaş</h1>
          <p className="text-muted-foreground mt-1">Yurdunuzda yaptığınız güzel bir çalışmayı diğer yurtlara örnek olması için paylaşın.</p>
        </div>

        <div className="bg-card border rounded-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Kurum Bilgisi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="yurtAdi" render={({ field }) => (
                    <FormItem><FormLabel>Yurt/Kurum Adı</FormLabel><FormControl><Input placeholder="Örn: Merkez Yurdu" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="mintika" render={({ field }) => (
                    <FormItem><FormLabel>Mıntıka</FormLabel><FormControl><Input placeholder="Örn: Marmara" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="hocaAdi" render={({ field }) => (
                    <FormItem><FormLabel>Paylaşan Hoca Adı</FormLabel><FormControl><Input placeholder="Örn: Ahmet Yılmaz" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Çalışma Özeti</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField control={form.control} name="kategori" render={({ field }) => (
                    <FormItem className="md:col-span-1">
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Kategori seçin" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {kategoriler.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="baslik" render={({ field }) => (
                    <FormItem className="md:col-span-2"><FormLabel>Çalışma Başlığı</FormLabel><FormControl><Input placeholder="Dikkat çekici bir başlık yazın" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Uygulama Detayları</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField control={form.control} name="amac" render={({ field }) => (
                    <FormItem><FormLabel>Bu çalışmanın amacı neydi?</FormLabel><FormControl><Textarea rows={3} placeholder="Bu çalışma hangi ihtiyaca cevap verdi?" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="talebelerNeYapti" render={({ field }) => (
                    <FormItem><FormLabel>Talebeler ne yaptı?</FormLabel><FormControl><Textarea rows={3} placeholder="Süreci kısaca anlatın" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="kazanim" render={({ field }) => (
                    <FormItem><FormLabel>Hangi kazanım hedeflendi?</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="uygulamaYontemi" render={({ field }) => (
                    <FormItem><FormLabel>Hocalar bu çalışmayı nasıl uyguladı?</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="digerYurtlarNasil" render={({ field }) => (
                    <FormItem><FormLabel>Diğer yurtlar bunu nasıl uygulayabilir?</FormLabel><FormControl><Textarea rows={3} placeholder="Diğer yurtlar aynı çalışmayı uygulamak isterse ilk adım ne olmalı?" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="sonuc" render={({ field }) => (
                    <FormItem><FormLabel>Kısa sonuç / gözlem</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Görsel <span className="text-destructive">*</span></h3>
                <div className="flex items-start gap-6">
                  <div className="w-32 h-32 bg-muted border-2 border-dashed rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                    {fotografPreview ? (
                      <img src={fotografPreview} alt="Önizleme" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-muted-foreground opacity-50" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label>Çalışmaya ait bir görsel yükleyin (zorunlu)</Label>
                    <Input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} />
                    <p className="text-xs text-muted-foreground">Maksimum 5MB. JPG, PNG veya WEBP.</p>
                    {fotografPreview && (
                      <Button type="button" variant="destructive" size="sm" onClick={() => { setFotografPreview(''); setFotografFile(null); }} className="mt-2">Görseli Sil</Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Etiketler</h3>
                <div className="flex items-center gap-2">
                  <Input 
                    value={etiketInput} 
                    onChange={e => setEtiketInput(e.target.value)} 
                    onKeyDown={handleAddEtiket}
                    placeholder="Etiket yazıp Enter'a basın" 
                    className="max-w-md"
                  />
                </div>
                {etiketler.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {etiketler.map(tag => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1 px-2 py-1">
                        {tag} <X size={14} className="cursor-pointer hover:text-destructive" onClick={() => removeEtiket(tag)} />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={gonderiliyor}>
                {gonderiliyor ? 'Gönderiliyor…' : 'Onaya Gönder'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </DavetLayout>
  );
}
