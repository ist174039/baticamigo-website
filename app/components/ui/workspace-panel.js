"use client";
import {Sheet} from "./sheet";
import {X} from "lucide-react";

/** One responsive side panel for details, creation, editing and settings.
 * Header and actions do not scroll; only the content section does.
 * Existing Sheet callers remain supported during migration. */
export function WorkspacePanel({
  open,onOpenChange,title,eyebrow,description,children,actions,
  variant="details",wide=false,busy=false
}) {
  return <Sheet open={open} onOpenChange={value=>{if(!busy)onOpenChange(value);}}
    ariaLabel={title || "Painel lateral"}
    className={"ba-workspace-panel"+(wide?" ba-panel-wide":"")} >
    <section className="ba-panel-surface" data-panel-variant={variant}>
      <header className="ba-panel-header">
        <div className="ba-panel-heading">
          {eyebrow&&<span className="ba-panel-eyebrow">{eyebrow}</span>}
          <h2>{title}</h2>
          {description&&<p>{description}</p>}
        </div>
        <button type="button" className="ba-panel-close" aria-label="Fechar painel" title="Fechar painel"
          disabled={busy} onClick={()=>onOpenChange(false)}><X size={20}/></button>
      </header>
      <div className="ba-panel-scroll" tabIndex={0} aria-label="Conteúdo do painel">{children}</div>
      {actions&&<footer className="ba-panel-footer">{actions}</footer>}
    </section>
  </Sheet>;
}
