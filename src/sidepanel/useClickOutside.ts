import { useEffect, useRef } from "react";

export function useClickOutside(
  isOpen: boolean,
  onClose: () => void
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClick(event: MouseEvent) {
      // Use composedPath() to get the real target inside Shadow DOM
      // (event.target gets retargeted to the host element across shadow boundaries)
      const path = event.composedPath();
      if (ref.current && !path.includes(ref.current)) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  return ref;
}
