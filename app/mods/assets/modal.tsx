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
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: `rgba(0,0,0,${isVisible ? "0.6" : "0"})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        transition: "background-color 300ms ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a1a",
          borderRadius: "12px",
          padding: "2rem",
          maxWidth: "480px",
          width: "90%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
          transform: isVisible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.97)",
          opacity: isVisible ? 1 : 0,
          transition: "transform 300ms ease, opacity 300ms ease",
        }}
      >
        {activeItem.image && (
          <img
            src={activeItem.image}
            alt={activeItem.alt ?? activeItem.title}
            style={{ width: "100%", borderRadius: "8px", marginBottom: "1rem" }}
          />
        )}
        <h2 style={{ margin: "0 0 0.5rem", color: "#fff" }}>{activeItem.title}</h2>
        <p style={{ margin: 0, color: "#aaa", lineHeight: 1.6 }}>{activeItem.description}</p>
        <button
          onClick={onClose}
          style={{
            marginTop: "1.5rem",
            padding: "0.5rem 1.25rem",
            borderRadius: "6px",
            border: "none",
            background: "#333",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}