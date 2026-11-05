import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Megaphone, X } from "lucide-react";
import "./announcement-preview.css";

type Props = {
  title: string;
  bodyHtml: string;
  publishedAt?: string | null;
  onClose: () => void;
};

function formatDate(iso?: string | null) {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

/** Aperçu fidèle de la modale affichée dans le logiciel client. */
export function AnnouncementPreviewModal({ title, bodyHtml, publishedAt, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="ann-preview-backdrop" onClick={onClose}>
      <div
        className="ann-preview-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ann-preview-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="ann-preview-head">
          <button type="button" className="ann-preview-close" aria-label="Fermer" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
          <div className="ann-preview-eyebrow">
            <span className="ann-preview-icon">
              <Megaphone className="h-4 w-4" />
            </span>
            Annonce OwoDesk
          </div>
          <h2 id="ann-preview-title" className="ann-preview-title">
            {title.trim() || "Titre de l'annonce"}
          </h2>
        </header>
        <div
          className="ann-preview-body"
          dangerouslySetInnerHTML={{ __html: bodyHtml || "<p><em>Votre message apparaîtra ici.</em></p>" }}
        />
        <footer className="ann-preview-foot">
          <span className="ann-preview-date">{formatDate(publishedAt)}</span>
          <button type="button" className="ann-preview-cta" onClick={onClose}>
            <Check className="h-4 w-4" />
            J&apos;ai compris
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
