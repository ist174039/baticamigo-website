"use client";

import { useEffect, useRef } from "react";

/** Accessible, controlled side panel built with the native modal dialog API. */
export function Sheet({ open, onOpenChange, children, className = "", ariaLabel = "Painel de detalhes", baseClass = "shadcn-sheet" }) {
  const ref = useRef(null);

  useEffect(() => {
    const sheet = ref.current;
    if (!sheet) return;
    if (open && !sheet.open) sheet.showModal();
    if (!open && sheet.open) sheet.close();
  }, [open]);

  return <dialog
    ref={ref}
    className={`${baseClass} ${className}`.trim()}
    aria-label={ariaLabel}
    aria-modal="true"
    onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
    onClick={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}
  >{children}</dialog>;
}
