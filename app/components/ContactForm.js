import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";

export default function ContactForm() {
  return (
    <form id="contactForm" className="contact-form">
      <div className="form-grid">
        <Label>Nome<Input type="text" id="name" name="name" autoComplete="name" placeholder="O seu nome" required /><span id="name-error" className="form-error">Por favor, indique o seu nome.</span></Label>
        <Label>Email<Input type="email" id="email" name="email" autoComplete="email" placeholder="nome@email.com" required /><span id="email-error" className="form-error">Por favor, indique o seu email.</span><span id="email-format-error" className="form-error">Indique um email válido.</span></Label>
        <Label className="full-field">Assunto<Input type="text" id="subject" name="subject" placeholder="Como podemos ajudar?" required /><span id="subject-error" className="form-error">Indique o assunto.</span></Label>
        <Label className="full-field">Mensagem<Textarea id="message" name="message" rows="5" placeholder="Escreva a sua mensagem" required /><span id="message-error" className="form-error">Escreva a sua mensagem.</span></Label>
      </div>
      <div className="form-submit"><Button className="button button-primary" type="submit">Enviar mensagem <span aria-hidden="true">→</span></Button><span className="form-note">Respondemos assim que possível.</span></div>
      <div id="messageSuccess" className="form-success" role="status">Mensagem enviada com sucesso. Obrigado pelo contacto!</div>
      <div id="messageError" className="form-error" role="alert">Não foi possível enviar a mensagem. Tente novamente.</div>
    </form>
  );
}
