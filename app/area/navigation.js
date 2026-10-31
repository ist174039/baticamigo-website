"use client";

import { PrivateShell } from "../components/private/private-shell";
import { Bell, BookOpenCheck, CalendarDays, ChartNoAxesCombined, CircleCheck, ClipboardCheck, ClipboardList, ContactRound, FileText, KeyRound, LayoutDashboard, Mail, Settings2, TrendingUp, UsersRound, WalletCards } from "lucide-react";
import {areaGroups} from "../../lib/platform/access.mjs";

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
  records: ContactRound,
  finance: WalletCards,
  account: Settings2,
};

export default function AreaNavigation({items, active, onNavigate, admin, user, accountMenu, children}) {
  const links = items.map(item => {
    const [key,label]=Array.isArray(item)?item:item.key?[item.key,item.label]:item;
    const Icon = navigationIcons[key] || CircleCheck;
  return { key, label, group:key==='account'?'A sua conta':key==='access'||key==='records'?'Associação':areaGroups.find(section=>section.modules.includes(key))?.label||'A sua área', icon: <Icon size={17} strokeWidth={1.8} /> };
  });
  const footer = <div><a href="/platform/manual"><BookOpenCheck size={16} aria-hidden="true"/><span>Manual de utilização</span><span aria-hidden="true">↗</span></a>{admin && <a href="/admin/dashboard"><KeyRound size={16} aria-hidden="true"/><span>Administração</span><span aria-hidden="true">↗</span></a>}</div>;
  return <PrivateShell className="platform-shell" areaLabel="Área reservada" items={links} active={active} onNavigate={onNavigate} footer={footer} user={user ? { name: user.displayName || "Utilizador", email: user.email } : null} accountMenu={accountMenu}>{children}</PrivateShell>;
}
