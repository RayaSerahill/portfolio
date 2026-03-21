import { ModalItem } from "./modalHandler";

interface ModalProps {
  isOpen: boolean;
  isVisible: boolean;
  activeItem: ModalItem | null;
  onClose: () => void;
}

export function Modal({ isOpen, isVisible, activeItem, onClose }: ModalProps) {
  if (!isOpen || !activeItem) return null;

  const hasLink = Boolean(activeItem.link);

  return (
    <div
      onClick={onClose}
      className={`mods-modal-overlay ${isVisible ? "visible" : ""}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`mods-modal-panel ${isVisible ? "visible" : ""}`}
      >
        <button
          onClick={onClose}
          className="mods-modal-close"
          aria-label="Close modal"
          type="button"
        >
          x
        </button>
        {activeItem.fullImage && (
          <img
            src={activeItem.fullImage}
            alt={activeItem.alt ?? activeItem.title}
            className="mods-modal-image"
          />
        )}
        <h2 className="mods-modal-title">{activeItem.title}</h2>
        {activeItem.tags && activeItem.tags.length > 0 && (
          <div className="mods-modal-tags">
            {activeItem.tags.map((tag) => (
              <span key={tag} className="mods-modal-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        <p className="mods-modal-description">{activeItem.description}</p>
        <div className="mods-modal-actions">
          {hasLink ? (
            <a
              href={activeItem.link}
              target="_blank"
              rel="noreferrer"
              className="mods-modal-link"
            >
              View Mod
            </a>
          ) : (
            <p className="mods-modal-private">(private commission)</p>
          )}
        </div>
      </div>
    </div>
  );
}
