import { useEffect, useRef } from "react";
export function useDialogFocus(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (!node) return;
    const focusable = () =>
      Array.from(
        node.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex="0"]',
        ),
      ).filter((el) => el.offsetParent !== null);
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const list = focusable();
        if (!list.length) {
          event.preventDefault();
          return;
        }
        if (event.shiftKey && document.activeElement === list[0]) {
          event.preventDefault();
          list[list.length - 1].focus();
        } else if (
          !event.shiftKey &&
          document.activeElement === list[list.length - 1]
        ) {
          event.preventDefault();
          list[0].focus();
        }
      }
    };
    node.addEventListener("keydown", key);
    return () => {
      node.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [open]);
  return ref;
}
