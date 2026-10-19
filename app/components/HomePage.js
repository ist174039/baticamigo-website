import LegacyFirebaseScripts from "./LegacyFirebaseScripts";
import SiteHeader from "./SiteHeader";
import SectionHeading from "./SectionHeading";
import ContactForm from "./ContactForm";
import CollectionProgressiveReveal from "./CollectionProgressiveReveal";
import Image from "next/image";

const pillars = [
  { number: "01", icon: "fa-futbol", title: "Desporto", text: "Criamos espaços para crescer, cooperar e desenvolver hábitos de vida saudáveis através da prática desportiva." },
  { number: "02", icon: "fa-hand-holding-heart", title: "Apoio social", text: "Aproximamos pessoas e recursos para apoiar famílias e fortalecer uma comunidade mais solidária." },
  { number: "03", icon: "fa-masks-theater", title: "Cultura", text: "Celebramos as raízes, as artes e as histórias que nos unem e dão voz às várias gerações." },
  { number: "04", icon: "fa-book-open", title: "Educação", text: "Promovemos conhecimento, autonomia e novas oportunidades para crianças, jovens e adultos." },
];

function SiteFooter() {
  return <footer className="site-footer" aria-label="Rodapé">
    <div className="footer-main">
      <div className="footer-brand-column">
        <a className="brand brand-footer" href="#inicio" aria-label="BaticAmigo, início"><Image src="/images/logo.png" alt="" width={68} height={68} /><span><strong>BaticAmigo</strong><small>Juntos fazemos comunidade.</small></span></a>
        <p>Uma associação feita de encontros, participação e caminhos partilhados.</p>
      </div>
      <nav className="footer-nav" aria-label="Explorar">
        <span className="footer-label">Explorar</span>
        <a href="#missao">Quem somos</a><a href="#pilares">O que nos move</a><a href="#eventos">Atividades</a><a href="#membros">Comunidade</a>
      </nav>
      <div className="footer-connect">
        <span className="footer-label">Fale connosco</span>
        <a className="footer-contact" href="mailto:info@baticamigo.pt">info@baticamigo.pt <span aria-hidden="true">↗</span></a>
        <a className="footer-social" href="https://www.instagram.com/aba2022cultura/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a>
      </div>
      <a className="footer-back-top" href="#inicio" aria-label="Voltar ao início">↑</a>
    </div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Associação BaticAmigo</span><a href="/admin/login">Acesso administrativo <span aria-hidden="true">↗</span></a></div>
  </footer>;
}

function Hero() {
  return <section className="hero" id="inicio" aria-label="Destaques BaticAmigo"><div className="hero-art" aria-hidden="true"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-glow"/><div className="hero-stamp"><span>Comunidade</span><strong>em movimento</strong><i>✳</i></div></div><div className="hero-content"><span className="eyebrow eyebrow-light"><i/> Associação BaticAmigo · Portugal</span><h1>Laços que<br/><em>transformam.</em></h1><p>Uma comunidade onde o desporto, a cultura, a educação e a solidariedade abrem caminhos para todos.</p><div className="hero-actions"><a className="button button-lime" href="#missao">Conheça a BaticAmigo <span aria-hidden="true">↓</span></a><a className="hero-text-link" href="#eventos">Descubra as atividades <span aria-hidden="true">↗</span></a></div><div className="hero-meta"><span>Desporto, cultura, educação e apoio social</span></div></div><div className="hero-image" aria-hidden="true"><Image src="https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/df4a98c8-486a-437d-aa60-9723fed709d3.jpg?alt=media&token=90cdbb07-ad2c-44e0-89a0-2a637477a8ca" alt="" width={1030} height={920} priority sizes="100vw"/><div className="image-caption"><strong>O futuro constrói-se em conjunto</strong></div></div><span className="hero-side-label">BATICAMIGO · DESDE SEMPRE COM A COMUNIDADE</span></section>;
}

function Pillars() {
  return <section className="content-section pillars-section" id="pilares"><div className="section-topline"><span>O que nos move</span><span>As nossas áreas de impacto</span></div><SectionHeading eyebrow="Quatro pilares, um propósito" title={<>Um lugar para<br/><em>cada possibilidade.</em></>} description="Acreditamos que uma comunidade forte se constrói quando cada pessoa encontra espaço para participar, aprender e contribuir."/><div className="pillar-grid">{pillars.map((pillar) => <article className="pillar-card" key={pillar.number}><div className="pillar-card-top"><span>{pillar.number}</span><i className={`fa-solid ${pillar.icon}`} aria-hidden="true"/></div><h3>{pillar.title}</h3><p>{pillar.text}</p><a href="#contato" aria-label={`Saiba mais sobre ${pillar.title}`}>Saiba mais <span aria-hidden="true">↗</span></a></article>)}</div></section>;
}

function About() {
  return <section className="about-section" id="missao"><div className="about-image"><Image src="https://firebasestorage.googleapis.com/v0/b/baticamigo-c0384.firebasestorage.app/o/IMG_5233.jpg?alt=media&token=a2b54fb2-d08f-4cb9-9e1e-f7441c286615" alt="Atividade da comunidade BaticAmigo" width={1000} height={760} sizes="(max-width: 820px) 84vw, 40vw"/><span className="about-image-note">BaticAmigo — Associação</span></div><div className="about-copy"><span className="eyebrow">Quem somos</span><h2>Uma associação<br/>com <em>raízes e futuro.</em></h2><p className="about-lead">A BaticAmigo é uma associação sem fins lucrativos, criada para aproximar pessoas e abrir caminhos para uma vida comunitária mais ativa, inclusiva e solidária.</p><p>Trabalhamos lado a lado com membros, parceiros e voluntários, promovendo atividades nas áreas do desporto, cultura, educação e apoio social.</p><a className="inline-link" href="#contato">Fale connosco <span aria-hidden="true">↗</span></a></div></section>;
}

