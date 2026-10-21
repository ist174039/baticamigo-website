"use client";

import { PrivateShell } from "../components/private/private-shell";
import { Bell, BookOpenCheck, CalendarDays, ChartNoAxesCombined, CircleCheck, ClipboardCheck, ClipboardList, FileText, KeyRound, LayoutDashboard, Mail, TrendingUp, UsersRound } from "lucide-react";

const navigationIcons = {
  overview: LayoutDashboard,
  sessions: CalendarDays,
  profiles: UsersRound,
  assignment: ClipboardList,
  material: BookOpenCheck,
  assessment: ClipboardCheck,
  progress: TrendingUp,
  justification: CircleCheck,
  document: FileText,
  message: Mail,
  notifications: Bell,
  reports: ChartNoAxesCombined,
  access: KeyRound,
};

export default function AreaNavigation({items, active, onNavigate, admin, children}) {
  const links = items.map(([key, label]) => {
    const Icon = navigationIcons[key] || CircleCheck;
    return { key, label, icon: <Icon size={17} strokeWidth={1.8} /> };
  });
  const footer = admin ? <a href="/admin/dashboard">Administração do website <span aria-hidden="true">↗</span></a> : null;
  return <PrivateShell className="platform-shell" areaLabel="Área reservada" items={links} active={active} onNavigate={onNavigate} footer={footer}>{children}</PrivateShell>;
}
