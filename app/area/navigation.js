"use client";

import { PrivateShell } from "../components/private/private-shell";

export default function AreaNavigation({items, active, onNavigate, admin, children}) {
  const links = items.map(([key, label, icon]) => ({ key, label, icon }));
  const footer = admin ? <a href="/admin/dashboard">Administração do website <span aria-hidden="true">↗</span></a> : null;
  return <PrivateShell className="platform-shell" areaLabel="Área reservada" items={links} active={active} onNavigate={onNavigate} footer={footer}>{children}</PrivateShell>;
}
