import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OdulListesi } from "./OdulListesi";
import { sablonGaleriAdi } from "./DenemeSablonGalerisi";
import type { AfisFormati, CtaTipi, DenemeSinaviFormData, DuzenlemeModu, MetinTonu, OncelikOgesi } from "@/types/denemeSinavi";
import { KATILIM_TURLERI, ONCELIK_MAX, ONCELIK_SECENEKLERI, SINIF_SEVIYELERI } from "@/types/denemeSinavi";
import { cn } from "@/lib/utils";

function dosyaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function FormBolumu({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-3", className)}>{children}</div>;
}

const FORMATLAR: { id: AfisFormati; label: string }[] = [
  { id: "kare", label: "Kare (Instagram)" },
  { id: "dikey", label: "Dikey poster" },
  { id: "story", label: "Story (9:16)" },
  { id: "a4", label: "A4 oranı" },
  { id: "yatay", label: "Yatay" },
];

export function DenemeSinaviForm({
  form,
  setForm,
  duyuruElleDuzenlendi,
  setDuyuruElleDuzenlendi,
  onSablonGaleri,
}: {
  form: DenemeSinaviFormData;
  setForm: Dispatch<SetStateAction<DenemeSinaviFormData>>;
  duyuruElleDuzenlendi: boolean;
  setDuyuruElleDuzenlendi: (v: boolean) => void;
  onSablonGaleri: () => void;
}) {
  const tonSec = (ton: MetinTonu) => setForm((p) => ({ ...p, metinTonu: ton }));

  const oncelikDegistir = (i: number, yeni: OncelikOgesi) => {
    setForm((p) => {
      const a = [...p.oncelikler];
      while (a.length < ONCELIK_MAX) a.push("odul_hediye");
      const j = a.indexOf(yeni);
      if (j !== -1 && j !== i) a[j] = a[i];
      a[i] = yeni;
      return { ...p, oncelikler: a.slice(0, ONCELIK_MAX) };
    });
  };

  const oncelikTasi = (i: number, yon: -1 | 1) => {
    setForm((p) => {
      const a = [...p.oncelikler];
      while (a.length < ONCELIK_MAX) a.push("odul_hediye");
      const j = i + yon;
      if (j < 0 || j >= ONCELIK_MAX) return p;
      [a[i], a[j]] = [a[j], a[i]];
      return { ...p, oncelikler: a };
    });
  };

  const gorselAlan = (alan: "kurumLogo" | "anaGorsel" | "arkaPlanGorseli", label: string) => (
    <div>
      <Label className="text-[11px] text-slate-500">{label}</Label>
      <Input
        type="file"
        accept="image/*"
        className="mt-0.5 h-10 cursor-pointer text-xs"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const url = await dosyaBase64(f);
            setForm((p) => ({ ...p, [alan]: url }));
          } catch {
            /* ignore */
          }
          e.target.value = "";
        }}
      />
    </div>
  );

  const tarihEtiket = "Tarih";

  const sinifCokToggle = (s: string) => {
    setForm((p) => {
      const set = new Set(p.sinifCoklu);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      return { ...p, sinifCoklu: [...set].sort((a, b) => a.localeCompare(b, "tr")) };
    });
  };

  const kurumIcerik = (
    <FormBolumu>
      <div>
        <Label className="text-sm font-bold text-slate-800">Kurum adı</Label>
        <Input className="mt-1 h-11 text-sm" value={form.kurumAdi} onChange={(e) => setForm((p) => ({ ...p, kurumAdi: e.target.value }))} placeholder="Örn. Özel Eğitim Kursu" />
      </div>
      {gorselAlan("kurumLogo", "Kurum logosu")}
      <div>
        <Label className="text-[11px] text-slate-500">İletişim telefonu</Label>
        <Input className="mt-0.5 h-10 text-sm" value={form.telefon} onChange={(e) => setForm((p) => ({ ...p, telefon: e.target.value }))} placeholder="05xx xxx xx xx" />
      </div>
      <div>
        <Label className="text-[11px] text-slate-500">Adres / konum (kısa)</Label>
        <Input className="mt-0.5 h-10 text-sm" value={form.adres} onChange={(e) => setForm((p) => ({ ...p, adres: e.target.value }))} placeholder="İlçe, cadde veya kısa adres" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[11px] text-slate-500">Instagram (opsiyonel)</Label>
          <Input className="mt-0.5 h-10 text-sm" value={form.instagram} onChange={(e) => setForm((p) => ({ ...p, instagram: e.target.value }))} placeholder="@kurum" />
        </div>
        <div>
          <Label className="text-[11px] text-slate-500">Web (opsiyonel)</Label>
          <Input className="mt-0.5 h-10 text-sm" value={form.web} onChange={(e) => setForm((p) => ({ ...p, web: e.target.value }))} placeholder="https://..." />
        </div>
      </div>
    </FormBolumu>
  );

  const sinavIcerik = (
    <FormBolumu>
      <div>
        <Label className="text-sm font-bold text-slate-800">Başlık</Label>
        <Input className="mt-1 h-11 text-sm" value={form.baslik} onChange={(e) => setForm((p) => ({ ...p, baslik: e.target.value }))} placeholder="Etkinlik başlığı" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-[11px] text-slate-500">{tarihEtiket}</Label>
          <Input type="date" className="mt-0.5 h-10 text-xs" value={form.tarih} onChange={(e) => setForm((p) => ({ ...p, tarih: e.target.value }))} />
        </div>
        <div>
          <Label className="text-[11px] text-slate-500">Saat</Label>
          <Input type="time" className="mt-0.5 h-10 text-xs" value={form.saat} onChange={(e) => setForm((p) => ({ ...p, saat: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label className="text-sm font-bold text-slate-800">Sınıf / hedef kitle</Label>
        <RadioGroup
          value={form.sinifModu}
          onValueChange={(v) => setForm((p) => ({ ...p, sinifModu: v as DenemeSinaviFormData["sinifModu"] }))}
          className="mt-2 grid gap-2"
        >
          {(
            [
              { id: "tek" as const, label: "Tek seçim" },
              { id: "cok" as const, label: "Çoklu seçim" },
              { id: "ozel" as const, label: "Özel metin" },
            ] as const
          ).map((m) => (
            <div key={m.id} className="flex items-center gap-2">
              <RadioGroupItem value={m.id} id={`sinif-${m.id}`} />
              <Label htmlFor={`sinif-${m.id}`} className="cursor-pointer text-xs font-medium">
                {m.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {form.sinifModu === "tek" && (
        <div>
          <Label className="text-[11px] text-slate-500">Sınıf seviyesi</Label>
          <Select value={form.sinifTek} onValueChange={(v) => setForm((p) => ({ ...p, sinifTek: v }))}>
            <SelectTrigger className="mt-0.5 h-10 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SINIF_SEVIYELERI.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {form.sinifModu === "cok" && (
        <div className="rounded-lg border border-slate-200 bg-white p-2">
          <p className="mb-2 text-[10px] font-semibold text-slate-500">Birden fazla işaretleyin (ör. 5,6,7,8)</p>
          <div className="grid max-h-40 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3">
            {SINIF_SEVIYELERI.map((s) => (
              <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md border border-transparent px-1 py-1 text-[11px] hover:bg-slate-50">
                <Checkbox checked={form.sinifCoklu.includes(s)} onCheckedChange={() => sinifCokToggle(s)} />
                <span>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {form.sinifModu === "ozel" && (
        <div>
          <Label className="text-[11px] text-slate-500">Özel metin (afiş rozetinde görünür)</Label>
          <Input
            className="mt-0.5 h-10 text-sm"
            value={form.sinifOzelMetin}
            onChange={(e) => setForm((p) => ({ ...p, sinifOzelMetin: e.target.value }))}
            placeholder="Örn. 5, 6, 7 ve 8. sınıflar"
          />
        </div>
      )}

      <div>
        <Label className="text-[11px] text-slate-500">Katılım türü</Label>
        <Select value={form.katilimTuru} onValueChange={(v) => setForm((p) => ({ ...p, katilimTuru: v }))}>
          <SelectTrigger className="mt-0.5 h-10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KATILIM_TURLERI.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </FormBolumu>
  );

  const gorselIcerik = (
    <FormBolumu>
      <p className="text-xs text-slate-600">Ana görsel yoksa afişte gradient ve ikon kullanılır. Ek görseller 2 veya daha fazla görselde yan yana / grid düzeninde gösterilir.</p>
      {gorselAlan("anaGorsel", "Afiş ana görseli")}
      {form.duzenlemeModu !== "hizli" ? (
        <div>
          <Label className="text-[11px] text-slate-500">Ek görseller (galeri, opsiyonel)</Label>
          <Input
            type="file"
            accept="image/*"
            multiple
            className="mt-0.5 h-10 cursor-pointer text-xs"
            onChange={async (e) => {
              const files = e.target.files;
              if (!files?.length) return;
              try {
                const urls: string[] = [];
                for (const f of Array.from(files)) {
                  urls.push(await dosyaBase64(f));
                }
                setForm((p) => ({ ...p, ekGorseller: [...p.ekGorseller, ...urls] }));
              } catch {
                /* ignore */
              }
              e.target.value = "";
            }}
          />
          {form.ekGorseller.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {form.ekGorseller.map((src, i) => (
                <div key={`${i}-${src.slice(0, 24)}`} className="relative h-16 w-16 overflow-hidden rounded-lg border">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0 top-0 rounded-bl bg-black/60 px-1 text-[10px] text-white"
                    onClick={() => setForm((p) => ({ ...p, ekGorseller: p.ekGorseller.filter((_, j) => j !== i) }))}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {form.duzenlemeModu === "pro" ? gorselAlan("arkaPlanGorseli", "Arka plan (opsiyonel)") : null}
    </FormBolumu>
  );

  const tasarimIcerik = (
    <FormBolumu>
      <div className={cn(form.duzenlemeModu === "hizli" && "hidden")}>
        <Label className="text-sm font-bold text-slate-800">Öne çıkarılacak bilgiler</Label>
        <p className="mt-0.5 text-[11px] text-slate-500">
          En fazla {ONCELIK_MAX} öncelik; sıra ile büyüklük değişir. QR ilk iki sıradaysa afişte büyük QR kullanılır.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ONCELIK_SECENEKLERI.map((o) => (
            <span
              key={o.id}
              className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600"
            >
              {o.label}
            </span>
          ))}
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {Array.from({ length: ONCELIK_MAX }, (_, i) => i).map((i) => {
            const deger = form.oncelikler[i] ?? "odul_hediye";
            const etiket = `${i + 1}. öncelik`;
            return (
              <div
                key={i}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2 sm:flex-row sm:items-center sm:gap-2"
              >
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-slate-500 sm:w-28">{etiket}</span>
                <Select value={deger} onValueChange={(v) => oncelikDegistir(i, v as OncelikOgesi)}>
                  <SelectTrigger className="h-10 flex-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ONCELIK_SECENEKLERI.map((o) => (
                      <SelectItem key={o.id} value={o.id} className="text-xs">
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex shrink-0 gap-1 sm:ml-auto">
                  <Button type="button" variant="outline" size="sm" className="h-9 flex-1 px-2 text-[11px] sm:flex-none" disabled={i === 0} onClick={() => oncelikTasi(i, -1)}>
                    Yukarı
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-9 flex-1 px-2 text-[11px] sm:flex-none" disabled={i === ONCELIK_MAX - 1} onClick={() => oncelikTasi(i, 1)}>
                    Aşağı
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <Label className="text-sm font-bold text-slate-800">Kayıt linki (QR otomatik)</Label>
        <Input
          className="mt-1 h-10 text-xs"
          value={form.kayitQrUrl}
          onChange={(e) => setForm((p) => ({ ...p, kayitQrUrl: e.target.value }))}
          placeholder="https://... kayıt veya başvuru sayfası"
        />
        <p className="mt-1 text-[10px] text-slate-500">Link girildiğinde afişte QR kod üretilir. Öncelikte “QR / Kayıt” seçilirse önizlemede büyük gösterilir.</p>
      </div>

      <div>
        <Label className="text-sm font-bold text-slate-800">Afiş formatı</Label>
        <div className="mt-2 flex flex-col gap-2">
          {FORMATLAR.map((f) => (
            <Button
              key={f.id}
              type="button"
              variant={form.afisFormati === f.id ? "default" : "outline"}
              className="h-11 w-full justify-start text-xs font-semibold sm:text-sm"
              onClick={() => setForm((p) => ({ ...p, afisFormati: f.id }))}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn(form.duzenlemeModu === "hizli" && "hidden")}>
        <Label className="text-sm font-bold text-slate-800">Metin tonu</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {(
            [
              { id: "kurumsal" as const, label: "Kurumsal" },
              { id: "heyecanli" as const, label: "Heyecanlı" },
              { id: "kisa" as const, label: "Kısa ve net" },
            ] as const
          ).map((t) => (
            <Button key={t.id} type="button" size="sm" variant={form.metinTonu === t.id ? "default" : "outline"} className="h-9 min-h-11 flex-1 text-xs sm:flex-none" onClick={() => tonSec(t.id)}>
              {t.label}
            </Button>
          ))}
        </div>
      </div>

      <div className={cn(form.duzenlemeModu === "hizli" && "hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className="text-sm font-bold text-slate-800">Duyuru metni</Label>
          <Button type="button" variant="ghost" size="sm" className="h-8 min-h-11 text-[11px]" onClick={() => setDuyuruElleDuzenlendi(false)}>
            Otomatik üret
          </Button>
        </div>
        <Textarea
          className="mt-1 min-h-[100px] text-sm"
          value={form.duyuruMetni}
          onChange={(e) => {
            setDuyuruElleDuzenlendi(true);
            setForm((p) => ({ ...p, duyuruMetni: e.target.value }));
          }}
          placeholder="Otomatik metin amaç ve katılım bilgisine göre üretilir."
        />
      </div>

      <div className={cn(form.duzenlemeModu === "hizli" && "hidden")}>
        <Label className="text-sm font-bold text-slate-800">Alt çağrı (CTA)</Label>
        <Select value={form.ctaTipi} onValueChange={(v) => setForm((p) => ({ ...p, ctaTipi: v as CtaTipi }))}>
          <SelectTrigger className="mt-1 h-10 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="yok">Gösterme</SelectItem>
            <SelectItem value="kontenjan">Kontenjan sınırlı</SelectItem>
            <SelectItem value="hemen_basvur">Hemen başvur</SelectItem>
            <SelectItem value="ozel">Özel metin</SelectItem>
          </SelectContent>
        </Select>
        {form.ctaTipi === "ozel" && (
          <Input
            className="mt-2 h-10 text-sm"
            value={form.ctaOzelMetin}
            onChange={(e) => setForm((p) => ({ ...p, ctaOzelMetin: e.target.value }))}
            placeholder="Kendi CTA metniniz"
          />
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <Label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Şablon</Label>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="min-w-0 text-sm font-extrabold text-slate-900">{sablonGaleriAdi(form.sablon)}</p>
          <Button type="button" variant="outline" size="sm" className="h-11 shrink-0 px-4 text-xs font-bold" onClick={onSablonGaleri}>
            Galeriyi aç
          </Button>
        </div>
        <p className="mt-1 text-[10px] text-slate-500">Tüm şablonları küçük önizleme ile görmek için galeriyi açın.</p>
      </div>
    </FormBolumu>
  );

  return (
    <div className="space-y-4 pb-2">
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <Label className="text-sm font-extrabold text-slate-900">Düzenleme modu</Label>
        <p className="mt-0.5 text-[11px] text-slate-600">Hızlı: az alan; Standart: öncelik ve ton; Pro: tüm görsel ve CTA ayarları.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(
            [
              { id: "hizli" as const, label: "Hızlı" },
              { id: "standart" as const, label: "Standart" },
              { id: "pro" as const, label: "Pro" },
            ] as const
          ).map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={form.duzenlemeModu === m.id ? "default" : "outline"}
              className="h-10 flex-1 text-xs font-bold sm:flex-none sm:px-6"
              onClick={() => setForm((p) => ({ ...p, duzenlemeModu: m.id as DuzenlemeModu }))}
            >
              {m.label}
            </Button>
          ))}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={["kurum", "sinav"]} className="rounded-xl border border-slate-200 bg-white px-1 shadow-sm sm:px-2">
        <AccordionItem value="kurum">
          <AccordionTrigger className="px-2 text-sm font-bold text-slate-800 hover:no-underline">Kurum bilgileri</AccordionTrigger>
          <AccordionContent className="px-2">{kurumIcerik}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="sinav">
          <AccordionTrigger className="px-2 text-sm font-bold text-slate-800 hover:no-underline">Sınav bilgileri</AccordionTrigger>
          <AccordionContent className="px-2">{sinavIcerik}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="odul">
          <AccordionTrigger className="px-2 text-sm font-bold text-slate-800 hover:no-underline">Ödül sistemi</AccordionTrigger>
          <AccordionContent className="px-2">
            <OdulListesi form={form} setForm={setForm} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="gorsel">
          <AccordionTrigger className="px-2 text-sm font-bold text-slate-800 hover:no-underline">Görseller</AccordionTrigger>
          <AccordionContent className="px-2">{gorselIcerik}</AccordionContent>
        </AccordionItem>
        <AccordionItem value="tasarim">
          <AccordionTrigger className="px-2 text-sm font-bold text-slate-800 hover:no-underline">Metin ve tasarım</AccordionTrigger>
          <AccordionContent className="px-2">{tasarimIcerik}</AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
