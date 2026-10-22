"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- private routes retain full navigation across Firebase-backed pages. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Button, buttonVariants } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { PanelLeftClose, PanelLeftOpen, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function PrivateShell({ areaLabel = "Área reservada", children, className = "", navLabel = "A sua área", items, active, onNavigate, footer, user, logoutId, logoutLabel = "Sair", accountMenu }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarPreferenceLoaded, setSidebarPreferenceLoaded] = useState(false);
  const [navigationQuery, setNavigationQuery] = useState("");
  const trigger = useRef(null);
  const sidebar = useRef(null);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 760px)");
    const closeOnResize = () => setOpen(false);
    query.addEventListener("change", closeOnResize);
    return () => query.removeEventListener("change", closeOnResize);
  }, []);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem("baticamigo-sidebar-collapsed") === "true");
    setSidebarPreferenceLoaded(true);
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded) return;
    window.localStorage.setItem("baticamigo-sidebar-collapsed", String(collapsed));
  }, [collapsed, sidebarPreferenceLoaded]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOutside = (event) => {
      if (!sidebar.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  function activate(item) {
    setOpen(false);
    onNavigate?.(item.key);
    if (window.matchMedia("(max-width: 760px)").matches) {
      requestAnimationFrame(() => {
        const main = document.querySelector("#conteudo, #conteudo-admin");
        main?.scrollIntoView({ block: "start", behavior: "instant" });
        main?.focus({ preventScroll: true });
      });
    }
  }

  function handleNavigationKeyDown(event) {
    if (items.some(item => item.href)) return;
    const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
    const currentIndex = tabs.indexOf(document.activeElement);
    const nextIndex = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : event.key === "ArrowDown" || event.key === "ArrowRight" ? (currentIndex + 1) % tabs.length : event.key === "ArrowUp" || event.key === "ArrowLeft" ? (currentIndex - 1 + tabs.length) % tabs.length : -1;
    if (nextIndex >= 0) {
      event.preventDefault();
      tabs[nextIndex]?.focus();
      tabs[nextIndex]?.click();
    }
  }

  const matchingItems=(items||[]).filter(item=>`${item.label} ${item.group||""}`.toLocaleLowerCase("pt-PT").includes(navigationQuery.trim().toLocaleLowerCase("pt-PT")));
  const navigationGroups = [...new Set(matchingItems.map(item=>item.group||"A sua área"))].map(group=>({group,items:matchingItems.filter(item=>(item.group||"A sua área")===group)}));

  return <div className={`private-shell ${className}${collapsed?" is-sidebar-collapsed":""}`}>
    <aside ref={sidebar} className={`private-sidebar${open ? " is-menu-open" : ""}`} onBlur={(event) => {
      if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }} onKeyDown={(event) => {
      if (event.key === "Escape" && open) {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    }}>
      <div className="private-sidebar-top">
        <a className="private-brand" href="/" aria-label="BaticAmigo, voltar ao site"><Image src="/images/logo.png" alt="" width={52} height={46}/><span><strong>BaticAmigo</strong><small>{areaLabel}</small></span></a>
        <div className="private-sidebar-controls">
          {items?.length > 1 && <Button ref={trigger} type="button" variant="outline" className="private-menu-toggle" aria-controls="private-navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}><span aria-hidden="true">{open ? "×" : "☰"}</span>{open ? "Fechar" : "Menu"}</Button>}
          {items?.length > 1 && <Button type="button" variant="ghost" className="private-sidebar-collapse" aria-label={collapsed?"Expandir navegação":"Recolher navegação"} title={collapsed?"Expandir navegação":"Recolher navegação"} aria-pressed={collapsed} onClick={()=>setCollapsed(value=>!value)}>{collapsed?<PanelLeftOpen size={18}/>:<PanelLeftClose size={18}/>}</Button>}
        </div>
      </div>
      {active && <p className="private-mobile-location"><span>Está em</span> <strong>{items?.find(item => item.key === active)?.label || "A sua área"}</strong></p>}
      {items?.length > 0 && <div id="private-navigation" className="private-navigation-panel">
        <p className="private-nav-label"><span>{navLabel}</span></p>
        <label className="private-nav-search"><Search size={15} aria-hidden="true"/><Input type="search" aria-label="Pesquisar menu" placeholder="Pesquisar menu" value={navigationQuery} onChange={event=>setNavigationQuery(event.target.value)}/></label>
        <nav className={items.some(item => item.href) ? "admin-sidebar-menu" : undefined} aria-label="Navegação principal" role={items.some(item => !item.href) ? "tablist" : undefined} aria-orientation={items.some(item => !item.href) ? "vertical" : undefined} onKeyDown={handleNavigationKeyDown}>{navigationGroups.map(({group,items:groupItems})=><div className="private-nav-group" role={items.some(item=>!item.href)?"group":"presentation"} aria-label={items.some(item=>!item.href)?group:undefined} key={group}><p className="private-nav-group-label" aria-hidden="true">{group}</p>{groupItems.map(item => item.href ? <a key={item.key} href={item.href} className={cn(buttonVariants({ variant: "ghost" }), "private-nav-link", active === item.key && "active")} aria-label={item.label} title={collapsed?item.label:undefined} aria-current={active === item.key ? "page" : undefined} data-section={item.key} onClick={() => activate(item)}><span aria-hidden="true">{item.icon}</span><span className="private-nav-text">{item.label}</span></a> : <Button key={item.key} id={`area-tab-${item.key}`} type="button" role="tab" aria-controls="conteudo" aria-selected={active === item.key} tabIndex={active === item.key ? 0 : -1} variant="ghost" className="private-nav-button" aria-label={item.label} title={collapsed?item.label:undefined} onClick={() => activate(item)}><span aria-hidden="true">{item.icon}</span><span className="private-nav-text">{item.label}</span></Button>)}</div>)}</nav>
        {navigationQuery && navigationGroups.length===0&&<p className="private-nav-empty">Não foram encontrados menus.</p>}
        <div className="private-sidebar-footer">{footer}{!className.includes("platform-shell") && <a href="/">Voltar ao website <span aria-hidden="true">↗</span></a>}</div>
      </div>}
    </aside>
    <div className="private-content">
      {(user || accountMenu) && <header className="private-userbar"><div className="private-user-identity">{user && <><span className="private-user-avatar" id="user-avatar" aria-hidden="true">BA</span><span><strong id="user-name">{user.name || "Administrador"}</strong><small id="user-email">{user.email || ""}</small></span></>}</div><div className="private-userbar-actions">{accountMenu}{logoutId && <button id={logoutId} type="button" className="private-logout">{logoutLabel}</button>}</div></header>}
      {children}
    </div>
  </div>;
}
