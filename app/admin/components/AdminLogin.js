/* eslint-disable @next/next/no-html-link-for-pages -- Full document navigation resets the legacy Firebase login lifecycle. */
import Image from "next/image";
import AdminFirebaseScripts from "./AdminFirebaseScripts";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

export default function AdminLogin() {
  return (
    <main className="admin-login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <a className="login-brand" href="/" aria-label="BaticAmigo, voltar ao site">
          <Image src="/images/logo.png" alt="" width={64} height={64} priority />
          <span>
            <strong>BaticAmigo</strong>
            <small>Área reservada</small>
          </span>
        </a>

        <Card className="login-card">
          <header className="login-heading">
            <span className="login-eyebrow">Administração</span>
            <h1 id="login-title">Acesso ao<br /><em>painel.</em></h1>
            <p>Entre com a sua conta para gerir os conteúdos da associação.</p>
          </header>

          <div id="login-error" className="admin-error-message" role="alert" hidden />
          <div id="login-status" className="admin-status-message" role="status" aria-live="polite" hidden />

          <form id="login-form" className="admin-form login-form">
            <div className="login-field">
              <Label htmlFor="email">Email</Label>
              <Input
                type="email"
                id="email"
                name="email"
                autoComplete="username"
                placeholder="nome@baticamigo.pt"
                aria-describedby="login-error login-status"
                required
              />
            </div>
            <div className="login-field">
              <Label htmlFor="password">Palavra-passe</Label>
              <Input
                type="password"
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="Introduza a sua palavra-passe"
                aria-describedby="login-error login-status"
                required
              />
            </div>
            <div className="login-form-options">
              <span>Conta protegida pelo Firebase</span>
              <a href="#reset-password" id="reset-password-link">Recuperar acesso</a>
            </div>
            <Button type="submit" className="login-submit">
              <span className="login-submit-label">Entrar no painel</span>
              <span aria-hidden="true">→</span>
            </Button>
          </form>

          <a className="login-home-link" href="/">← Voltar ao site</a>
        </Card>
      </section>

      <aside className="login-aside" aria-label="Sobre a área administrativa">
        <div className="login-aside-content">
          <span className="aside-eyebrow"><i aria-hidden="true" /> BaticAmigo · Gestão</span>
          <h2>Mais perto.<br />Mais <em>juntos.</em></h2>
          <p>Um espaço para cuidar das iniciativas, histórias e encontros que fazem a nossa comunidade.</p>
          <div className="login-aside-note">
            <span aria-hidden="true">✳</span>
            <div><strong>Comunidade em movimento</strong><small>Gestão da associação BaticAmigo</small></div>
          </div>
        </div>
        <span className="aside-vertical" aria-hidden="true">ADMINISTRAÇÃO · BATICAMIGO</span>
        <div className="login-aside-orbit orbit-a" aria-hidden="true" />
        <div className="login-aside-orbit orbit-b" aria-hidden="true" />
      </aside>

      <AdminFirebaseScripts page="login" />
    </main>
  );
}
