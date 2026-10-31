"use client";
import {Sheet} from "./sheet";

/** Backward-compatible alias. All private area side panels share Sheet's
 * accessible native-dialog lifecycle, Escape, focus restoration and backdrop.
 * The existing styling classes remain unchanged while layout migration proceeds. */
export function Dialog({open,onOpenChange,children,className="",ariaLabel="Painel lateral"}) {
  return <Sheet open={open} onOpenChange={onOpenChange} ariaLabel={ariaLabel}
    baseClass="shadcn-dialog" className={className}>{children}</Sheet>;
}
