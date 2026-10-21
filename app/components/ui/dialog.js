"use client";

import { useEffect, useRef } from "react";

/** Controlled, accessible modal built on the browser's native dialog semantics. */
export function Dialog({ open, onOpenChange, children, className = "", ariaLabel = "Caixa de diálogo" }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return <dialog
    ref={ref}
    className={`shadcn-dialog ${className}`}
    aria-label={ariaLabel}
    onCancel={(event) => { event.preventDefault(); onOpenChange(false); }}
    onClick={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }}
  >{children}</dialog>;
}
