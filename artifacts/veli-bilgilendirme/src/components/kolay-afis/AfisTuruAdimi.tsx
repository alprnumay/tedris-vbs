import { AFIS_TURLERI, type KolayAfisForm } from "@/types/kolayAfis";

export function AfisTuruAdimi({ form, onChange }: { form: KolayAfisForm; onChange: (f: KolayAfisForm) => void }) {
  return (
    <div>
      <p className="mb-3 text-sm text-slate-600">Ne tür bir afiş hazırlıyorsunuz?</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {AFIS_TURLERI.map((t) => {
          const secili = form.afisTuru === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange({ ...form, afisTuru: t.id })}
              className={[
                "rounded-2xl border-2 p-4 text-left transition active:scale-[0.99]",
                secili ? "border-indigo-500 bg-indigo-50 shadow-md ring-2 ring-indigo-100" : "border-slate-200 bg-white hover:border-indigo-300",
              ].join(" ")}
            >
              <span className="text-2xl">{t.ikon}</span>
              <p className="mt-2 text-sm font-extrabold text-slate-900">{t.ad}</p>
              <p className="mt-0.5 text-xs text-slate-600">{t.kisa}</p>
              <p className="mt-2 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-medium text-indigo-800">{t.etiket}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
