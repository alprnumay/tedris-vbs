import type { ReactNode } from "react";
import { RefreshCw, Minimize2 } from "lucide-react";
import { LIMIT } from "@/lib/yatili-program/yatiliAlanKurallari";
import { otomatikMetinDoldur } from "@/lib/yatili-program/yatiliMetinUretici";
import type { YatiliBlokId, YatiliProgramFormData } from "@/types/yatiliProgram";

const inputCls =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

function kisaYap(metin: string, max = 80): string {
  const t = metin.trim();
  if (t.length <= max) return t;
  const kes = t.slice(0, max);
  const son = kes.lastIndexOf(" ");
  return (son > 40 ? kes.slice(0, son) : kes).trim() + "…";
}

type AlanKey = "programTitle" | "shortIntro" | "trustMessage" | "parentNote" | "slogan" | "callToAction";

const ALAN_BLOK: Record<AlanKey, YatiliBlokId> = {
  programTitle: "baslik",
  shortIntro: "kisaAciklama",
  trustMessage: "guven",
  parentNote: "veliNot",
  slogan: "slogan",
  callToAction: "iletisim",
};

function MetinKarti({
  baslik,
  children,
  onYenile,
  onKisaYap,
}: {
  baslik: string;
  children: ReactNode;
  onYenile?: () => void;
  onKisaYap?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">{baslik}</span>
        <div className="flex shrink-0 gap-1">
          {onYenile ? (
            <button
              type="button"
              onClick={onYenile}
              className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
              title="Yenile"
            >
              <RefreshCw className="h-3 w-3" />
              Yenile
            </button>
          ) : null}
          {onKisaYap ? (
            <button
              type="button"
              onClick={onKisaYap}
              className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-50"
              title="Kısalt"
            >
              <Minimize2 className="h-3 w-3" />
              Kısa
            </button>
          ) : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function OtomatikMetinEditoru({
  form,
  onChange,
}: {
  form: YatiliProgramFormData;
  onChange: (next: YatiliProgramFormData) => void;
}) {
  const patch = (partial: Partial<YatiliProgramFormData>) => onChange({ ...form, ...partial });

  const goster = (key: AlanKey) => form.bloklar[ALAN_BLOK[key]] !== false;

  const yenileAlan = (key: keyof ReturnType<typeof otomatikMetinDoldur>) => {
    const metin = otomatikMetinDoldur(form);
    patch({ [key]: metin[key] });
  };

  const maddeGuncelle = (idx: number, val: string) => {
    const next = [...form.activities];
    next[idx] = val;
    onChange({ ...form, activities: next });
  };

  const maddeEkle = () => {
    if (form.activities.length >= LIMIT.activityMax) return;
    onChange({ ...form, activities: [...form.activities, ""] });
  };

  const maddeSil = (idx: number) => {
    if (form.activities.length <= LIMIT.activityMin) return;
    onChange({ ...form, activities: form.activities.filter((_, i) => i !== idx) });
  };

  if (!form.bloklar.maddeler && !goster("programTitle") && !goster("shortIntro") && !goster("trustMessage")) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500">
        Seçili pakette düzenlenecek metin yok. İnce ayardan blok açın veya paket değiştirin.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {goster("programTitle") ? (
        <MetinKarti baslik="Başlık" onYenile={() => yenileAlan("programTitle")} onKisaYap={() => patch({ programTitle: kisaYap(form.programTitle, 60) })}>
          <textarea
            className={inputCls}
            rows={2}
            maxLength={LIMIT.programTitleChars}
            value={form.programTitle}
            onChange={(e) => patch({ programTitle: e.target.value })}
          />
        </MetinKarti>
      ) : null}

      {goster("shortIntro") ? (
        <MetinKarti baslik="Kısa açıklama" onYenile={() => yenileAlan("shortIntro")} onKisaYap={() => patch({ shortIntro: kisaYap(form.shortIntro, LIMIT.shortIntro) })}>
          <textarea
            className={inputCls}
            rows={3}
            maxLength={LIMIT.shortIntro}
            value={form.shortIntro}
            onChange={(e) => patch({ shortIntro: e.target.value })}
          />
          <span className="mt-1 block text-[10px] text-slate-400">
            {form.shortIntro.length}/{LIMIT.shortIntro}
          </span>
        </MetinKarti>
      ) : null}

      {goster("trustMessage") ? (
        <MetinKarti baslik="Güven metni" onYenile={() => yenileAlan("trustMessage")} onKisaYap={() => patch({ trustMessage: kisaYap(form.trustMessage, 120) })}>
          <textarea
            className={inputCls}
            rows={2}
            maxLength={LIMIT.trustMessage}
            value={form.trustMessage}
            onChange={(e) => patch({ trustMessage: e.target.value })}
          />
        </MetinKarti>
      ) : null}

      {form.bloklar.maddeler ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">
              Program maddeleri ({LIMIT.activityMin}–{LIMIT.activityMax})
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => yenileAlan("activities")}
                className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-indigo-700 hover:bg-indigo-50"
              >
                <RefreshCw className="h-3 w-3" />
                Yenile
              </button>
              {form.activities.length < LIMIT.activityMax ? (
                <button type="button" onClick={maddeEkle} className="text-[10px] font-bold text-indigo-600 hover:underline">
                  + Ekle
                </button>
              ) : null}
            </div>
          </div>
          <div className="space-y-2">
            {form.activities.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  className={`${inputCls} min-w-0 flex-1`}
                  maxLength={LIMIT.activityItem}
                  value={m}
                  onChange={(e) => maddeGuncelle(i, e.target.value)}
                  placeholder={`Madde ${i + 1}`}
                />
                {form.activities.length > LIMIT.activityMin ? (
                  <button
                    type="button"
                    onClick={() => maddeSil(i)}
                    className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-2 text-xs text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label="Maddeyi sil"
                  >
                    ✕
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {goster("parentNote") ? (
        <MetinKarti baslik="Veliye not" onYenile={() => yenileAlan("parentNote")} onKisaYap={() => patch({ parentNote: kisaYap(form.parentNote, 100) })}>
          <textarea
            className={inputCls}
            rows={2}
            maxLength={LIMIT.parentNote}
            value={form.parentNote}
            onChange={(e) => patch({ parentNote: e.target.value })}
          />
        </MetinKarti>
      ) : null}

      {goster("slogan") ? (
        <MetinKarti baslik="Slogan" onYenile={() => yenileAlan("slogan")} onKisaYap={() => patch({ slogan: kisaYap(form.slogan, 48) })}>
          <input className={inputCls} value={form.slogan} onChange={(e) => patch({ slogan: e.target.value })} />
        </MetinKarti>
      ) : null}

      {goster("callToAction") ? (
        <MetinKarti baslik="Başvuru çağrısı" onYenile={() => yenileAlan("callToAction")} onKisaYap={() => patch({ callToAction: kisaYap(form.callToAction, 80) })}>
          <textarea
            className={inputCls}
            rows={2}
            maxLength={LIMIT.callToAction}
            value={form.callToAction}
            onChange={(e) => patch({ callToAction: e.target.value })}
          />
        </MetinKarti>
      ) : null}
    </div>
  );
}
