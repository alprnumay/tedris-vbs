import { LogoRenderer } from "./render/LogoRenderer";
import type { LogoConfigV1 } from "@/types/logoKimlik";

interface Props {
  config: LogoConfigV1;
}

export function LogoOnizleme({ config }: Props) {
  const ad = config.organization.kurumAdi || "Kurum";

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">Büyük önizleme</p>
        <div className="flex justify-center rounded-xl bg-slate-50 p-6">
          <LogoRenderer config={config} size={320} />
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">WhatsApp profil</p>
          <div className="flex items-center gap-3 rounded-xl bg-slate-100 p-3">
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-2 border-white shadow">
              <LogoRenderer config={config} size={56} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-slate-800">{ad}</p>
              <p className="text-[10px] text-slate-500">Çevrimiçi</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Afiş mini logo</p>
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                <LogoRenderer config={config} size={40} />
              </div>
              <p className="text-[10px] font-bold leading-tight text-slate-800">{ad}</p>
            </div>
            <div className="h-2 rounded bg-slate-200" />
            <div className="mt-1 h-2 w-4/5 rounded bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
