"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { UserRound } from "lucide-react";

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

  return <div className="private-account-menu" ref={root}>
    <Button type="button" variant="outline" className="private-account-trigger" aria-label="Abrir opções da conta" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(value => !value)}><UserRound size={17}/><span>A minha conta</span><span className="private-account-avatar" aria-hidden="true">{(displayName || email || "B").trim().slice(0, 1).toLocaleUpperCase("pt-PT")}</span></Button>
    {open && <div className="private-account-menu-panel" role="menu"><div className="private-account-menu-identity"><strong>{displayName}</strong><span>{email}</span>{roleLabel && <small>{roleLabel}</small>}</div>{onChangePassword && <Button id={resetPasswordId} type="button" variant="ghost" role="menuitem" disabled={busy} onClick={() => { setOpen(false); onChangePassword(); }}>Alterar palavra-passe</Button>}{onSignOut && <Button id={logoutId} type="button" variant="ghost" role="menuitem" disabled={busy} onClick={() => { setOpen(false); onSignOut(); }}>Terminar sessão</Button>}</div>}
  </div>;
}
