"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Sheet } from "@/app/components/ui/sheet";

const stepLabels = ["Detalhes", "Participantes", "Revisão"];
const frequencyLabels = { none: "Não repetir", week: "Durante uma semana", month: "Durante um mês", year: "Durante um ano" };

function Field({ label, children }) {
  return <Label className="platform-field"><span>{label}</span>{children}</Label>;
}

function Choices({ label, name, options, initial = [], required = false }) {
  const [checked, setChecked] = useState(initial);
  return <fieldset className="platform-choices"><legend>{label}{required ? " *" : ""}</legend>{options.length ? <div className="platform-choice-list">{options.map((option, index) => <label className="platform-check" key={option.id}><Checkbox name={name} value={option.id} checked={checked.includes(option.id)} required={required && checked.length === 0 && index === 0} onChange={event => setChecked(event.target.checked ? [...checked, option.id] : checked.filter(id => id !== option.id))}/><span>{option.name}</span></label>)}</div> : <p className="platform-hint">Ainda não existem perfis disponíveis para associar.</p>}</fieldset>;
}

function SessionStepIndicator({ step }) {
  return <ol className="platform-session-stepper" aria-label="Etapas para criar uma sessão">
    {stepLabels.map((label, index) => <li key={label} className={step === index + 1 ? "is-current" : step > index + 1 ? "is-complete" : ""} aria-current={step === index + 1 ? "step" : undefined}><span>{index + 1}</span><small>{label}</small></li>)}
  </ol>;
}

