"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- These links intentionally reload the document to initialize the legacy Firebase page lifecycle. */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/app/components/ui/button";

const links = [
  ["Sobre", "missao"], ["Atividades", "eventos"], ["Programas", "programas"],
  ["Comunidade", "membros"], ["Contacto", "contato"],
];

export default function SiteHeader({ variant = "public" }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const navigationRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const items = navigationRef.current?.querySelectorAll("a[href]") || [];
    items[0]?.focus();
    const closeOnEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab" || !items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);
  return (
    <>
    <header className="site-header" id="header">
      <a className="skip-link" href="#conteudo">Saltar para o conteúdo</a>
      <div className="site-header-inner">
        <a className="brand" href={variant === "area" ? "/" : "#inicio"} aria-label="BaticAmigo, início">
          <Image src="/images/logo.png" alt="BaticAmigo" width={94} height={94} priority />
          <span><strong>BaticAmigo</strong><small>Associação</small></span>
        </a>
        {variant === "public" && <Button variant="ghost" ref={menuButtonRef} className={`menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </Button>}
        <nav ref={navigationRef} id="primary-navigation" className={`site-nav${menuOpen ? " is-open" : ""}${variant === "area" ? " area-nav" : ""}`} aria-label="Navegação principal">
          {variant === "area" ? <a href="/">Website público</a> : <>
          {links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="nav-cta" href="https://forms.gle/MtZwbpSMPdzeghZG8" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Junte-se a nós <span aria-hidden="true">↗</span></a>
          </>}
        </nav>
      </div>
    </header>
    {variant === "public" && menuOpen && <Button variant="ghost" className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} />}
    </>
  );
}