function DynamicSection({ id, eyebrow, title, description, containerId, searchId, searchPlaceholder, className = "" }) {
  return <section className={`content-section dynamic-section ${className}`} id={id}>
    <header className="collection-header">
      <div className="collection-heading-copy"><span className="eyebrow">{eyebrow}</span><SectionHeading eyebrow="" title={title} description={description}/></div>
      {searchId && <div className="collection-search-wrap">
        <label className="collection-search" htmlFor={searchId}>
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true"/>
          <input id={searchId} type="search" placeholder={searchPlaceholder} aria-label={searchPlaceholder} autoComplete="off" />
        </label>
      </div>}
    </header>
    <div className="dynamic-grid collection-grid" id={containerId} aria-live="polite"><div className="empty-state"><span className="empty-mark">✳</span><p>A carregar lista…</p></div></div>
  </section>;
}

function ContactSection() {
  return <section className="contact-section" id="contato"><div className="contact-intro"><span className="eyebrow eyebrow-light">Contacto</span><h2>Boas ideias<br/>começam com<br/><em>uma conversa.</em></h2><p>Quer saber mais, colaborar ou fazer parte? Estamos prontos para ouvir.</p><div className="contact-detail"><span className="detail-icon"><i className="fa-regular fa-envelope" aria-hidden="true"/></span><div><small>Escreva-nos</small><a href="mailto:info@baticamigo.pt">info@baticamigo.pt</a></div></div><div className="contact-detail"><span className="detail-icon"><i className="fa-solid fa-location-dot" aria-hidden="true"/></span><div><small>Visite-nos</small><span>Avenida Dr. Arlindo Vicente, Lote 370 A, loja 1</span></div></div><a className="social-link" href="https://www.instagram.com/aba2022cultura/" target="_blank" rel="noreferrer">Instagram <span aria-hidden="true">↗</span></a></div><div className="contact-form-panel"><div className="form-panel-heading"><span>Envie-nos uma mensagem</span><span className="form-asterisk">✳</span></div><ContactForm/></div></section>;
}

export default function HomePage() {
  return <><SiteHeader/><main><Hero/><About/><Pillars/>
    <DynamicSection id="eventos" eyebrow="Em comunidade" title={<>Acontece<br/><em>por aqui.</em></>} description="Encontros e atividades para viver em conjunto." containerId="events-container" searchId="eventos-search" searchPlaceholder="Pesquisar eventos"/>
    <DynamicSection id="programas" eyebrow="Novos caminhos" title={<>Ideias que<br/><em>ganham vida.</em></>} description="Iniciativas e programas da associação." containerId="programs-container" searchId="programas-search" searchPlaceholder="Pesquisar programas" className="soft-section"/>
    <DynamicSection id="agenda" eyebrow="Marque na agenda" title={<>O próximo encontro<br/><em>é consigo.</em></>} description="Atividades com data marcada." containerId="agenda-container" searchId="agenda-search" searchPlaceholder="Pesquisar agenda"/>
    <section className="community-section people-section" id="membros" aria-labelledby="members-title">
      <header className="community-intro"><span className="eyebrow">A comunidade</span><h2 id="members-title">Feita de<br/><em>pessoas.</em></h2></header>
      <div className="people-panel members-panel"><header className="panel-heading"><span className="panel-mark">Pessoas</span><h3>Quem faz parte</h3></header><div className="dynamic-grid people-grid" id="members-container" aria-live="polite"><div className="empty-state"><span className="empty-mark">✳</span><p>A carregar lista…</p></div></div></div>
    </section>
    <section className="community-section partner-section soft-section" id="parceiros" aria-labelledby="partners-title">
      <header className="community-intro"><span className="eyebrow">Juntos fazemos mais</span><h2 id="partners-title">Ligados por<br/><em>parcerias.</em></h2></header>
      <div className="people-panel partner-panel"><header className="panel-heading"><span className="panel-mark">Organizações</span><h3>Os nossos parceiros</h3></header><div className="dynamic-grid partner-grid" id="partners-container" aria-live="polite"><div className="empty-state"><span className="empty-mark">✳</span><p>A carregar lista…</p></div></div></div>
    </section>
    <DynamicSection id="noticias" eyebrow="Da associação" title={<>Da vida<br/><em>BaticAmigo.</em></>} description="Notícias e registos da associação." containerId="news-container" className="soft-section"/><ContactSection/></main><SiteFooter/><div id="gallery-modal" className="gallery-modal"><div className="modal-content"><button className="modal-close" aria-label="Fechar"><i className="fa-solid fa-xmark"/></button><button className="modal-prev" aria-label="Anterior"><i className="fa-solid fa-chevron-left"/></button><button className="modal-next" aria-label="Seguinte"><i className="fa-solid fa-chevron-right"/></button><div className="modal-media-container"/><p className="modal-caption"/></div></div><CollectionProgressiveReveal/><LegacyFirebaseScripts/></>;
}
