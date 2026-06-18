import type { ReactNode } from "react";

/** Aynı afişi WhatsApp sohbet balonu içinde gösterir; poster içeriği değişmez. */
export function WhatsappChatPreviewShell({ children }: { children: ReactNode }) {
  return (
    <div className="veli-wa-chat-preview">
      <div className="veli-wa-chat-preview__topbar">
        <span className="veli-wa-chat-preview__avatar" aria-hidden="true">
          V
        </span>
        <div>
          <strong>Veli Bilgilendirme</strong>
          <span>WhatsApp sohbet simülasyonu</span>
        </div>
      </div>
      <div className="veli-wa-chat-preview__thread">
        <div className="veli-wa-chat-preview__bubble">
          <div className="veli-wa-chat-preview__poster-slot">{children}</div>
        </div>
      </div>
      <p className="veli-wa-chat-preview__hint">
        Bu görünüm yalnızca simülasyondur. PNG, PDF ve paylaşım aynı afişi kullanır.
      </p>
    </div>
  );
}
