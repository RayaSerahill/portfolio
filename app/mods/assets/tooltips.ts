import { useEffect, useState } from "react";

interface TooltipState {
  visible: boolean;
  title: string;
  text: string;
  x: number;
  y: number;
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    title: '',
    text: '',
    x: 0,
    y: 0,
  });

  const showTooltip = (title: string, text: string, e: React.MouseEvent<HTMLAnchorElement>) => {
    setTooltip({ visible: true, title, text, x: e.clientX, y: e.clientY });
  };

  const moveTooltip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    setTooltip((prev) => ({ ...prev, x: e.clientX, y: e.clientY }));
  };

  const hideTooltip = () => {
    setTooltip((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setTooltip((prev) =>
        prev.visible ? { ...prev, x: e.clientX, y: e.clientY } : prev
      );
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return { tooltip, showTooltip, moveTooltip, hideTooltip };
}