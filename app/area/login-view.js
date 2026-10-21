"use client";

/* eslint-disable @next/next/no-html-link-for-pages -- Full navigation restarts the Firebase client lifecycle. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { browserSessionPersistence, onAuthStateChanged, sendPasswordResetEmail, setPersistence, signInWithEmailAndPassword } from "firebase/auth";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { platformAuth } from "../../lib/firebase-client";

export default function AreaLogin() {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const feedback = useRef(null);

  useEffect(() => onAuthStateChanged(platformAuth(), (user) => {
    if (user) window.location.replace("/area");
    else setChecking(false);
  }), []);

  async function login(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await setPersistence(platformAuth(), browserSessionPersistence);
      await signInWithEmailAndPassword(platformAuth(), String(form.get("email")), String(form.get("password")));
      window.location.assign("/area");
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

  return <main className="admin-login-page area-login-page" aria-labelledby="area-login-title">
    <section className="login-panel" aria-labelledby="area-login-title">
      <a className="login-brand" href="/" aria-label="BaticAmigo, voltar ao site">
        <Image src="/images/logo.png" alt="" width={64} height={64} priority />
        <span><strong>BaticAmigo</strong><small>Área reservada</small></span>
      </a>
      <Card className="login-card">
        <header className="login-heading">
          <span className="login-eyebrow">Comunidade BaticAmigo</span>
          <h1 id="area-login-title">A sua área,<br /><em>mais perto.</em></h1>
          <p>Entre para acompanhar sessões, perfis, documentos e mensagens.</p>
        </header>
        <div ref={feedback} tabIndex={-1} className="area-login-feedback" aria-live="polite">
          {error && <p className="admin-error-message" role="alert">{error}</p>}
          {message && <p className="admin-status-message" role="status">{message}</p>}
        </div>
        {checking ? <p role="status" className="area-login-checking">A verificar a sua sessão…</p> : <form className="login-form" onSubmit={login}>
          <div className="login-field"><Label htmlFor="area-email">Email</Label><Input id="area-email" name="email" type="email" autoComplete="username" placeholder="nome@baticamigo.pt" required maxLength={254} disabled={busy} /></div>
          <div className="login-field"><Label htmlFor="area-password">Palavra-passe</Label><Input id="area-password" name="password" type="password" autoComplete="current-password" placeholder="Introduza a sua palavra-passe" required disabled={busy} /></div>
          <div className="login-form-options"><span>Conta protegida pelo Firebase</span><button type="button" className="area-login-recovery" disabled={busy} onClick={reset}>Recuperar acesso</button></div>
          <Button type="submit" className="login-submit" disabled={busy}><span>{busy ? "Aguarde…" : "Entrar na minha área"}</span><span aria-hidden="true">→</span></Button>
        </form>}
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
