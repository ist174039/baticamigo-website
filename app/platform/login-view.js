"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full navigation restarts the Firebase client lifecycle. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { browserSessionPersistence, onAuthStateChanged, sendEmailVerification, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { ArrowUpRight, LogOut, PanelsTopLeft, UsersRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { platformAuth } from "../../lib/firebase-client";
import { availablePlatformDestinations } from "../../lib/platform/access.mjs";

async function platformAccount(user) {
  const token = await user.getIdToken();
  const response = await fetch("/api/platform", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(result.error || "Não foi possível validar o acesso.");
    error.status = response.status;
    throw error;
  }
  return result.account;
}

export default function PlatformLogin() {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [account, setAccount] = useState(null);
  const [verificationUser, setVerificationUser] = useState(null);
  const feedback = useRef(null);
  const revision = useRef(0);

  useEffect(() => {
    let live = true;
    if (new URLSearchParams(window.location.search).get("access") === "denied") {
      setError("Esta conta não tem acesso ao painel administrativo.");
    }
    const unsubscribe = onAuthStateChanged(platformAuth(), async (user) => {
      const current = ++revision.current;
      setChecking(true);
      setAccount(null);
      setVerificationUser(null);
      if (!user) {
        if (live && current === revision.current) setChecking(false);
        return;
      }
      try {
        const account = await platformAccount(user);
        if (!live || current !== revision.current) return;
        setAccount(account);
        if (new URLSearchParams(window.location.search).get("destination") === "admin" && !availablePlatformDestinations(account).includes("admin")) {
          setError("O seu perfil não tem permissão para gerir o site. Pode continuar para a Área da associação.");
        }
        setChecking(false);
      } catch (failure) {
        if (!live || current !== revision.current) return;
        if (failure.status === 403 && failure.message === "Confirme o endereço de email antes de aceder à plataforma.") {
          setVerificationUser(user);
          setError("Confirme o endereço desta conta para continuar.");
          setChecking(false);
          return;
        }
        if (failure.status === 403) {
          try {
            const token = await user.getIdToken();
            const response = await fetch("/api/admin/users?check=1", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
            const result = await response.json().catch(() => ({}));
            if (result.error === "Confirme o email da conta antes de gerir utilizadores.") {
              setVerificationUser(user);
              setError(result.error);
              setChecking(false);
              return;
            }
          } catch { /* Keep the platform error as the user-facing explanation. */ }
        }
        if (failure.status === 401 || failure.status === 403) await signOut(platformAuth());
        setError(failure.message || "Não foi possível validar o acesso. Tente novamente.");
        setChecking(false);
      }
    });
    return () => { live = false; revision.current += 1; unsubscribe(); };
  }, []);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setPersistence(platformAuth(), browserSessionPersistence);
      await signInWithEmailAndPassword(platformAuth(), String(form.get("email")), String(form.get("password")));
      setBusy(false);
    } catch {
      setError("Não foi possível iniciar sessão. Verifique os dados e tente novamente.");
      setBusy(false);
      requestAnimationFrame(() => feedback.current?.focus());
    }
  }

  async function reset(event) {
    event.preventDefault();
    const form = event.currentTarget.form;
    const email = form.elements.email;
    if (!email.reportValidity()) return;
    setBusy(true);
    setError("");
    setMessage("");
    try { await sendPasswordResetEmail(platformAuth(), email.value); } catch { /* Do not disclose whether the account exists. */ }
    setMessage("Se existir uma conta elegível, receberá instruções no email indicado.");
    setBusy(false);
    requestAnimationFrame(() => feedback.current?.focus());
  }

  async function resendVerification() {
    setError("");
    setMessage("");
    try {
      await sendEmailVerification(verificationUser);
      setMessage("Enviámos um email de verificação. Confirme o endereço e volte a entrar.");
      setVerificationUser(null);
    } catch (failure) {
      setError(failure.message || "Não foi possível enviar o email de verificação.");
    }
  }

  async function leaveSession() {
    setBusy(true);
    await signOut(platformAuth());
    setBusy(false);
  }

  return <main className="admin-login-page area-login-page" aria-labelledby="area-login-title">
    <section className="login-panel" aria-labelledby="area-login-title">
      <a className="login-brand" href="/" aria-label="BaticAmigo, voltar ao site">
        <Image src="/images/logo.png" alt="" width={64} height={64} priority />
        <span><strong>BaticAmigo</strong><small>Área reservada</small></span>
      </a>
      <Card className={`login-card${account ? " workspace-picker" : ""}`}>
        {account ? <>
          <header className="login-heading">
            <span className="login-eyebrow">Acesso confirmado</span>
            <h1 id="area-login-title">Escolha o<br /><em>seu espaço.</em></h1>
            <p>Os espaços disponíveis são determinados pelo seu perfil e pelas permissões da sua conta.</p>
          </header>
          <div ref={feedback} tabIndex={-1} className="area-login-feedback" aria-live="polite">
            {error && <p className="admin-error-message" role="alert">{error}</p>}
            {message && <p className="admin-status-message" role="status">{message}</p>}
          </div>
          <div className="workspace-choice-grid" aria-label="Escolha uma área">
            {availablePlatformDestinations(account).includes("admin") && <a className="workspace-choice-link" href="/platform/admin">
              <Card className="workspace-choice-card">
                <span className="workspace-choice-icon"><PanelsTopLeft size={21} aria-hidden="true" /></span>
                <span className="workspace-choice-copy"><strong>Gestão do site</strong><small>Conteúdos, notícias, eventos e contactos.</small></span>
                <span className="workspace-choice-action">Abrir gestão do site <ArrowUpRight size={16} aria-hidden="true" /></span>
              </Card>
            </a>}
            {availablePlatformDestinations(account).includes("area") && <a className="workspace-choice-link" href="/area">
              <Card className="workspace-choice-card">
                <span className="workspace-choice-icon"><UsersRound size={21} aria-hidden="true" /></span>
                <span className="workspace-choice-copy"><strong>Plataforma BaticAmigo</strong><small>Utilizadores, sessões, perfis e área financeira.</small></span>
                <span className="workspace-choice-action">Abrir plataforma <ArrowUpRight size={16} aria-hidden="true" /></span>
              </Card>
            </a>}
          </div>
          <Button type="button" variant="outline" className="workspace-signout" disabled={busy} onClick={leaveSession}><LogOut size={16} aria-hidden="true" /><span>{busy ? "A terminar sessão…" : "Terminar sessão"}</span></Button>
        </> : <>
          <header className="login-heading">
            <span className="login-eyebrow">Comunidade BaticAmigo</span>
            <h1 id="area-login-title">A sua área,<br /><em>mais perto.</em></h1>
            <p>Entre para acompanhar a associação ou gerir os espaços a que tem acesso.</p>
          </header>
          <div ref={feedback} tabIndex={-1} className="area-login-feedback" aria-live="polite">
            {error && <p className="admin-error-message" role="alert">{error}</p>}
            {message && <p className="admin-status-message" role="status">{message}</p>}
          </div>
          {checking ? <p role="status" className="area-login-checking">A verificar a sua sessão…</p> : <form className="login-form" onSubmit={login}>
            <div className="login-field"><Label htmlFor="area-email">Email</Label><Input id="area-email" name="email" type="email" autoComplete="username" placeholder="nome@baticamigo.pt" required maxLength={254} disabled={busy} /></div>
            <div className="login-field"><Label htmlFor="area-password">Palavra-passe</Label><Input id="area-password" name="password" type="password" autoComplete="current-password" placeholder="Introduza a sua palavra-passe" required disabled={busy} /></div>
            <div className="login-form-options"><span>Conta protegida pelo Firebase</span><button type="button" className="area-login-recovery" disabled={busy} onClick={reset}>Recuperar acesso</button></div>
            {verificationUser && <button type="button" className="login-verification-link" onClick={resendVerification}>Reenviar email de verificação</button>}
            <Button type="submit" className="login-submit" disabled={busy}><span>{busy ? "Aguarde…" : "Entrar"}</span><span aria-hidden="true">→</span></Button>
          </form>}
        </>}
        <a className="login-home-link" href="/platform/manual">Manual de utilização da plataforma</a>
        <a className="login-home-link" href="/">← Voltar ao site</a>
      </Card>
    </section>
    <aside className="login-aside" aria-label="Sobre a área reservada">
      <div className="login-aside-content">
        <span className="aside-eyebrow"><i aria-hidden="true" /> BaticAmigo · Comunidade</span>
        <h2>Aprender.<br />Crescer <em>juntos.</em></h2>
        <p>Um espaço para acompanhar cada passo, celebrar progressos e manter a comunidade ligada.</p>
        <div className="login-aside-note"><span aria-hidden="true">✳</span><div><strong>Um caminho partilhado</strong><small>O seu espaço na associação BaticAmigo</small></div></div>
      </div>
      <span className="aside-vertical" aria-hidden="true">COMUNIDADE · BATICAMIGO</span>
      <div className="login-aside-orbit orbit-a" aria-hidden="true" />
      <div className="login-aside-orbit orbit-b" aria-hidden="true" />
    </aside>
  </main>;
}
