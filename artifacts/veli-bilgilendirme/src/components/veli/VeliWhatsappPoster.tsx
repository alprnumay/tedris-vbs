import type { FormData, SablonTuru } from "@/types";
import {
  VELI_WA_SAFE_PAD,
  veliWhatsappEtiketler,
  veliWhatsappGorselAciklama,
  veliWhatsappGorselBaslik,
  veliWhatsappGorselGorseller,
  veliWhatsappGorselKurum,
  veliWhatsappSablonRenk,
} from "@/lib/veli/veliWhatsappPosterEngine";

function bugunTarih(): string {
  try {
    return new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return new Date().toDateString();
  }
}

function WaGorselBlok({ gorseller }: { gorseller: string[] }) {
  if (gorseller.length === 0) return null;

  if (gorseller.length === 1) {
    return (
      <div className="veli-wa-poster__photo veli-wa-poster__photo--single">
        <img src={gorseller[0]} alt="" />
      </div>
    );
  }

  return (
    <div className="veli-wa-poster__photo veli-wa-poster__photo--dual">
      {gorseller.map((g, i) => (
        <div key={i} className="veli-wa-poster__photo-cell">
          <img src={g} alt="" />
        </div>
      ))}
    </div>
  );
}

function FotografOdakliWa({
  form,
  tarih,
  baslik,
  aciklama,
  kurum,
  etiketler,
  gorseller,
}: {
  form: FormData;
  tarih: string;
  baslik: string;
  aciklama: string;
  kurum: string;
  etiketler: string[];
  gorseller: string[];
}) {
  return (
    <div className="veli-wa-poster veli-wa-poster--photo-focus">
      <div className="veli-wa-poster__hero">
        {gorseller.length > 0 ? (
          <>
            {gorseller.length === 1 ? (
              <img src={gorseller[0]} alt="" className="veli-wa-poster__hero-img" />
            ) : (
              <div className="veli-wa-poster__hero-grid">
                {gorseller.map((g, i) => (
                  <img key={i} src={g} alt="" />
                ))}
              </div>
            )}
            <div className="veli-wa-poster__hero-gradient" />
          </>
        ) : (
          <div className="veli-wa-poster__hero-placeholder" />
        )}
        <div className="veli-wa-poster__hero-top">
          <span className="veli-wa-poster__date">{tarih}</span>
        </div>
        <div className="veli-wa-poster__hero-title">
          <h1>{baslik}</h1>
        </div>
      </div>
      <div className="veli-wa-poster__photo-body">
        {kurum ? <p className="veli-wa-poster__kurum">{kurum}</p> : null}
        <p className="veli-wa-poster__aciklama">{aciklama}</p>
        {etiketler.length > 0 && (
          <div className="veli-wa-poster__tags">
            {etiketler.map((e) => (
              <span key={e}>{e}</span>
            ))}
          </div>
        )}
        {form.isim.trim() ? (
          <p className="veli-wa-poster__imza">
            {form.isim.trim()}
            {form.rol?.trim() ? ` · ${form.rol.trim()}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function GenericWa({
  form,
  tarih,
  baslik,
  aciklama,
  kurum,
  etiketler,
  gorseller,
  renk,
}: {
  form: FormData;
  tarih: string;
  baslik: string;
  aciklama: string;
  kurum: string;
  etiketler: string[];
  gorseller: string[];
  renk: ReturnType<typeof veliWhatsappSablonRenk>;
}) {
  return (
    <div className="veli-wa-poster veli-wa-poster--generic" style={{ background: renk.bg, color: renk.text }}>
      <div className="veli-wa-poster__safe">
        <div className="veli-wa-poster__head">
          <div className="veli-wa-poster__head-left">
            {kurum ? <p className="veli-wa-poster__kurum">{kurum}</p> : null}
            <span className="veli-wa-poster__badge">Veli Bilgilendirme</span>
          </div>
          <span className="veli-wa-poster__date">{tarih}</span>
        </div>

        <WaGorselBlok gorseller={gorseller} />

        <h1 className="veli-wa-poster__baslik">{baslik}</h1>
        <p className="veli-wa-poster__aciklama">{aciklama}</p>

        {etiketler.length > 0 && (
          <div className="veli-wa-poster__tags">
            {etiketler.map((e) => (
              <span key={e} style={{ borderColor: `${renk.accent}55`, background: `${renk.accent}22` }}>
                {e}
              </span>
            ))}
          </div>
        )}

        <div className="veli-wa-poster__footer">
          {form.isim.trim() ? (
            <p className="veli-wa-poster__imza">
              {form.isim.trim()}
              {form.rol?.trim() ? ` · ${form.rol.trim()}` : ""}
            </p>
          ) : (
            <span />
          )}
          <span className="veli-wa-poster__brand" style={{ color: renk.accent }}>
            Nehari
          </span>
        </div>
      </div>
    </div>
  );
}

export function VeliWhatsappPoster({ form, sablon }: { form: FormData; sablon: SablonTuru }) {
  const tarih = bugunTarih();
  const baslik = veliWhatsappGorselBaslik(form);
  const aciklama = veliWhatsappGorselAciklama(form);
  const kurum = veliWhatsappGorselKurum(form);
  const gorseller = veliWhatsappGorselGorseller(form);
  const etiketler = veliWhatsappEtiketler(form);
  const renk = veliWhatsappSablonRenk(sablon);

  if (sablon === "fotograf-odakli") {
    return (
      <FotografOdakliWa
        form={form}
        tarih={tarih}
        baslik={baslik}
        aciklama={aciklama}
        kurum={kurum}
        etiketler={etiketler}
        gorseller={gorseller}
      />
    );
  }

  return (
    <GenericWa
      form={form}
      tarih={tarih}
      baslik={baslik}
      aciklama={aciklama}
      kurum={kurum}
      etiketler={etiketler}
      gorseller={gorseller}
      renk={renk}
    />
  );
}

/** Güvenli alan padding değeri (CSS ile de uygulanır). */
export const VELI_WA_SAFE = VELI_WA_SAFE_PAD;
