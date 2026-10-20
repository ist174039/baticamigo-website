"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

const links = [
  ["Sobre", "missao"], ["Atividades", "eventos"], ["Programas", "programas"],
  ["Comunidade", "membros"], ["Contacto", "contato"],
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      menuButtonRef.current?.focus();
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
        <a className="brand" href="#inicio" aria-label="BaticAmigo, início">
          <Image src="/images/logo.png" alt="BaticAmigo" width={94} height={94} priority />
          <span><strong>BaticAmigo</strong><small>Associação</small></span>
        </a>
        <button ref={menuButtonRef} className={`menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-expanded={menuOpen} aria-controls="primary-navigation" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <nav id="primary-navigation" className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Navegação principal">
          {links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a href="/area" onClick={() => setMenuOpen(false)}>Área reservada</a>
          <a className="nav-cta" href="https://forms.gle/MtZwbpSMPdzeghZG8" target="_blank" rel="noreferrer" onClick={() => setMenuOpen(false)}>Junte-se a nós <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>
    {menuOpen && <button className="nav-backdrop" type="button" aria-label="Fechar menu" onClick={() => { setMenuOpen(false); menuButtonRef.current?.focus(); }} />}
    </>
  );
}
