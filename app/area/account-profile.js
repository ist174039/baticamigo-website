"use client";

import { useEffect, useState } from "react";
import { updateProfile } from "firebase/auth";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

const roleNames = { admin: "Administrador", coordinator: "Coordenação", student: "Aluno", guardian: "Encarregado", tutor: "Explicador", volunteer: "Voluntário", member: "Sócio" };
const profileNames = { student: "Aluno", guardian: "Encarregado", tutor: "Explicador", member: "Sócio" };

export default function AccountProfile({ user, roles = [], profiles = [], displayName, onDisplayNameChange, onChangePassword }) {
  const [name, setName] = useState(displayName || user?.displayName || "");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setName(displayName || user?.displayName || ""), [displayName, user?.uid, user?.displayName]);

  async function save(event) {
    event.preventDefault();
    const normalizedName = name.trim();
    if (!normalizedName || normalizedName.length > 80) {
      setError("Introduza um nome entre 1 e 80 caracteres.");
      setStatus("");
      return;
    }
    setSaving(true);
    setError("");
    setStatus("");
    try {
      await updateProfile(user, { displayName: normalizedName });
      onDisplayNameChange(normalizedName);
      setStatus("Nome atualizado com sucesso.");
    } catch {
      setError("Não foi possível guardar o nome. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  return <div className="platform-grid platform-account-profile">
    <section className="platform-card">
      <div className="platform-list-heading"><div><p className="platform-eyebrow">A sua conta</p><h2>Dados de acesso</h2><p>Atualize a forma como o seu nome aparece nas áreas reservadas.</p></div></div>
      <form onSubmit={save}>
        <fieldset disabled={saving}>
          <Label className="platform-field"><span>Nome apresentado</span><Input autoComplete="name" maxLength={80} value={name} onChange={event => setName(event.target.value)} required /></Label>
          <Label className="platform-field"><span>Email de acesso</span><Input type="email" value={user?.email || ""} readOnly disabled /></Label>
          {error && <p className="platform-error" role="alert">{error}</p>}
          {status && <p className="platform-success" role="status">{status}</p>}
          <div className="platform-actions"><Button type="submit" className="platform-primary">{saving ? "A guardar…" : "Guardar nome"}</Button><Button type="button" variant="outline" onClick={onChangePassword}>Alterar palavra-passe</Button></div>
        </fieldset>
      </form>
    </section>
    <section className="platform-card">
      <div className="platform-list-heading"><div><p className="platform-eyebrow">Acesso e identidade</p><h2>O seu perfil</h2><p>Permissões atribuídas pela associação.</p></div></div>
      <div className="platform-account-summary"><span className="platform-account-avatar" aria-hidden="true">{(displayName || user?.email || "BA").trim().split(/\s+/).slice(0, 2).map(part => part[0]?.toLocaleUpperCase("pt-PT") || "").join("")}</span><div><strong>{displayName || user?.displayName || "Utilizador"}</strong><small>{user?.email || "Sem email associado"}</small></div></div>
      <div className="platform-account-detail"><span>Permissões</span><div>{roles.length ? roles.map(role => <Badge key={role} variant="outline">{roleNames[role] || role}</Badge>) : <small>Sem permissões atribuídas</small>}</div></div>
      <div className="platform-account-detail"><span>Perfis associados</span><div>{profiles.length ? profiles.map(profile => <Badge key={profile.id} variant="secondary">{profileNames[profile.kind] || profile.kind} · {profile.name}</Badge>) : <small>Sem perfis associados</small>}</div></div>
    </section>
  </div>;
}
