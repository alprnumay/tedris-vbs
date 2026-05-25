export function AppBrand({
  kullaniciAdi,
  kompakt = false,
}: {
  kullaniciAdi?: string;
  kompakt?: boolean;
}) {
  return (
    <div className={`tedris-brand${kompakt ? " tedris-brand--compact" : ""}`}>
      <div className="tedris-brand__mark" aria-hidden="true">
        <svg viewBox="0 0 48 48" role="img">
          <defs>
            <linearGradient id="tedris-mark-bg" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2563eb" />
              <stop offset="1" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect x="5" y="5" width="38" height="38" rx="12" fill="url(#tedris-mark-bg)" />
          <path d="M14 17.5c0-1.4 1.1-2.5 2.5-2.5H24v18h-7.5A2.5 2.5 0 0 1 14 30.5v-13Z" fill="#f8fafc" opacity=".94" />
          <path d="M24 15h7.5c1.4 0 2.5 1.1 2.5 2.5v13c0 1.4-1.1 2.5-2.5 2.5H24V15Z" fill="#dbeafe" />
          <path d="M18 20h12M18 24h9M18 28h11" stroke="#1e3a8a" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M31.5 12.5 36 17l4.5-4.5" stroke="#facc15" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="tedris-brand__text">
        <h1>Tedris Vbs</h1>
        <p>{kullaniciAdi || "kurum iletişim paneli"}</p>
      </div>
    </div>
  );
}
