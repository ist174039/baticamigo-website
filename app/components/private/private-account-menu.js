"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";

export function PrivateAccountMenu({ displayName = "Conta BaticAmigo", email = "", roleLabel = "", onChangePassword, onSignOut, busy = false, resetPasswordId, logoutId }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = event => {
      if (event.key === "Escape" || !root.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  const initials = (displayName || email || "B").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("pt-PT") || "").join("");
  return <div className="private-account-menu" ref={root}>
    <Button type="button" variant="outline" className="private-account-trigger" aria-label="Abrir opções da conta" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><span className="private-account-avatar" aria-hidden="true">{initials}</span><span>A minha conta</span></Button>
    {open && <div className="private-account-menu-panel" role="menu"><div className="private-account-menu-identity"><strong>{displayName}</strong><span>{email}</span>{roleLabel && <small>{roleLabel}</small>}</div>{onChangePassword && <Button id={resetPasswordId} type="button" variant="ghost" role="menuitem" disabled={busy} onClick={() => { setOpen(false); onChangePassword(); }}>Alterar palavra-passe</Button>}{onSignOut && <Button id={logoutId} type="button" variant="ghost" role="menuitem" disabled={busy} onClick={() => { setOpen(false); onSignOut(); }}>Terminar sessão</Button>}</div>}
  </div>;
}
