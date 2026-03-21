import { useModalHandler, ModalItem } from "./modalHandler";

interface ModalProps {
  isOpen: boolean;
  isVisible: boolean;
  activeItem: ModalItem | null;
  onClose: () => void;
}

export function Modal({ isOpen, isVisible, activeItem, onClose }: ModalProps) {
  if (!isOpen || !activeItem) return null;

  return (
    <div
      onClick={onClose}
      className={`mods-modal-overlay ${isVisible ? "visible" : ""}`}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`mods-modal-panel ${isVisible ? "visible" : ""}`}
      >
        {activeItem.image && (
          <img
            src={activeItem.image}
            alt={activeItem.alt ?? activeItem.title}
            className="mods-modal-image"
          />
        )}
        <h2 className="mods-modal-title">{activeItem.title}</h2>
        <p className="mods-modal-description">{activeItem.description}</p>
        <button
          onClick={onClose}
          className="mods-modal-close"
        >
          Close
        </button>
      </div>
    </div>
  );
}
