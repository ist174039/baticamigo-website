"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Crossing legacy Firebase pages requires full document navigation. */
import {useEffect, useRef, useState} from "react";
import Image from "next/image";

export default function AreaNavigation({items, active, onNavigate, admin}) {
  const [open, setOpen] = useState(false);
  const toggle = useRef(null);
  const current = items.find(([key]) => key === active)?.[1] || items[0]?.[1];

  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 760px)");
    const reset = () => setOpen(false);
    mobile.addEventListener("change", reset);
    return () => mobile.removeEventListener("change", reset);
  }, []);

  function select(key) {
    setOpen(false);
    onNavigate(key);
    if (window.matchMedia("(max-width: 760px)").matches) {
      window.requestAnimationFrame(() => {
        const main = document.getElementById("conteudo");
        main?.scrollIntoView({block: "start", behavior: "instant"});
        main?.focus({preventScroll: true});
      });
    }
  }

  return <aside className={`platform-sidebar${open ? " is-menu-open" : ""}`} onKeyDown={(event) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
      toggle.current?.focus();
    }
  }}>
    <div className="platform-sidebar-top">
      <a className="platform-brand" href="/"><Image src="/images/logo.png" alt="" width={56} height={48}/><span>BaticAmigo<small>Área reservada</small></span></a>
      {items.length > 1 && <button ref={toggle} type="button" className="platform-menu-toggle" aria-controls="area-navigation" aria-expanded={open} aria-label={open ? "Fechar menu da área" : "Abrir menu da área"} onClick={() => setOpen((value) => !value)}><span aria-hidden="true">{open ? "×" : "☰"}</span>{open ? "Fechar" : "Menu"}</button>}
    </div>
    <p className="platform-mobile-location"><span>Está em</span> <strong>{current}</strong></p>
    <div id="area-navigation" className="platform-navigation-panel">
      <p className="platform-nav-label">A sua área</p>
      <nav aria-label="Navegação principal">{items.map(([key, label, icon]) => <button type="button" key={key} aria-current={active === key ? "page" : undefined} onClick={() => select(key)}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav>
      <div className="platform-sidebar-footer">{admin && <a href="/admin/dashboard">Administração do website <span aria-hidden="true">↗</span></a>}<a href="/">Voltar ao website <span aria-hidden="true">↗</span></a><p>Mais perto.<br/>Mais juntos.</p></div>
    </div>
  </aside>;
}
