import { Sparkles, Layers, Share2 } from "lucide-react";

export function NehariHomeHero() {
  return (
    <section className="nehari-home-hero" aria-labelledby="nehari-home-title">
      <div className="nehari-home-hero__pattern" aria-hidden />
      <div className="nehari-home-hero__glow nehari-home-hero__glow--left" aria-hidden />
      <div className="nehari-home-hero__glow nehari-home-hero__glow--right" aria-hidden />

      <div className="nehari-home-hero__inner">
        <div className="nehari-home-hero__content">
          <p className="nehari-home-hero__eyebrow">TEDRIS VBS</p>
          <h1 id="nehari-home-title" className="nehari-home-hero__title">
            Nehari Platformu
          </h1>
          <p className="nehari-home-hero__desc">
            Davet, program ve paylaşım araçlarına hızlı erişin.
          </p>
        </div>

        <div className="nehari-home-hero__chips" aria-label="Platform özellikleri">
          <span className="nehari-home-hero__chip">
            <Layers size={14} aria-hidden />
            5 modül
          </span>
          <span className="nehari-home-hero__chip">
            <Sparkles size={14} aria-hidden />
            Hızlı başlangıç
          </span>
          <span className="nehari-home-hero__chip">
            <Share2 size={14} aria-hidden />
            Paylaşım & vitrin
          </span>
        </div>
      </div>
    </section>
  );
}