export default function SessionEditor({ open, onOpenChange, editingSession, sessionDraftStart, sessionFrequency, setSessionFrequency, selectedSessionWeekdays, setSelectedSessionWeekdays, tutors, students, busy, onSubmit, onClose, lisbonDateTimeInput, addLocalHours }) {
  const formRef = useRef(null);
  const [step, setStep] = useState(1);
  const [stepError, setStepError] = useState("");
  const [review, setReview] = useState(null);
  const isCreating = !editingSession;

  useEffect(() => {
    if (open) {
      setStep(1);
      setStepError("");
      setReview(null);
    }
  }, [open, editingSession?.id, sessionDraftStart]);

  function continueStep() {
    setStepError("");
    const activeSection = formRef.current?.querySelector(`[data-session-step="${step}"]`);
    const requiredFields = [...(activeSection?.querySelectorAll("[required]") || [])];
    const invalidField = requiredFields.find(field => !field.checkValidity());
    if (invalidField) {
      invalidField.reportValidity();
      return;
    }
    const data = new FormData(formRef.current);
    if (step === 1 && String(data.get("endsAt")) <= String(data.get("startsAt"))) {
      setStepError("A hora de fim tem de ser posterior à hora de início.");
      return;
    }
    if (step === 2 && sessionFrequency !== "none" && !selectedSessionWeekdays.length) {
      setStepError("Escolha pelo menos um dia da semana para repetir a sessão.");
      return;
    }
    if (step === 2) {
      setReview({
        title: String(data.get("title") || ""),
        room: String(data.get("room") || "").trim(),
        startsAt: String(data.get("startsAt") || ""),
        endsAt: String(data.get("endsAt") || ""),
        tutor: tutors.find(profile => profile.id === data.get("tutorId"))?.name || "—",
        students: students.filter(profile => data.getAll("studentIds").includes(profile.id)).map(profile => profile.name),
        frequency: frequencyLabels[sessionFrequency] || frequencyLabels.none,
        weekdays: selectedSessionWeekdays.map(value => ["", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"][value]).join(", "),
      });
    }
    setStep(current => Math.min(3, current + 1));
  }

  return <Sheet open={open} onOpenChange={onOpenChange} ariaLabel={editingSession ? `Editar sessão ${editingSession.title}` : "Agendar sessão"} className="platform-dialog">
    <section className="platform-card platform-editor platform-session-editor">
      <div className="platform-list-heading"><div><p className="platform-eyebrow">Agenda de acompanhamento</p><h2>{editingSession ? `Editar sessão: ${editingSession.title}` : "Nova sessão"}</h2></div><Button type="button" variant="outline" onClick={onClose}>Fechar</Button></div>
      {!editingSession && <SessionStepIndicator step={step} />}
      {(!tutors.some(profile => profile.active) || !students.some(profile => profile.active)) && <p className="platform-error">Adicione primeiro pelo menos um aluno e um explicador ativos em Pessoas.</p>}
      {stepError && <p className="platform-error" role="alert">{stepError}</p>}
      <form ref={formRef} key={`${editingSession?.id || "new-session"}:${sessionDraftStart}`} noValidate onSubmit={onSubmit}>
        <fieldset disabled={busy}>
          <section className="platform-session-form-section" data-session-step="1" hidden={isCreating && step !== 1}>
            <h3>Detalhes e horário</h3>
            <Field label="Título da sessão"><Input name="title" required maxLength={120} placeholder="Ex.: Apoio a Matemática" defaultValue={editingSession?.title}/></Field>
            <Field label="Sala ou ligação"><Input name="room" maxLength={200} placeholder="Sala, endereço ou ligação da reunião" defaultValue={editingSession?.room}/></Field>
            <div className="platform-session-time-fields"><Field label="Começa"><Input name="startsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.startsAt) : sessionDraftStart || undefined}/></Field><Field label="Termina"><Input name="endsAt" type="datetime-local" required defaultValue={editingSession ? lisbonDateTimeInput(editingSession.endsAt) : sessionDraftStart ? addLocalHours(sessionDraftStart, 1) : undefined}/></Field></div>
            <p className="platform-hint">Horários no fuso de Lisboa. A duração é definida pela hora de início e fim.</p>
          </section>
          <section className="platform-session-form-section" data-session-step="2" hidden={isCreating && step !== 2}>
            <h3>Participantes</h3>
            <Field label="Explicador / organizador"><NativeSelect name="tutorId" required defaultValue={editingSession?.tutorId || ""}><option value="" disabled>Selecionar explicador</option>{tutors.filter(profile => profile.active || profile.id === editingSession?.tutorId).map(profile => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</NativeSelect></Field>
            <Choices label="Alunos convidados" name="studentIds" required options={students.filter(profile => profile.active || editingSession?.studentIds.includes(profile.id))} initial={editingSession?.studentIds || []}/>
            {!editingSession && <section className="platform-session-recurrence"><h3>Repetição</h3><Field label="Repetir"><NativeSelect name="frequency" value={sessionFrequency} onChange={event => setSessionFrequency(event.target.value)}><option value="none">Não repetir</option><option value="week">Durante uma semana</option><option value="month">Durante um mês</option><option value="year">Durante um ano</option></NativeSelect></Field>{sessionFrequency !== "none" && <><fieldset className="platform-weekday-picker"><legend>Repetir nos dias</legend><div>{[{value:1,label:"Segunda"},{value:2,label:"Terça"},{value:3,label:"Quarta"},{value:4,label:"Quinta"},{value:5,label:"Sexta"},{value:6,label:"Sábado"},{value:7,label:"Domingo"}].map(day => <label key={day.value}><Checkbox name="weekdays" value={day.value} checked={selectedSessionWeekdays.includes(day.value)} onChange={event => setSelectedSessionWeekdays(current => event.target.checked ? [...current, day.value].sort((a, b) => a - b) : current.filter(value => value !== day.value))}/><span>{day.label}</span></label>)}</div></fieldset><p className="platform-hint">A sessão será repetida nos dias e durante o período escolhidos.</p></>}</section>}
            {editingSession && <Field label="Estado da sessão"><NativeSelect name="status" defaultValue={editingSession.status}><option value="scheduled">Agendada</option><option value="cancelled">Cancelada</option></NativeSelect></Field>}
          </section>
          {!editingSession && <section className="platform-session-form-section platform-session-review" hidden={step !== 3} aria-labelledby="platform-session-review-title"><h3 id="platform-session-review-title">Confirme a sessão</h3>{review && <dl><div><dt>Título</dt><dd>{review.title}</dd></div><div><dt>Data e hora</dt><dd>{review.startsAt.replace("T", " · ")}–{review.endsAt.slice(11)}</dd></div><div><dt>Explicador</dt><dd>{review.tutor}</dd></div><div><dt>Alunos</dt><dd>{review.students.join(", ")}</dd></div>{review.room && <div><dt>Sala ou ligação</dt><dd>{review.room}</dd></div>}<div><dt>Repetição</dt><dd>{review.frequency}{review.weekdays ? ` · ${review.weekdays}` : ""}</dd></div></dl>}</section>}
          <div className="platform-actions">
            {isCreating && step > 1 && <Button type="button" variant="outline" onClick={() => { setStepError(""); setStep(current => current - 1); }}>Voltar</Button>}
            {isCreating && step < 3 && <Button type="button" className="platform-primary" onClick={continueStep}>Continuar</Button>}
            {(!isCreating || step === 3) && <Button type="submit" className="platform-primary">{busy ? "A guardar…" : editingSession ? "Guardar alterações" : sessionFrequency === "none" ? "Agendar sessão" : "Agendar sessões"}</Button>}
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </fieldset>
      </form>
    </section>
  </Sheet>;
}
