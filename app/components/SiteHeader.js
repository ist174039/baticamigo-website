"use client";

import { useState } from "react";
import Image from "next/image";

const links = [
  ["Sobre", "missao"], ["Pilares", "pilares"], ["Membros", "membros"],
  ["Parceiros", "parceiros"], ["Notícias", "noticias"], ["Eventos", "eventos"],
  ["Programas", "programas"], ["Agenda", "agenda"], ["Contacto", "contato"],
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <header className="site-header" id="header">
      <div className="site-header-inner">
        <a className="brand" href="#inicio" aria-label="BaticAmigo, início">
          <Image src="/images/logo.png" alt="BaticAmigo" width={94} height={94} priority />
          <span><strong>BaticAmigo</strong><small>Associação</small></span>
        </a>
        <button className={`menu-toggle${menuOpen ? " is-open" : ""}`} type="button" aria-expanded={menuOpen} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} onClick={() => setMenuOpen(!menuOpen)}>
          <span /><span /><span />
        </button>
        <nav className={`site-nav${menuOpen ? " is-open" : ""}`} aria-label="Navegação principal">
          {links.map(([label, id]) => <a key={id} href={`#${id}`} onClick={() => setMenuOpen(false)}>{label}</a>)}
          <a className="nav-cta" href="https://forms.gle/MtZwbpSMPdzeghZG8" target="_blank" rel="noreferrer">Junte-se a nós <span aria-hidden="true">↗</span></a>
        </nav>
      </div>
    </header>
  );
}
