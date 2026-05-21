import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  HAZIR_ODUL_KUTUPHANESI,
  ODUL_SEVIYE_SECENEKLERI,
  SIRALI_TEK_RANK,
  siraliRankMusait,
  yeniOdulId,
  type DenemeSinaviFormData,
  type Odul,
} from "@/types/denemeSinavi";

const RANKSIZ = "Katılımcı";

function dosyaBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function OdulEkleDialog({
  acik,
  onAcikDegistir,
  form,
  setForm,
}: {
  acik: boolean;
  onAcikDegistir: (v: boolean) => void;
  form: DenemeSinaviFormData;
  setForm: Dispatch<SetStateAction<DenemeSinaviFormData>>;
}) {
  const [seviye, setSeviye] = useState<string>("1.lik");
  const [baslik, setBaslik] = useState("");
  const [aciklama, setAciklama] = useState("");
  const [gorsel, setGorsel] = useState<string | undefined>(undefined);

  const sirali = form.odulModeli === "sirali";

  useEffect(() => {
    if (!acik) return;
    if (sirali) {
      const m = ODUL_SEVIYE_SECENEKLERI.filter((r) => SIRALI_TEK_RANK.includes(r as (typeof SIRALI_TEK_RANK)[number])).find((r) =>
        siraliRankMusait(form, r),
      );
      if (m) setSeviye(m);
    } else {
      setSeviye(RANKSIZ);
    }
  }, [acik, sirali, form.oduller, form.odulModeli]);

  const sifirla = () => {
    setSeviye(sirali ? "1.lik" : RANKSIZ);
    setBaslik("");
    setAciklama("");
    setGorsel(undefined);
  };

  const kapat = () => {
    sifirla();
    onAcikDegistir(false);
  };

  const ekle = (o: Odul) => {
    if (sirali && !siraliRankMusait(form, o.rank)) {
      toast.error("Bu derece için zaten bir ödül tanımlı (sıralı model).");
      return;
    }
    setForm((p) => ({ ...p, oduller: [...p.oduller, o] }));
    kapat();
  };

  const hazirEkle = (ad: string) => {
    const rank = sirali ? seviye : RANKSIZ;
    const o: Odul = {
      id: yeniOdulId(),
      rank,
      title: ad,
      description: aciklama.trim() || undefined,
      image: gorsel,
    };
    ekle(o);
  };

  const ozelEkle = () => {
    if (!baslik.trim()) return;
    const rank = sirali ? seviye : RANKSIZ;
    const o: Odul = {
      id: yeniOdulId(),
      rank,
      title: baslik.trim(),
      description: aciklama.trim() || undefined,
      image: gorsel,
    };
    ekle(o);
  };

  const rankSecenekleri = sirali
    ? ODUL_SEVIYE_SECENEKLERI.filter((r) => SIRALI_TEK_RANK.includes(r as (typeof SIRALI_TEK_RANK)[number]))
    : [];

  return (
    <Dialog open={acik} onOpenChange={(o) => (o ? onAcikDegistir(true) : kapat())}>
      <DialogContent className="max-h-[min(90dvh,640px)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{sirali ? "Ödül ekle (derece)" : "Hediye / ödül ekle"}</DialogTitle>
          <DialogDescription>
            {sirali
              ? "Sıralı modelde 1., 2., 3. veya Özel derece başına tek ödül."
              : "Derece yok; sadece ödül adı ve görsel. Afişte derece satırı gösterilmez."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {sirali && (
            <div>
              <Label className="text-xs font-bold text-slate-700">Derece</Label>
              <Select value={seviye} onValueChange={setSeviye}>
                <SelectTrigger className="mt-1 h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rankSecenekleri.map((r) => (
                    <SelectItem key={r} value={r} disabled={!siraliRankMusait(form, r)}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-xs font-bold text-slate-700">Hazır kütüphane</Label>
            <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
              {HAZIR_ODUL_KUTUPHANESI.map((ad) => (
                <Button key={ad} type="button" variant="secondary" size="sm" className="h-8 rounded-full text-xs font-semibold" onClick={() => hazirEkle(ad)}>
                  {ad}
                </Button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3">
            <Label className="text-xs font-bold text-slate-800">Kendi öğeni ekle</Label>
            <Input className="mt-2 h-10 text-sm" value={baslik} onChange={(e) => setBaslik(e.target.value)} placeholder="Ödül / hediye adı" />
            <Textarea
              className="mt-2 min-h-[56px] text-xs"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="Ödül açıklaması (opsiyonel, önerilir — otomatik metne eklenir)"
            />
            <Label className="mt-2 block text-[11px] text-slate-500">Görsel (opsiyonel)</Label>
            <Input
              type="file"
              accept="image/*"
              className="mt-1 h-9 cursor-pointer text-xs"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                  setGorsel(await dosyaBase64(f));
                } catch {
                  setGorsel(undefined);
                }
                e.target.value = "";
              }}
            />
            <Button type="button" className="mt-3 w-full" variant="default" disabled={!baslik.trim()} onClick={ozelEkle}>
              Listeye ekle
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={kapat}>
            Vazgeç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
