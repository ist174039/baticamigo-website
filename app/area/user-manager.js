"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table";
import { Dialog } from "@/app/components/ui/dialog";
import { Sheet } from "@/app/components/ui/sheet";
import { Eye, MoreHorizontal } from "lucide-react";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { platformAuth } from "../../lib/firebase-client";
import {areaGroups,allowedAreasForRoles,defaultAreasForRoles,restrictAreasForRoles} from "../../lib/platform/access.mjs";
import {printReport} from "../../lib/platform/print-report.mjs";

const roleLabels = { admin: "Administrador", coordinator: "Coordenação", student: "Aluno", guardian: "Encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const profileLabels = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador", member: "Sócio" };
const membershipLabels = { active: "Sócio ativo", pending: "Sócio pendente", suspended: "Sócio suspenso", left: "Ex-sócio" };
const moduleLabels={overview:"Visão geral",sessions:"Sessões e presenças",profiles:"Pessoas e perfis",assignment:"Trabalhos",material:"Materiais",assessment:"Avaliações",progress:"Evolução",justification:"Justificações",finance:"Quotas e doações",document:"Documentos",message:"Mensagens",notifications:"Avisos",reports:"Relatórios"};
const blankForm = () => ({ displayName: "", email: "", roles: [], profileIds: [], modules: defaultAreasForRoles([]), active: true, profileKind: "student", createProfile: false });
const date = (value) => value ? new Intl.DateTimeFormat("pt-PT", { dateStyle: "medium" }).format(new Date(value)) : "Nunca";

function RoleOptions({ value, onChange }) {
  return <fieldset className="user-manager-role-options"><legend>Permissões da área</legend>{Object.entries(roleLabels).map(([role, label]) => <label className="platform-check" key={role}><Checkbox checked={value.includes(role)} onChange={(event) => onChange(event.target.checked ? [...value, role] : value.filter((current) => current !== role))} />{label}</label>)}</fieldset>;
}

function ModuleOptions({roles,value,onChange}) {
  const allowed=new Set(allowedAreasForRoles(roles));
  return <fieldset className="user-manager-module-options"><legend>Menus disponíveis na área</legend><p className="platform-hint">Escolha os menus que esta conta pode abrir. A Visão geral é obrigatória; as permissões do perfil continuam a limitar os dados e as ações. O administrador principal mantém acesso completo para recuperação.</p>{areaGroups.map(group=>({...group,modules:group.modules.filter(module=>allowed.has(module))})).filter(group=>group.modules.length>0).map(group=><section className="user-manager-module-group" key={group.label}><h3>{group.label}</h3><div>{group.modules.map(module=><label className="platform-check" key={module}><Checkbox checked={value.includes(module)} disabled={module==='overview'} onChange={event=>onChange(event.target.checked?[...value,module]:value.filter(item=>item!==module))}/>{moduleLabels[module]}</label>)}</div></section>)}</fieldset>;
}

