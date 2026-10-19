export default function ContactForm() {
  return (
    <form id="contactForm" className="contact-form">
      <div className="form-grid">
        <label>Nome<input type="text" id="name" name="name" autoComplete="name" placeholder="O seu nome" required /><span id="name-error" className="form-error">Por favor, indique o seu nome.</span></label>
        <label>Email<input type="email" id="email" name="email" autoComplete="email" placeholder="nome@email.com" required /><span id="email-error" className="form-error">Por favor, indique o seu email.</span><span id="email-format-error" className="form-error">Indique um email válido.</span></label>
        <label className="full-field">Assunto<input type="text" id="subject" name="subject" placeholder="Como podemos ajudar?" required /><span id="subject-error" className="form-error">Indique o assunto.</span></label>
        <label className="full-field">Mensagem<textarea id="message" name="message" rows="5" placeholder="Escreva a sua mensagem" required /><span id="message-error" className="form-error">Escreva a sua mensagem.</span></label>
      </div>
      <div className="form-submit"><button className="button button-primary" type="submit">Enviar mensagem <span aria-hidden="true">→</span></button><span className="form-note">Respondemos assim que possível.</span></div>
      <div id="messageSuccess" className="form-success" role="status">Mensagem enviada com sucesso. Obrigado pelo contacto!</div>
      <div id="messageError" className="form-error" role="alert">Não foi possível enviar a mensagem. Tente novamente.</div>
    </form>
  );
}
