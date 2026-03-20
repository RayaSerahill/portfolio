import { useEffect, useState } from "react";

export interface ModalItem {
  title: string;
  description: string;
  image?: string;
  alt?: string;
  link?: string;
}

export function useModalHandler() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [activeItem, setActiveItem] = useState<ModalItem | null>(null);

  const openModal = (item: ModalItem) => {
    setActiveItem(item);
    setIsOpen(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(() => {
      setIsOpen(false);
      setActiveItem(null);
    }, 300); // match transition duration
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };

    if (isOpen) document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return { isOpen, isVisible, activeItem, openModal, closeModal };
}