export default function AreaUserManager() {
  const [users, setUsers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [dialogUser, setDialogUser] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({});
  const [confirmUser, setConfirmUser] = useState(null);
  const [invite, setInvite] = useState(null);
  const [temporaryPassword, setTemporaryPassword] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [detailUser, setDetailUser] = useState(null);
  const [removeUserTarget, setRemoveUserTarget] = useState(null);

  const request = useCallback(async (path = "", options = {}, endpoint = "/api/platform/users") => {
    const currentUser = platformAuth().currentUser;
    if (!currentUser) throw new Error("A sessão terminou. Inicie sessão novamente.");
    const token = await currentUser.getIdToken();
    const response = await fetch(`${endpoint}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(options.headers || {}) },
      cache: "no-store",
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Não foi possível concluir a operação.");
    return result;
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const result = await request();
      setUsers(result.users || []);
      setAllProfiles(result.profiles || []);
      setError("");
    } catch (failure) { setError(failure.message); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { setPage(1); }, [query, statusFilter, roleFilter, profileFilter]);

  const linkedProfileIds = useMemo(() => new Set(users.flatMap((user) => user.profileIds || [])), [users]);
  const unlinked = allProfiles.filter((profile) => !linkedProfileIds.has(profile.id));
  const matchingUsers = users.filter((user) => {
    const search = `${user.displayName} ${user.email} ${(user.roles || []).map((role) => roleLabels[role]).join(" ")} ${(user.profiles || []).map((profile) => profile.name).join(" ")}`.toLocaleLowerCase("pt-PT");
    return search.includes(query.toLocaleLowerCase("pt-PT"))
      && (statusFilter === "all" || (statusFilter === "suspended" ? user.suspended : statusFilter === "active" ? user.accessActive && !user.suspended : !user.accessActive && !user.suspended))
      && (roleFilter === "all" || (user.roles || []).includes(roleFilter))
      && (profileFilter === "all" || (user.profiles || []).some((profile) => profile.kind === profileFilter));
  });
  const matchingProfiles = unlinked.filter((profile) => `${profile.name} ${profile.email || ""} ${profileLabels[profile.kind] || ""}`.toLocaleLowerCase("pt-PT").includes(query.toLocaleLowerCase("pt-PT")) && (statusFilter === "all" || statusFilter === "no-access") && (roleFilter === "all" || roleFilter === profile.kind) && (profileFilter === "all" || profileFilter === profile.kind));
  const allRows = [...matchingUsers.map((user) => ({ type: "user", value: user })), ...matchingProfiles.map((profile) => ({ type: "profile", value: profile }))];
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const currentRows = allRows.slice((page - 1) * pageSize, page * pageSize);
  const filteredUsers = currentRows.filter((row) => row.type === "user").map((row) => row.value);
  const filteredProfiles = currentRows.filter((row) => row.type === "profile").map((row) => row.value);
  const studentProfiles = allProfiles.filter((profile) => profile.kind === "student");
  function exportStudents() {
    printReport({ title: "Lista de alunos", subtitle: `${studentProfiles.length} alunos`, columns: ["Nome", "Ano escolar", "Faixa etária", "Estado"], rows: studentProfiles.map((profile) => [profile.name, profile.schoolYear || "—", profile.ageBand || "—", profile.active ? "Ativo" : "Inativo"]) });
  }
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);
  function openCreate(profile = null) {
    const initial = blankForm();
    if (profile) {
      initial.displayName = profile.name;
      initial.email = profile.email || "";
      initial.profileIds = [profile.id];
      initial.roles = [profile.kind];
      initial.modules = defaultAreasForRoles(initial.roles);
    }
    setForm(initial);
    setDialogUser(null);
    setUserDialogOpen(true);
  }

  function openEdit(user) {
    setDialogUser(user);
    setForm({ displayName: user.displayName || "", email: user.email || "", roles: user.roles || [], profileIds: user.profileIds || [], modules: user.modules || defaultAreasForRoles(user.roles||[]), active: user.accessActive || !(user.roles || []).length, profileKind: "student", createProfile: false });
    setUserDialogOpen(true);
  }

  function openProfile(profile) {
    setEditingProfile(profile);
    setProfileForm({ name: profile.name || "", email: profile.email || "", active: profile.active === true, memberNumber: profile.memberNumber || "", membershipStatus: profile.membershipStatus || "active", subjects: profile.subjects || "", availability: profile.availability || "", schoolYear: profile.schoolYear || "", ageBand: profile.ageBand || "" });
    setProfileEditorOpen(true);
  }

  function toggleProfile(profileId, checked) {
    setForm((current) => ({ ...current, profileIds: checked ? [...current.profileIds, profileId] : current.profileIds.filter((id) => id !== profileId) }));
  }

  async function submit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const profileIds = form.profileIds;
    const body = dialogUser ? {
      action: "update-access", uid: dialogUser.uid, roles: form.roles, profileIds, active: form.active, modules: form.modules,
    } : {
      email: String(formData.get("email") || "").trim(), displayName: String(formData.get("displayName") || "").trim(), roles: form.roles, profileIds, modules: form.modules,
      ...(form.createProfile ? { profile: { kind: form.profileKind, name: String(formData.get("displayName") || "").trim(), email: String(formData.get("email") || "").trim(), active: true, guardianIds: [], membershipStatus: "active" } } : {}),
    };
    setBusy(true); setError(""); setMessage("");
    try {
      if (dialogUser) await request("", { method: "PATCH", body: JSON.stringify(body) });
      else {
        const result = await request("", { method: "POST", body: JSON.stringify({ ...body, delivery: temporaryPassword ? "temporary" : "invite" }) });
        if (result.resetLink) setInvite({ email: result.user.email, link: result.resetLink, title: "Convite para definir palavra-passe" });
        if (result.temporaryPassword) setCreatedCredentials({ email: result.user.email, password: result.temporaryPassword });
      }
      setMessage(dialogUser ? "Permissões atualizadas." : temporaryPassword ? "Conta criada com palavra-passe temporária." : "Conta criada. Envie a ligação de convite ao utilizador.");
      setDialogUser(null);
      setUserDialogOpen(false);
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function changeSuspension() {
    if (!confirmUser) return;
    const target = confirmUser;
    setBusy(true); setError("");
    try {
      await request("", { method: "PATCH", body: JSON.stringify({ action: target.suspended ? "restore" : "suspend", uid: target.uid }) });
      setConfirmUser(null);
      setMessage(target.suspended ? "Utilizador reativado." : "Acesso suspenso e sessões terminadas.");
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function removeUser() {
    if (!removeUserTarget) return;
    const target = removeUserTarget;
    setBusy(true); setError("");
    try {
      const result = await request("", { method: "DELETE", body: JSON.stringify({ uid: target.uid }) });
      setRemoveUserTarget(null); setDetailUser(null);
      setMessage(result.authCleanupPending ? `O acesso de ${target.displayName || target.email} foi bloqueado e os perfis foram preservados; a remoção da conta de autenticação precisa de nova tentativa.` : `A conta de ${target.displayName || target.email} foi removida. Os perfis e respetivos registos foram preservados.`);
      await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function resetPassword(user) {
    setBusy(true); setError("");
    try {
      const result = await request("", { method: "POST", body: JSON.stringify({ action: "reset-password", uid: user.uid }) });
      setInvite({ email: user.email, link: result.resetLink, title: "Ligação de recuperação" });
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  async function saveProfile(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const body = { action: "save-profile", profile: { id: editingProfile.id, kind: editingProfile.kind, ...profileForm, name: String(data.get("name") || "").trim(), email: String(data.get("email") || "").trim(), guardianIds: editingProfile.guardianIds || [], active: profileForm.active } };
    setBusy(true); setError(""); setMessage("");
    try {
      await request("", { method: "POST", body: JSON.stringify(body) }, "/api/platform");
      setProfileEditorOpen(false); setEditingProfile(null); setMessage("Perfil atualizado."); await reload();
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  }

  return <div className="user-manager">
    <Card className="user-manager-card">
      <header className="user-manager-heading"><div><p className="platform-eyebrow">Contas, pessoas e sócios</p><h2>Contas e perfis</h2><p>Crie contas, ligue perfis e escolha os menus de cada utilizador.</p></div><div className="platform-record-actions"><details className="platform-action-menu" id="user-manager-actions-menu"><summary aria-label="Mais opções de utilizadores" title="Mais opções"><MoreHorizontal size={21}/></summary><div role="menu" aria-label="Opções de utilizadores"><button type="button" role="menuitem" disabled={!studentProfiles.length} onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;exportStudents();}}>Lista de alunos · PDF</button><button type="button" role="menuitem" disabled={loading||!allRows.length} onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;printReport({title:"Gestão de utilizadores",subtitle:`${allRows.length} registos · pesquisa e filtros aplicados`,columns:["Pessoa","Email","Perfil e permissões","Estado","Último acesso"],rows:allRows.map(({type,value})=>type==="user"?[value.displayName||"Sem nome",value.email||"Sem email",[...(value.profiles||[]).map(profile=>`${profileLabels[profile.kind]} · ${profile.name}`),...(value.roles||[]).map(role=>roleLabels[role]||role)].join(" · ")||"Sem perfil associado",value.suspended?"Suspenso":value.accessActive?"Ativo":"Sem acesso",date(value.lastSignInAt)]:[value.name,value.email||"Sem conta de acesso",profileLabels[value.kind]||value.kind,value.active?"Sem conta":"Perfil inativo","—"])})}}>Lista filtrada · PDF</button><button type="button" role="menuitem" onClick={()=>{document.getElementById("user-manager-actions-menu").open=false;openCreate();}}>Novo utilizador</button></div></details></div></header>
      {error && <p className="platform-error" role="alert">{error}</p>}{message && <p className="platform-success" role="status">{message}</p>}
      <div className="user-manager-toolbar"><Label className="platform-search"><span className="platform-sr">Pesquisar utilizadores e perfis</span><Input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar por nome, email ou perfil" /></Label><span className="user-manager-count">{allRows.length} resultados · {matchingUsers.length} contas · {matchingProfiles.length} perfis sem conta</span></div>
      <div className="user-manager-filters" aria-label="Filtros de utilizadores"><span className="user-manager-filter-label"><ListFilter size={16}/>Filtros</span><label><span>Estado</span><NativeSelect value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">Todos</option><option value="active">Ativos</option><option value="suspended">Suspensos</option><option value="no-access">Sem acesso</option></NativeSelect></label><label><span>Permissão</span><NativeSelect value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">Todas</option>{Object.entries(roleLabels).map(([role,label]) => <option key={role} value={role}>{label}</option>)}</NativeSelect></label><label><span>Tipo de perfil</span><NativeSelect value={profileFilter} onChange={(event) => setProfileFilter(event.target.value)}><option value="all">Todos</option>{Object.entries(profileLabels).map(([kind,label]) => <option key={kind} value={kind}>{label}</option>)}</NativeSelect></label><Button size="sm" variant="ghost" disabled={statusFilter === "all" && roleFilter === "all" && profileFilter === "all" && !query} onClick={() => { setQuery(""); setStatusFilter("all"); setRoleFilter("all"); setProfileFilter("all"); }}>Limpar</Button></div>
      <div className="user-manager-table-wrap"><Table className="user-manager-table"><TableCaption>Contas Firebase e perfis da associação</TableCaption><TableHeader><TableRow><TableHead>Pessoa</TableHead><TableHead>Perfil e permissões</TableHead><TableHead>Estado</TableHead><TableHead>Último acesso</TableHead><TableHead><span className="platform-sr">Ações</span></TableHead></TableRow></TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={5}>A carregar utilizadores…</TableCell></TableRow>}
          {!loading && filteredUsers.map((user) => <TableRow key={user.uid}>
            <TableCell><strong>{user.displayName || "Sem nome"}</strong><small className="user-manager-secondary">{user.email || "Sem email"}</small></TableCell>
            <TableCell><div className="user-manager-badges">{user.profiles.length ? user.profiles.map((profile) => <Badge key={profile.id} variant="secondary">{profileLabels[profile.kind]} · {profile.name}{profile.kind === "member" && profile.memberNumber ? ` · ${profile.memberNumber}` : ""}</Badge>) : <span className="user-manager-secondary">Sem perfil associado</span>}{user.roles.map((role) => <Badge key={role} variant="outline">{roleLabels[role] || role}</Badge>)}</div>{user.profiles.some((profile) => profile.kind === "member") && <small className="user-manager-secondary">{membershipLabels[user.profiles.find((profile) => profile.kind === "member").membershipStatus] || "Estado associativo por confirmar"}</small>}</TableCell>
            <TableCell><Badge variant={user.suspended ? "destructive" : user.accessActive ? "default" : "outline"}>{user.suspended ? "Suspenso" : user.accessActive ? "Ativo" : "Sem acesso"}</Badge></TableCell>
            <TableCell>{date(user.lastSignInAt)}</TableCell>
            <TableCell><Button size="sm" variant="outline" className="user-manager-details-button" disabled={busy} onClick={() => setDetailUser(user)}><Eye size={15}/>Ver detalhes</Button></TableCell>
          </TableRow>)}
          {!loading && filteredProfiles.map((profile) => <TableRow key={`profile-${profile.id}`}>
            <TableCell><strong>{profile.name}</strong><small className="user-manager-secondary">{profile.email || "Sem conta de acesso"}</small></TableCell>
            <TableCell><div className="user-manager-badges"><Badge variant="secondary">{profileLabels[profile.kind]}</Badge>{profile.kind === "member" && <Badge variant="outline">{membershipLabels[profile.membershipStatus] || "Estado por confirmar"}{profile.memberNumber ? ` · ${profile.memberNumber}` : ""}</Badge>}</div></TableCell>
            <TableCell><Badge variant={profile.active ? "outline" : "destructive"}>{profile.active ? "Sem conta" : "Perfil inativo"}</Badge></TableCell>
            <TableCell>—</TableCell>
            <TableCell><div className="user-manager-actions"><Button size="sm" variant="outline" onClick={() => openCreate(profile)} disabled={!profile.active || busy}>Dar acesso</Button><Button size="sm" variant="outline" className="user-manager-edit-profile" onClick={() => openProfile(profile)}>Editar pessoa</Button></div></TableCell>
          </TableRow>)}
          {!loading && !filteredUsers.length && !filteredProfiles.length && <TableRow><TableCell colSpan={5}>Não foram encontrados utilizadores ou perfis.</TableCell></TableRow>}
        </TableBody>
      </Table></div>
      <nav className="user-manager-pagination" aria-label="Paginação de utilizadores"><span>{allRows.length ? `A mostrar ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, allRows.length)} de ${allRows.length}` : "Sem resultados"}</span><div><Button size="sm" variant="outline" aria-label="Página anterior" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16}/>Anterior</Button><span aria-live="polite">Página {page} de {totalPages}</span><Button size="sm" variant="outline" aria-label="Página seguinte" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Seguinte<ChevronRight size={16}/></Button></div></nav>
    </Card>

    <Sheet open={!!detailUser} onOpenChange={(open) => { if (!open) setDetailUser(null); }} ariaLabel={detailUser ? `Detalhes de ${detailUser.displayName || detailUser.email}` : "Detalhes do utilizador"} className="platform-dialog platform-context-sheet user-manager-detail-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Ficha de utilizador</p><h2>{detailUser?.displayName || "Sem nome"}</h2></div><Button type="button" variant="outline" onClick={() => setDetailUser(null)}>Fechar</Button></div><div className="user-manager-detail-grid"><div><span>Email de acesso</span><strong>{detailUser?.email || "Sem email"}</strong></div><div><span>Estado da conta</span><Badge variant={detailUser?.suspended ? "destructive" : detailUser?.accessActive ? "default" : "outline"}>{detailUser?.suspended ? "Suspenso" : detailUser?.accessActive ? "Ativo" : "Sem acesso"}</Badge></div><div><span>Último acesso</span><strong>{date(detailUser?.lastSignInAt)}</strong></div><div><span>Conta criada</span><strong>{date(detailUser?.createdAt)}</strong></div><div><span>Email confirmado</span><strong>{detailUser?.emailVerified ? "Sim" : "Não"}</strong></div><div><span>Permissões</span><div className="user-manager-badges">{(detailUser?.roles || []).length ? detailUser.roles.map((role) => <Badge key={role} variant="outline">{roleLabels[role] || role}</Badge>) : <span>Sem permissões</span>}</div></div><div className="user-manager-detail-profiles"><span>Menus disponíveis</span><div className="user-manager-badges">{(detailUser?.modules || []).map((module) => <Badge key={module} variant="secondary">{moduleLabels[module] || module}</Badge>)}</div></div><div className="user-manager-detail-profiles"><span>Perfis associados</span>{detailUser?.profiles?.length ? <div className="user-manager-detail-profile-list">{detailUser.profiles.map((profile) => <article key={profile.id}><div><strong>{profile.name}</strong><small>{profileLabels[profile.kind] || profile.kind}{profile.kind === "member" ? ` · ${membershipLabels[profile.membershipStatus] || "Estado por confirmar"}${profile.memberNumber ? ` · Sócio ${profile.memberNumber}` : ""}` : ""}</small></div><Button size="sm" variant="outline" onClick={() => { setDetailUser(null); openProfile(allProfiles.find((item) => item.id === profile.id) || profile); }}>Editar perfil</Button></article>)}</div> : <p>Sem perfil associado.</p>}</div></div><div className="platform-actions user-manager-detail-actions"><Button className="platform-primary" onClick={() => { const target = detailUser; setDetailUser(null); openEdit(target); }}>Permissões e menus</Button><Button variant="outline" onClick={() => { const target = detailUser; setDetailUser(null); resetPassword(target); }}>Enviar reset</Button><Button variant={detailUser?.suspended ? "secondary" : "outline"} onClick={() => { const target = detailUser; setDetailUser(null); setConfirmUser(target); }}>{detailUser?.suspended ? "Reativar utilizador" : "Suspender utilizador"}</Button>{detailUser?.uid !== platformAuth().currentUser?.uid && <Button variant="destructive" onClick={() => { setDetailUser(null); setRemoveUserTarget(detailUser); }}>Remover conta</Button>}</div></section></Sheet>

    <Dialog open={profileEditorOpen} onOpenChange={(open) => { setProfileEditorOpen(open); if (!open) setEditingProfile(null); }} ariaLabel={editingProfile ? `Editar perfil de ${editingProfile.name}` : "Editar perfil"} className="platform-dialog user-manager-dialog"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">{editingProfile ? profileLabels[editingProfile.kind] : "Perfil"}</p><h2>Editar pessoa</h2></div><Button type="button" variant="outline" onClick={() => setProfileEditorOpen(false)}>Fechar</Button></div><form onSubmit={saveProfile}><fieldset disabled={busy}><FieldLike label="Nome"><Input name="name" required maxLength={100} value={profileForm.name || ""} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))}/></FieldLike><FieldLike label="Email de contacto"><Input name="email" type="email" maxLength={254} value={profileForm.email || ""} onChange={(event) => setProfileForm((current) => ({ ...current, email: event.target.value }))}/></FieldLike>{editingProfile?.kind === "member" && <><FieldLike label="Número de sócio"><Input value={profileForm.memberNumber || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, memberNumber: event.target.value }))}/></FieldLike><FieldLike label="Situação associativa"><NativeSelect value={profileForm.membershipStatus || "active"} onChange={(event) => setProfileForm((current) => ({ ...current, membershipStatus: event.target.value }))}><option value="pending">Pendente</option><option value="active">Ativo</option><option value="suspended">Suspenso</option><option value="left">Cessou</option></NativeSelect></FieldLike></>}{editingProfile?.kind === "student" && <><FieldLike label="Ano escolar"><Input value={profileForm.schoolYear || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, schoolYear: event.target.value }))}/></FieldLike><FieldLike label="Faixa etária"><Input value={profileForm.ageBand || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, ageBand: event.target.value }))}/></FieldLike></>}{editingProfile?.kind === "tutor" && <><FieldLike label="Disciplinas / competências"><Input value={profileForm.subjects || ""} maxLength={200} onChange={(event) => setProfileForm((current) => ({ ...current, subjects: event.target.value }))}/></FieldLike><FieldLike label="Disponibilidade"><Input value={profileForm.availability || ""} maxLength={1000} onChange={(event) => setProfileForm((current) => ({ ...current, availability: event.target.value }))}/></FieldLike></>}<label className="platform-check"><Checkbox checked={profileForm.active === true} onChange={(event) => setProfileForm((current) => ({ ...current, active: event.target.checked }))}/>Perfil ativo</label><div className="platform-actions"><Button className="platform-primary" type="submit">Guardar perfil</Button><Button type="button" variant="outline" onClick={() => setProfileEditorOpen(false)}>Cancelar</Button></div></fieldset></form></section></Dialog>

    <Dialog open={userDialogOpen} onOpenChange={(open) => { setUserDialogOpen(open); if (!open) setDialogUser(null); }} ariaLabel={dialogUser ? `Permissões de ${dialogUser.displayName || dialogUser.email}` : "Criar utilizador"} className="platform-dialog user-manager-dialog">
      <section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Gestão central</p><h2>{dialogUser ? "Permissões e perfis" : "Novo utilizador"}</h2></div><Button type="button" variant="outline" onClick={() => { setDialogUser(null); setUserDialogOpen(false); }}>Fechar</Button></div>
        <form onSubmit={submit}><fieldset disabled={busy}>
          {!dialogUser && <><FieldLike label="Nome"><Input name="displayName" required maxLength={100} defaultValue={form.displayName} /></FieldLike><FieldLike label="Email"><Input name="email" required type="email" maxLength={254} defaultValue={form.email} /></FieldLike><fieldset className="user-manager-profile-options"><legend>Acesso inicial</legend><label className="platform-check"><input type="radio" name="initial-access" checked={!temporaryPassword} onChange={() => setTemporaryPassword(false)} />Enviar convite para definir palavra-passe</label><label className="platform-check"><input type="radio" name="initial-access" checked={temporaryPassword} onChange={() => setTemporaryPassword(true)} />Gerar palavra-passe temporária</label><p className="platform-hint">A palavra-passe temporária é mostrada apenas uma vez. Entregue-a por um canal seguro e peça ao utilizador para a alterar ao entrar.</p></fieldset></>}
          <RoleOptions value={form.roles} onChange={(roles) => setForm((current) => ({ ...current, roles, modules: dialogUser ? restrictAreasForRoles(current.modules,roles) : defaultAreasForRoles(roles) }))} />
          <fieldset className="user-manager-profile-options"><legend>Perfis associados</legend>{(dialogUser ? allProfiles.filter((profile) => !profile.accountUid || profile.accountUid === dialogUser.uid || form.profileIds.includes(profile.id)) : allProfiles.filter((profile) => !profile.accountUid || profile.id === form.profileIds[0])).map((profile) => <label className="platform-check" key={profile.id}><Checkbox checked={form.profileIds.includes(profile.id)} onChange={(event) => toggleProfile(profile.id, event.target.checked)} />{profileLabels[profile.kind]} · {profile.name}</label>)}{!allProfiles.length && <p className="platform-hint">Ainda não existem perfis disponíveis para associar.</p>}</fieldset>
          <ModuleOptions roles={form.roles} value={form.modules} onChange={(modules) => setForm((current) => ({ ...current, modules }))} />
          {!dialogUser && <><label className="platform-check user-manager-create-profile"><Checkbox checked={form.createProfile} onChange={(event) => setForm((current) => {const roles=event.target.checked&&!current.roles.includes(current.profileKind)?[...current.roles,current.profileKind]:current.roles;return {...current,createProfile:event.target.checked,roles,modules:defaultAreasForRoles(roles)};})} />Criar também um perfil novo</label>{form.createProfile && <FieldLike label="Tipo de perfil"><NativeSelect value={form.profileKind} onChange={(event) => setForm((current) => {const roles=current.roles.includes(current.profileKind)?[...current.roles.filter((role) => role !== current.profileKind),event.target.value]:[...current.roles,event.target.value];return {...current,profileKind:event.target.value,roles,modules:defaultAreasForRoles(roles)};})}>{Object.entries(profileLabels).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</NativeSelect></FieldLike>}</>}
          {dialogUser && <label className="platform-check"><Checkbox checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />Acesso à área ativo</label>}
          <p className="platform-hint">As permissões são aplicadas ao criar a conta. O convite gera uma ligação segura para definir a palavra-passe; a palavra-passe temporária só é apresentada uma vez.</p>
          <div className="platform-actions"><Button type="submit" className="platform-primary">{busy ? "A guardar…" : dialogUser ? "Guardar permissões" : "Criar utilizador"}</Button><Button type="button" variant="outline" onClick={() => { setDialogUser(null); setUserDialogOpen(false); }}>Cancelar</Button></div>
        </fieldset></form>
      </section>
    </Dialog>

    <Dialog open={!!removeUserTarget} onOpenChange={(open) => { if (!open) setRemoveUserTarget(null); }} ariaLabel="Confirmar remoção da conta" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><p className="platform-eyebrow">Remoção de acesso</p><h2>Remover esta conta?</h2><p>A conta de <strong>{removeUserTarget?.displayName || removeUserTarget?.email}</strong> será apagada e deixará de poder iniciar sessão. Os perfis de pessoa e os registos existentes serão preservados, sem associação à conta. Esta ação não pode ser desfeita.</p><div className="platform-actions"><Button variant="destructive" disabled={busy} onClick={removeUser}>{busy ? "A remover…" : "Remover conta"}</Button><Button variant="outline" disabled={busy} onClick={() => setRemoveUserTarget(null)}>Cancelar</Button></div></section></Dialog>
    <Dialog open={!!confirmUser} onOpenChange={(open) => { if (!open) setConfirmUser(null); }} ariaLabel="Confirmar alteração do acesso" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><p className="platform-eyebrow">Confirmação</p><h2>{confirmUser?.suspended ? "Reativar acesso?" : "Suspender acesso?"}</h2><p>{confirmUser?.suspended ? `${confirmUser.displayName || confirmUser.email} poderá voltar a iniciar sessão.` : `${confirmUser?.displayName || confirmUser?.email} deixará de poder iniciar sessão e as sessões atuais serão terminadas.`}</p><div className="platform-actions"><Button className="platform-primary" disabled={busy} onClick={changeSuspension}>{busy ? "A processar…" : confirmUser?.suspended ? "Reativar utilizador" : "Suspender utilizador"}</Button><Button variant="outline" disabled={busy} onClick={() => setConfirmUser(null)}>Cancelar</Button></div></section></Dialog>
    <Dialog open={!!invite} onOpenChange={(open) => { if (!open) setInvite(null); }} ariaLabel="Ligação de acesso ao utilizador" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Acesso seguro</p><h2>{invite?.title || "Ligação de acesso"}</h2></div><Button type="button" variant="outline" onClick={() => setInvite(null)}>Fechar</Button></div><p>Envie esta ligação a <strong>{invite?.email}</strong> para definir ou alterar a palavra-passe e entrar na área.</p><FieldLike label="Ligação segura"><Input readOnly value={invite?.link || ""} onFocus={(event) => event.target.select()} /></FieldLike><div className="platform-actions"><Button className="platform-primary" onClick={async () => { try { await navigator.clipboard.writeText(invite?.link || ""); setMessage("Ligação copiada."); } catch { setMessage("Selecione a ligação e copie-a manualmente."); } }}>Copiar ligação</Button><Button variant="outline" onClick={() => setInvite(null)}>Concluir</Button></div></section></Dialog>
    <Dialog open={!!createdCredentials} onOpenChange={(open) => { if (!open) setCreatedCredentials(null); }} ariaLabel="Palavra-passe temporária" className="platform-dialog user-manager-confirm"><section className="platform-card platform-editor"><div className="platform-list-heading"><div><p className="platform-eyebrow">Acesso inicial</p><h2>Palavra-passe temporária</h2></div><Button type="button" variant="outline" onClick={() => setCreatedCredentials(null)}>Fechar</Button></div><p>Partilhe por um canal seguro com <strong>{createdCredentials?.email}</strong>. Esta palavra-passe é mostrada apenas uma vez.</p><FieldLike label="Palavra-passe temporária"><Input readOnly value={createdCredentials?.password || ""} onFocus={(event) => event.target.select()} /></FieldLike><p className="platform-hint">O utilizador deve alterá-la imediatamente em “Alterar palavra-passe” após entrar.</p><div className="platform-actions"><Button className="platform-primary" onClick={async () => { try { await navigator.clipboard.writeText(createdCredentials?.password || ""); setMessage("Palavra-passe copiada."); } catch { setMessage("Selecione a palavra-passe e copie-a manualmente."); } }}>Copiar palavra-passe</Button><Button variant="outline" onClick={() => setCreatedCredentials(null)}>Concluir</Button></div></section></Dialog>
  </div>;
}

function FieldLike({ label, children }) {
  return <Label className="platform-field"><span>{label}</span>{children}</Label>;
}
