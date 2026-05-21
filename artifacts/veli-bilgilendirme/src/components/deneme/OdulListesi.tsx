import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import { Check, ChevronDown, ChevronUp, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ODUL_MODELLERI,
  ODUL_SEVIYE_SECENEKLERI,
  SIRALI_TEK_RANK,
  siraliRankMusait,
  yeniHavuzId,
  type DenemeSinaviFormData,
  type HavuzOgesi,
  type IlkXKazananGrubu,
  type KatilimHedefi,
  type Odul,
  type SecimHakkiKimde,
} from "@/types/denemeSinavi";
import { OdulEkleDialog } from "./OdulEkleDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

function dosyaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function siraliDereceVar(oduller: Odul[]): boolean {
  return oduller.some((o) => SIRALI_TEK_RANK.includes(o.rank as (typeof SIRALI_TEK_RANK)[number]));
}

export function OdulListesi({
  form,
  setForm,
}: {
  form: DenemeSinaviFormData;
  setForm: Dispatch<SetStateAction<DenemeSinaviFormData>>;
}) {
  const [acikIdler, setAcikIdler] = useState<Record<string, boolean>>({});
  const [odulDialog, setOdulDialog] = useState(false);

  const odulGuncelle = (id: string, patch: Partial<Odul>) => {
    setForm((p) => {
      if (patch.rank && p.odulModeli === "sirali") {
        const baska = p.oduller.some((x) => x.id !== id && x.rank === patch.rank);
        if (baska) return p;
      }
      return {
        ...p,
        oduller: p.oduller.map((x) => (x.id === id ? { ...x, ...patch } : x)),
      };
    });
  };

  const odulSil = (id: string) => {
    setForm((p) => ({ ...p, oduller: p.oduller.filter((x) => x.id !== id) }));
  };

  const tasi = (idx: number, yon: -1 | 1) => {
    const j = idx + yon;
    if (j < 0 || j >= form.oduller.length) return;
    setForm((p) => {
      const n = [...p.oduller];
      [n[idx], n[j]] = [n[j], n[idx]];
      return { ...p, oduller: n };
    });
  };

  const havuzEkle = () => {
    const h: HavuzOgesi = { id: yeniHavuzId(), ad: "" };
    setForm((p) => ({ ...p, havuzOgeleri: [...p.havuzOgeleri, h] }));
  };

  const havuzGuncelle = (id: string, ad: string) => {
    setForm((p) => ({
      ...p,
      havuzOgeleri: p.havuzOgeleri.map((x) => (x.id === id ? { ...x, ad } : x)),
    }));
  };

  const havuzSil = (id: string) => {
    setForm((p) => ({ ...p, havuzOgeleri: p.havuzOgeleri.filter((x) => x.id !== id) }));
  };

  const modelSec = (id: DenemeSinaviFormData["odulModeli"]) => {
    setForm((p) => {
      const onceki = p.odulModeli;
      if (onceki === "sirali" && id !== "sirali" && siraliDereceVar(p.oduller)) {
        toast.message("Bu modelde derece kullanılmaz. Ödüller yeni modele uygun afişte gösterilir; verileriniz silinmez.", { duration: 5200 });
      }
      let oduller = p.oduller;
      if (id === "sirali") {
        const g = new Set<string>();
        oduller = p.oduller.filter((o) => {
          const ok = SIRALI_TEK_RANK.includes(o.rank as (typeof SIRALI_TEK_RANK)[number]);
          if (!ok) return false;
          if (g.has(o.rank)) return false;
          g.add(o.rank);
          return true;
        });
      }
      return { ...p, odulModeli: id, oduller };
    });
  };

  const havuzGoster =
    form.odulModeli !== "sirali" &&
    (form.odulModeli === "ilkX" || form.odulModeli === "cekilis" || form.odulModeli === "katilim");

  const dereceFormu = form.odulModeli === "sirali";
  /** Sadece havuzdan kart (eski secimli) ise ödül listesi formunu gizle. */
  const odulListesiAcik = !(
    form.odulModeli === "ilkX" &&
    form.oduller.length === 0 &&
    form.havuzOgeleri.some((h) => h.ad.trim())
  );

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-sm font-bold text-slate-800">
          Ödül modeli <span className="font-normal text-red-600">*</span>
        </Label>
        <p className="mt-0.5 text-[11px] text-slate-500">Modele göre form ve afiş tamamen değişir.</p>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {ODUL_MODELLERI.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => modelSec(m.id)}
              className={cn(
                "flex min-h-[4.5rem] items-start gap-2 rounded-xl border p-3 text-left transition",
                form.odulModeli === m.id ? "border-indigo-600 bg-indigo-50/90 shadow-sm ring-1 ring-indigo-200" : "border-slate-200 bg-white hover:border-slate-300",
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900">{m.label}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-slate-600">{m.aciklama}</p>
              </div>
              {form.odulModeli === m.id ? <Check className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600" aria-hidden /> : null}
            </button>
          ))}
        </div>
      </div>

      {form.odulModeli === "sirali" && (
        <div className="rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] text-sky-950">
          <strong>Sıralı ödül:</strong> Her derece (1., 2., 3., Özel) için tek ödül; aynı derece iki kez seçilemez.
        </div>
      )}

      {form.odulModeli === "ilkX" && (
        <div className="space-y-3 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
          <Label className="text-xs font-bold text-emerald-950">İlk X kişi</Label>
          <div>
            <Label className="text-[11px] text-slate-600">Kaç kişi? (X)</Label>
            <Input
              className="mt-0.5 h-9 text-sm"
              inputMode="numeric"
              value={form.odulIlkX}
              onChange={(e) => setForm((p) => ({ ...p, odulIlkX: e.target.value.replace(/\D/g, "").slice(0, 4) || "" }))}
              placeholder="10"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-600">Kazanan grubu</Label>
            <Select value={form.ilkXKazananGrubu} onValueChange={(v) => setForm((p) => ({ ...p, ilkXKazananGrubu: v as IlkXKazananGrubu }))}>
              <SelectTrigger className="mt-0.5 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">İlk 10</SelectItem>
                <SelectItem value="20">İlk 20</SelectItem>
                <SelectItem value="50">İlk 50</SelectItem>
                <SelectItem value="ozel">Özel metin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.ilkXKazananGrubu === "ozel" && (
            <Input
              className="h-9 text-xs"
              value={form.ilkXKazananOzel}
              onChange={(e) => setForm((p) => ({ ...p, ilkXKazananOzel: e.target.value }))}
              placeholder="Örn. İlk 15 öğrenci"
            />
          )}
          <div>
            <Label className="text-[11px] text-slate-600">Seçim hakkı kimde? (havuz kullanıyorsanız)</Label>
            <Select value={form.secimHakkiKimde} onValueChange={(v) => setForm((p) => ({ ...p, secimHakkiKimde: v as SecimHakkiKimde }))}>
              <SelectTrigger className="mt-0.5 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ilk_10">İlk 10</SelectItem>
                <SelectItem value="ilk_20">İlk 20</SelectItem>
                <SelectItem value="dereceye_girenler">Dereceye girenler</SelectItem>
                <SelectItem value="ozel">Özel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.secimHakkiKimde === "ozel" && (
            <Input
              className="h-9 text-xs"
              value={form.secimHakkiOzel}
              onChange={(e) => setForm((p) => ({ ...p, secimHakkiOzel: e.target.value }))}
              placeholder="Örn. Başarı sıralamasına göre ilk 12"
            />
          )}
          <p className="text-[10px] text-emerald-900/85">
            Ödülleri listeden ekleyebilir veya yalnız havuz doldurup kartları havuzdan üretebilirsiniz; derece satırı yoktur.
          </p>
        </div>
      )}

      {form.odulModeli === "katilim" && (
        <div className="space-y-3 rounded-xl border border-violet-100 bg-violet-50/40 p-3">
          <Label className="text-xs font-bold text-violet-950">Katılım hediyesi</Label>
          <div>
            <Label className="text-[11px] text-slate-600">Kimlere verilecek?</Label>
            <Select value={form.katilimHedefi} onValueChange={(v) => setForm((p) => ({ ...p, katilimHedefi: v as KatilimHedefi }))}>
              <SelectTrigger className="mt-0.5 h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tum_katilimcilara">Tüm katılımcılara</SelectItem>
                <SelectItem value="kayit_yaptiranlar">Kayıt yaptıranlara</SelectItem>
                <SelectItem value="sinava_girenlere">Sınava girenlere</SelectItem>
                <SelectItem value="ozel">Özel</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.katilimHedefi === "ozel" && (
            <Input
              className="h-9 text-xs"
              value={form.katilimHedefOzel}
              onChange={(e) => setForm((p) => ({ ...p, katilimHedefOzel: e.target.value }))}
              placeholder="Örn. Ön kayıt yaptıran herkese"
            />
          )}
          <div>
            <Label className="text-[11px] text-slate-600">Kaç kişi (opsiyonel)</Label>
            <Input
              className="mt-0.5 h-9 text-xs"
              value={form.katilimKisiOpsiyonel}
              onChange={(e) => setForm((p) => ({ ...p, katilimKisiOpsiyonel: e.target.value }))}
              placeholder="Örn. 200 kişi"
            />
          </div>
        </div>
      )}

      {form.odulModeli === "cekilis" && (
        <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/40 p-3">
          <Label className="text-xs font-bold text-amber-950">Çekiliş</Label>
          <div>
            <Label className="text-[11px] text-slate-600">Çekilişe kimler katılır?</Label>
            <Textarea
              className="mt-0.5 min-h-[52px] text-xs"
              value={form.cekilisKimlerKatilir}
              onChange={(e) => setForm((p) => ({ ...p, cekilisKimlerKatilir: e.target.value }))}
              placeholder="Örn. Ön kayıt yaptıran tüm öğrenciler"
            />
          </div>
          <div>
            <Label className="text-[11px] text-slate-600">Kaç kişi kazanır?</Label>
            <Input
              className="mt-0.5 h-9 text-xs"
              value={form.cekilisKacKazanir}
              onChange={(e) => setForm((p) => ({ ...p, cekilisKacKazanir: e.target.value }))}
              placeholder="Örn. 5 kişi"
            />
          </div>
        </div>
      )}

      {havuzGoster && (
        <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label className="text-xs font-bold text-amber-950">
              {form.odulModeli === "ilkX" && form.oduller.length === 0 ? "Havuz öğeleri (kartlar)" : "Ödül havuzu"}
            </Label>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1 border-amber-200 text-xs" onClick={havuzEkle}>
              <Plus className="h-3.5 w-3.5" />
              Öğe ekle
            </Button>
          </div>
          <div className="mt-2 space-y-2">
            {form.havuzOgeleri.length === 0 && <p className="text-center text-[11px] text-amber-800/70">Henüz havuz öğesi yok.</p>}
            {form.havuzOgeleri.map((h) => (
              <div key={h.id} className="flex gap-2">
                <Input className="h-9 flex-1 text-xs" value={h.ad} onChange={(e) => havuzGuncelle(h.id, e.target.value)} placeholder="Ödül adı" />
                <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-red-600" onClick={() => havuzSil(h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {odulListesiAcik && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label className="text-sm font-bold text-slate-800">Hediye / ödül listesi</Label>
              <p className="text-[10px] text-slate-500">
                {form.odulModeli === "ilkX" || form.odulModeli === "cekilis" || form.odulModeli === "katilim"
                  ? "Derece seçilmez; sadece ödül adı ve görsel."
                  : "Derece seçimi ve ödül detayı."}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" className="h-11 min-h-11 gap-1 px-4 text-xs font-bold" onClick={() => setOdulDialog(true)}>
              <Plus className="h-4 w-4" />
              Ekle
            </Button>
          </div>

          <OdulEkleDialog acik={odulDialog} onAcikDegistir={setOdulDialog} form={form} setForm={setForm} />

          {form.oduller.length === 0 && (
            <p className="rounded-lg border border-dashed border-slate-200 bg-white px-3 py-3 text-center text-[11px] text-slate-500">
              Liste boşken afiş yine düzenli görünür. Modelinize göre öğe ekleyin.
            </p>
          )}

          <div className="space-y-2">
            {form.oduller.map((o, idx) => {
              const ozet = dereceFormu ? `🏆 ${o.rank}${o.title ? ` — ${o.title}` : ""}` : `🎁 ${o.title || "Hediye"}`;
              const acik = acikIdler[o.id] ?? false;
              return (
                <Collapsible
                  key={o.id}
                  open={acik}
                  onOpenChange={(v) => setAcikIdler((prev) => ({ ...prev, [o.id]: v }))}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left transition hover:bg-slate-50">
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800">{ozet}</span>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-slate-400 transition ${acik ? "rotate-90" : ""}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 border-t border-slate-100 px-3 pb-3 pt-2">
                      <div className="flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => tasi(idx, -1)} disabled={idx === 0}>
                          <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => tasi(idx, 1)} disabled={idx === form.oduller.length - 1}>
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => odulSil(o.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className={cn("grid gap-2", dereceFormu ? "sm:grid-cols-2" : "sm:grid-cols-1")}>
                        {dereceFormu && (
                          <div>
                            <Label className="text-[11px] text-slate-500">Derece</Label>
                            <Select value={o.rank} onValueChange={(v) => odulGuncelle(o.id, { rank: v })}>
                              <SelectTrigger className="h-9 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ODUL_SEVIYE_SECENEKLERI.map((r) => {
                                  if (!SIRALI_TEK_RANK.includes(r as (typeof SIRALI_TEK_RANK)[number])) return null;
                                  const musait = siraliRankMusait(form, r, o.id);
                                  return (
                                    <SelectItem key={r} value={r} disabled={!musait}>
                                      {r}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        <div>
                          <Label className="text-[11px] text-slate-500">Ödül / hediye adı</Label>
                          <Input className="h-9 text-xs" value={o.title} onChange={(e) => odulGuncelle(o.id, { title: e.target.value })} placeholder="Tablet" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Ödül açıklaması (opsiyonel, önerilir)</Label>
                        <p className="mb-0.5 text-[10px] text-slate-500">Kısa metin otomatik duyuruya eklenir.</p>
                        <Textarea
                          className="min-h-[48px] text-xs"
                          value={o.description ?? ""}
                          onChange={(e) => odulGuncelle(o.id, { description: e.target.value })}
                          placeholder="Örn. 10 inç, garantili"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px] text-slate-500">Görsel (opsiyonel)</Label>
                        <Input
                          type="file"
                          accept="image/*"
                          className="h-9 cursor-pointer text-xs"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const image = await dosyaBase64(f);
                              odulGuncelle(o.id, { image });
                            } catch {
                              /* ignore */
                            }
                            e.target.value = "";
                          }}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </>
      )}

      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
        <Label className="text-xs font-bold text-slate-800">Ek şartlar (afişte küçük kutu)</Label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <div>
            <Label className="text-[10px] text-slate-500">Kim kazanır</Label>
            <Input
              className="mt-0.5 h-8 text-xs"
              value={form.odulSartlari.kimKazanir}
              onChange={(e) => setForm((p) => ({ ...p, odulSartlari: { ...p.odulSartlari, kimKazanir: e.target.value } }))}
              placeholder={form.odulModeli === "cekilis" ? "Çekiliş kuralları" : "Örn. İlk 10"}
            />
          </div>
          <div>
            <Label className="text-[10px] text-slate-500">Kaç kişi</Label>
            <Input
              className="mt-0.5 h-8 text-xs"
              value={form.odulSartlari.kacKisi}
              onChange={(e) => setForm((p) => ({ ...p, odulSartlari: { ...p.odulSartlari, kacKisi: e.target.value } }))}
              placeholder="10 kişi"
            />
          </div>
        </div>
        <div className="mt-2">
          <Label className="text-[10px] text-slate-500">Şart metni</Label>
          <Textarea
            className="mt-0.5 min-h-[52px] text-xs"
            value={form.odulSartlari.sartMetni}
            onChange={(e) => setForm((p) => ({ ...p, odulSartlari: { ...p.odulSartlari, sartMetni: e.target.value } }))}
            placeholder="Kurallar..."
          />
        </div>
        <div className="mt-2">
          <Label className="text-[10px] text-slate-500">Not</Label>
          <Input
            className="mt-0.5 h-8 text-xs"
            value={form.odulSartlari.not}
            onChange={(e) => setForm((p) => ({ ...p, odulSartlari: { ...p.odulSartlari, not: e.target.value } }))}
            placeholder="Opsiyonel not"
          />
        </div>
      </div>
    </div>
  );
}
