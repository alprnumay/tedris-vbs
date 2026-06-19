import { APP_BRAND_SHORT, APP_BRAND_TITLE, APP_LOGO_ALT, APP_LOGO_SRC } from "../lib/appLogo";

export { APP_LOGO_ALT, APP_LOGO_SRC } from "../lib/appLogo";

export function AppBrand({
  kullaniciAdi,
  kompakt = false,
  mobilSatir = false,
}: {
  kullaniciAdi?: string;
  kompakt?: boolean;
  /** Mobilde alt satırda tam marka (logo + başlık + kullanıcı). */
  mobilSatir?: boolean;
}) {
  return (
    <div className={`tedris-brand${kompakt ? " tedris-brand--compact" : ""}${mobilSatir ? " tedris-brand--mobile-row" : ""}`}>
      <div className="tedris-brand__mark">
        <img src={APP_LOGO_SRC} alt={APP_LOGO_ALT} className="tedris-brand__logo" />
      </div>
      {!kompakt && (
        <div className="tedris-brand__text">
          <h1>
            <span className="tedris-brand__title-short">{APP_BRAND_SHORT}</span>
            <span className="tedris-brand__title-full">{APP_BRAND_TITLE}</span>
          </h1>
          <p>{kullaniciAdi || "kurum iletişim paneli"}</p>
        </div>
      )}
    </div>
  );
}
