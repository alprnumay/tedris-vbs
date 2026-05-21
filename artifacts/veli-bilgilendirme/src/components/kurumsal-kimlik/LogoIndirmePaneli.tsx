interface Props {
  onAnaPngIndir: () => void;
  indiriliyor: boolean;
}

export function LogoIndirmePaneli({ onAnaPngIndir, indiriliyor }: Props) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-bold text-slate-900">İndirme</h3>
      <p className="mt-1 text-xs text-slate-600">Seçili logoyu yüksek çözünürlükte PNG olarak kaydedin.</p>

      <button
        type="button"
        onClick={onAnaPngIndir}
        disabled={indiriliyor}
        className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {indiriliyor ? "Hazırlanıyor…" : "Ana PNG indir"}
      </button>

      <ul className="mt-4 space-y-2 text-xs text-slate-500">
        <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span>Şeffaf PNG</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Yakında</span>
        </li>
        <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span>Sosyal profil paketi</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Yakında</span>
        </li>
        <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
          <span>Siyah-beyaz</span>
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Yakında</span>
        </li>
      </ul>
    </div>
  );
}
