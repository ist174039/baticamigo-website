"use client";

import { useState } from "react";
import { CalendarClock, Check, UserRoundPlus, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { NativeSelect } from "@/app/components/ui/native-select";
import { SearchableSelect } from "@/app/components/ui/searchable-select";
import { Sheet } from "@/app/components/ui/sheet";
import { Textarea } from "@/app/components/ui/textarea";
import { Tabs } from "@/app/components/ui/tabs";
import { Dialog } from "@/app/components/ui/dialog";

export default function SessionWorkspace({
  session, students, attendance, busy, manager, canManageAttendance, canStart, canComplete,
  canDeleteSession, hasSeries, dateTime, profileName, sessionNames, attendanceNames, recurrenceText,
  onClose, onStart, onComplete, onEdit, onAttendance, onAddStudent, onSaveComment, onSaveTutorAttendance, onDeleteSession,
}) {
  const [studentId, setStudentId] = useState("");
  const [tutorStatus, setTutorStatus] = useState(session?.tutorAttendance?.status || "");
  const [activeTab, setActiveTab] = useState("info");
  const [deleteScope, setDeleteScope] = useState(null);

  if (!session) return null;
  const participants = session.studentIds.map(id => ({
    id,
    name: profileName(id),
    attendance: attendance.find(record => record.sessionId === session.id && record.studentId === id),
  }));
  const assigned = new Set(session.studentIds);
  const availableStudents = students.filter(student => student.active && !assigned.has(student.id));
  const active = session.status === "in_progress" || session.status === "scheduled" && session.attendanceOpen === true;
  const hasStarted = active || session.status === "completed";
  const canEditAttendance = active || manager && session.status === "completed";

  function submitAddStudent(event) {
    event.preventDefault();
    if (!studentId) return;
    onAddStudent(session.id, studentId);
    setStudentId("");
  }

  function confirmDelete() {
    if (!deleteScope || !onDeleteSession) return;
    onDeleteSession(session, deleteScope);
    setDeleteScope(null);
  }

  const infoPanel = <div className="platform-session-workspace-panel">
    <div className="platform-session-workspace-actions">
      {canStart && session.status === "scheduled" && <Button type="button" className="platform-primary" disabled={busy} onClick={() => onStart(session)}><CalendarClock size={16}/> Entrar e iniciar sessão</Button>}
      {active && <span className="platform-status is-active"><Check size={14}/> Sessão em curso · presenças abertas</span>}
      {canComplete && active && <Button type="button" variant="outline" disabled={busy} onClick={() => onComplete(session)}>Terminar sessão</Button>}
    </div>

    <dl className="platform-session-workspace-meta">
      <div><dt>Início</dt><dd>{dateTime(session.startsAt)}</dd></div>
      <div><dt>Fim</dt><dd>{dateTime(session.endsAt)}</dd></div>
      <div><dt>Explicador</dt><dd>{profileName(session.tutorId)}</dd></div>
      <div><dt>Sala</dt><dd>{session.room || "Por definir"}</dd></div>
      {session.recurrence && <div className="platform-session-workspace-recurrence"><dt>Repetição</dt><dd>{recurrenceText(session.recurrence)} · ocorrência {session.recurrence.occurrence} de {session.recurrence.total}</dd></div>}
    </dl>

    {canManageAttendance && hasStarted && session.status !== "cancelled" && session.status !== "postponed" && <form className="platform-session-comment" onSubmit={event => onSaveComment(event, session)}>
      <h3>Notas da sessão</h3>
      {session.comment && <p className="platform-session-last-note">{session.comment}{session.commentUpdatedAt && <small> · Atualizada {dateTime(session.commentUpdatedAt)}</small>}</p>}
      <label className="platform-field"><span>{session.comment ? "Atualizar nota" : "Registar nota"}</span><Textarea name="comment" maxLength={1600} rows={4} defaultValue={session.comment || ""} placeholder="O que foi trabalhado, ocorrências e próximos passos."/></label>
      <Button type="submit" className="platform-primary" disabled={busy}>Guardar notas da sessão</Button>
    </form>}
    {canManageAttendance && !hasStarted && session.status === "scheduled" && <p className="platform-hint">As notas ficam disponíveis depois de iniciar a sessão.</p>}
  </div>;

  const attendancePanel = <div className="platform-session-workspace-panel">
    {!hasStarted && session.status === "scheduled" && <p className="platform-hint">Inicie a sessão para registar presenças e faltas.</p>}
    {session.tutorAttendance && <p className="platform-session-tutor-summary"><strong>Presença do explicador:</strong> {session.tutorAttendance.status === "absent" ? "Falta registada" : session.tutorAttendance.status === "present" ? "Presente" : "Por registar"}{session.tutorAttendance.note ? ` · ${session.tutorAttendance.note}` : ""}</p>}
    {canManageAttendance && hasStarted && session.status !== "cancelled" && session.status !== "postponed" && <form className="platform-session-tutor-attendance" onSubmit={event => { event.preventDefault(); onSaveTutorAttendance(session, tutorStatus || String(new FormData(event.currentTarget).get("status")), String(new FormData(event.currentTarget).get("note") || "")); }}>
      <h3>Presença do explicador</h3>
      <div className="platform-session-tutor-attendance-fields">
        <label className="platform-field"><span>Estado</span><NativeSelect name="status" value={tutorStatus} onChange={event => setTutorStatus(event.target.value)} required><option value="" disabled>Selecionar estado</option><option value="present">Presente</option><option value="absent">Falta</option><option value="unrecorded">Por registar</option></NativeSelect></label>
        <label className="platform-field"><span>Nota ou motivo {tutorStatus === "absent" ? "(obrigatório)" : "(opcional)"}</span><Textarea name="note" maxLength={1200} rows={2} required={tutorStatus === "absent"} defaultValue={session.tutorAttendance?.note || ""} placeholder="Registe o motivo ou uma nota útil."/></label>
        <Button type="submit" className="platform-primary" disabled={busy || !tutorStatus}>Guardar presença do explicador</Button>
      </div>
    </form>}

    <section className="platform-session-workspace-participants" aria-labelledby="session-participants-title">
      <div className="platform-list-heading"><div><h3 id="session-participants-title">Alunos convidados e presenças</h3><p>{participants.length} {participants.length === 1 ? "aluno associado" : "alunos associados"}</p></div></div>
      {participants.length ? <ul className="platform-attendance">{participants.map(({ id, name, attendance: record }) => <li key={id}><span className="platform-session-attendee-name">{name}{record?.source === "walk_in" && <small>Compareceu sem convite</small>}</span><span className={`platform-status${record?.status === "present" ? " is-active" : record?.status === "absent" ? " is-overdue" : ""}`}>{attendanceNames[record?.status] || "Por registar"}</span>{canManageAttendance && canEditAttendance && <Button type="button" variant="outline" disabled={busy} onClick={() => onAttendance(session, id, name, record)}>{record ? "Alterar presença" : "Registar presença"}</Button>}</li>)}</ul> : <p className="platform-hint">Não há alunos associados a esta sessão.</p>}
      {canManageAttendance && active && availableStudents.length > 0 && <form className="platform-add-attendee" onSubmit={submitAddStudent}><h4><UserRoundPlus size={16}/> Adicionar aluno que compareceu sem convite</h4><div><SearchableSelect ariaLabel="Pesquisar aluno não convidado que compareceu" placeholder="Pesquisar aluno" value={studentId} onChange={setStudentId} options={availableStudents.map(student=>({value:student.id,label:student.name,description:student.schoolYear||"Aluno"}))}/><Button type="submit" className="platform-primary" disabled={busy || !studentId}>Adicionar e marcar presente</Button></div><p>O aluno fica associado a esta sessão e a presença fica registada como presente. Pode depois alterar o registo se necessário.</p></form>}
    </section>
  </div>;

  return <Sheet open ariaLabel={session.title || "Sessão"} className="platform-dialog platform-context-sheet platform-session-workspace-sheet" onOpenChange={open => { if (!open) onClose(); }}>
    <section className="platform-session-workspace-detail">
      <header className="platform-session-workspace-header">
        <div className="platform-session-workspace-heading">
          <div><p className="platform-eyebrow"><span>Sessão</span><span aria-hidden="true">·</span><span className={`platform-session-workspace-status is-${session.status}`}>{sessionNames[session.status] || session.status}</span></p><h2>{session.title}</h2></div>
          <Button type="button" variant="outline" className="platform-session-workspace-close" aria-label="Fechar detalhes da sessão" onClick={onClose}><X size={17}/></Button>
        </div>
        <div className="platform-record-actions platform-session-workspace-top-actions">
          {manager && session.status !== "in_progress" && session.status !== "completed" && <Button type="button" variant="outline" onClick={() => onEdit(session)}>Editar sessão</Button>}
          {canDeleteSession && <Button type="button" variant="destructive" disabled={busy} onClick={() => setDeleteScope("single")}>Apagar sessão</Button>}
          {canDeleteSession && hasSeries && <Button type="button" variant="destructive" disabled={busy} onClick={() => setDeleteScope("series")}>Apagar todas as ocorrências</Button>}
        </div>
      </header>
      <Tabs tabs={[{ value: "info", label: "Informações da sessão", content: infoPanel }, { value: "attendance", label: "Presenças", content: attendancePanel }]} value={activeTab} onValueChange={setActiveTab} ariaLabel="Detalhes da sessão"/>
    </section>
    <Dialog open={!!deleteScope} onOpenChange={open => { if (!open && !busy) setDeleteScope(null); }} ariaLabel={deleteScope === "series" ? "Confirmar eliminação das ocorrências" : "Confirmar eliminação da sessão"} className="platform-dialog platform-session-delete-confirm">
      <section className="platform-card platform-editor">
        <p className="platform-eyebrow">Ação irreversível</p>
        <h2>{deleteScope === "series" ? "Apagar todas as ocorrências?" : "Apagar esta sessão?"}</h2>
        <p>{deleteScope === "series" ? `Serão apagadas todas as ${session.recurrence?.total || ""} ocorrências da série “${session.title}”, se não tiverem presenças nem outros dados associados.` : `A sessão “${session.title}” será apagada se não tiver presenças nem outros dados associados.`}</p>
        <p className="platform-hint">Se existirem registos associados, a operação será bloqueada para preservar o histórico.</p>
        <div className="platform-actions"><Button type="button" variant="destructive" disabled={busy} onClick={confirmDelete}>{busy ? "A apagar…" : deleteScope === "series" ? "Confirmar eliminação da série" : "Confirmar eliminação"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setDeleteScope(null)}>Cancelar</Button></div>
      </section>
    </Dialog>
  </Sheet>;
}
