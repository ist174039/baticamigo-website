"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";

export function PrivateAccountMenu({ displayName = "Conta BaticAmigo", email = "", roleLabel = "", onOpenProfile, onChangePassword, onSignOut, busy = false, resetPasswordId, logoutId }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = event => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      } else if (!root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = (displayName || email || "B").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("pt-PT") || "").join("");
  return <details className="admin-user-menu private-account-menu" ref={root} open={open} onToggle={event => setOpen(event.currentTarget.open)}>
    <summary ref={trigger} className="private-account-trigger" aria-label="Abrir opções da conta" aria-expanded={open} onClick={event => { event.preventDefault(); setOpen(value => !value); }}><span className="private-account-avatar admin-user-avatar" aria-hidden="true">{initials}</span><span className="admin-user-menu-label">A minha conta</span></summary>
    <div id="private-account-menu-panel" className="admin-user-menu-panel private-account-menu-panel"><span className="admin-user-identity private-account-menu-identity"><strong>{displayName}</strong><small>{email}</small>{roleLabel && <small>{roleLabel}</small>}</span>{onOpenProfile && <Button type="button" variant="ghost" className="admin-user-menu-action" tabIndex={open ? 0 : -1} onClick={() => { setOpen(false); onOpenProfile(); }}>O meu perfil</Button>}{onChangePassword && <Button id={resetPasswordId} type="button" variant="ghost" className="admin-user-menu-action" tabIndex={open ? 0 : -1} disabled={busy} onClick={() => { setOpen(false); onChangePassword(); }}>Alterar palavra-passe</Button>}{onSignOut && <Button id={logoutId} type="button" variant="ghost" className="admin-logout-btn" tabIndex={open ? 0 : -1} disabled={busy} onClick={() => { setOpen(false); onSignOut(); }}>Terminar sessão</Button>}</div>
  </details>;
}
