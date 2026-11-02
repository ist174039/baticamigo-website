"use client";

import { useState } from "react";
import { CalendarClock, Check, UserRoundPlus } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { NativeSelect } from "@/app/components/ui/native-select";
import { Sheet } from "@/app/components/ui/sheet";
import { Textarea } from "@/app/components/ui/textarea";

export default function SessionWorkspace({
  session, students, attendance, busy, manager, canManageAttendance, canStart, canComplete,
  dateTime, profileName, sessionNames, attendanceNames, recurrenceText,
  onClose, onStart, onComplete, onEdit, onAttendance, onAddStudent, onSaveComment, onSaveTutorAttendance,
}) {
  const [studentId, setStudentId] = useState("");
  const [tutorStatus, setTutorStatus] = useState(session?.tutorAttendance?.status || "");

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

  return <Sheet open ariaLabel={session.title || "Sessão"} className="platform-dialog platform-context-sheet" onOpenChange={open => { if (!open) onClose(); }}>
    <section className="platform-card platform-editor platform-session-workspace-detail">
      <div className="platform-list-heading">
        <div><p className="platform-eyebrow">Sessão · {sessionNames[session.status] || session.status}</p><h2>{session.title}</h2></div>
        <div className="platform-record-actions">
          {manager && session.status !== "in_progress" && session.status !== "completed" && <Button type="button" variant="outline" onClick={() => onEdit(session)}>Editar sessão</Button>}
          <Button type="button" variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </div>

      <div className="platform-session-workspace-actions">
        {canStart && session.status === "scheduled" && <Button type="button" className="platform-primary" disabled={busy} onClick={() => onStart(session)}><CalendarClock size={16}/> Entrar e iniciar sessão</Button>}
        {active && <span className="platform-status is-active"><Check size={14}/> Sessão em curso · presenças abertas</span>}
        {canComplete && active && <Button type="button" variant="outline" disabled={busy} onClick={() => onComplete(session)}>Terminar sessão</Button>}
      </div>

      <div className="platform-record-details platform-session-workspace-meta">
        <p><strong>Início:</strong> {dateTime(session.startsAt)}</p>
        <p><strong>Fim:</strong> {dateTime(session.endsAt)}</p>
        <p><strong>Explicador:</strong> {profileName(session.tutorId)}</p>
        <p><strong>Sala:</strong> {session.room || "Por definir"}</p>
        {session.recurrence && <p><strong>Repetição:</strong> {recurrenceText(session.recurrence)} · ocorrência {session.recurrence.occurrence} de {session.recurrence.total}</p>}
        {session.tutorAttendance && <p><strong>Presença do explicador:</strong> {session.tutorAttendance.status === "absent" ? "Falta registada" : session.tutorAttendance.status === "present" ? "Presente" : "Por registar"}{session.tutorAttendance.note ? ` · ${session.tutorAttendance.note}` : ""}</p>}
      </div>

      {canManageAttendance && hasStarted && <form className="platform-session-tutor-attendance" onSubmit={event => { event.preventDefault(); onSaveTutorAttendance(session, tutorStatus || String(new FormData(event.currentTarget).get("status")), String(new FormData(event.currentTarget).get("note") || "")); }}>
        <h3>Presença do explicador</h3>
        <div className="platform-session-tutor-attendance-fields">
          <label className="platform-field"><span>Estado</span><NativeSelect name="status" value={tutorStatus} onChange={event => setTutorStatus(event.target.value)} required><option value="" disabled>Selecionar estado</option><option value="present">Presente</option><option value="absent">Falta</option><option value="unrecorded">Por registar</option></NativeSelect></label>
          <label className="platform-field"><span>Nota ou motivo {tutorStatus === "absent" ? "(obrigatório)" : "(opcional)"}</span><Textarea name="note" maxLength={1200} rows={2} required={tutorStatus === "absent"} defaultValue={session.tutorAttendance?.note || ""} placeholder="Registe o motivo ou uma nota útil."/></label>
          <Button type="submit" className="platform-primary" disabled={busy || !tutorStatus}>Guardar presença do explicador</Button>
        </div>
      </form>}

      <section className="platform-session-workspace-participants" aria-labelledby="session-participants-title">
        <div className="platform-list-heading"><div><h3 id="session-participants-title">Alunos e presenças</h3><p>{participants.length} {participants.length === 1 ? "aluno associado" : "alunos associados"}</p></div></div>
        {participants.length ? <ul className="platform-attendance">{participants.map(({ id, name, attendance: record }) => <li key={id}><span>{name}</span><span className={`platform-status${record?.status === "present" ? " is-active" : record?.status === "absent" ? " is-overdue" : ""}`}>{attendanceNames[record?.status] || "Por registar"}</span>{canManageAttendance && canEditAttendance && <Button type="button" variant="outline" disabled={busy} onClick={() => onAttendance(session, id, name, record)}>{record ? "Alterar presença" : "Registar presença"}</Button>}</li>)}</ul> : <p className="platform-hint">Não há alunos associados a esta sessão.</p>}
        {canManageAttendance && active && availableStudents.length > 0 && <form className="platform-add-attendee" onSubmit={submitAddStudent}><h4><UserRoundPlus size={16}/> Adicionar aluno à sessão</h4><div><NativeSelect aria-label="Aluno a adicionar à sessão" value={studentId} onChange={event => setStudentId(event.target.value)}><option value="">Escolher aluno</option>{availableStudents.map(student => <option key={student.id} value={student.id}>{student.name}</option>)}</NativeSelect><Button type="submit" className="platform-primary" disabled={busy || !studentId}>Adicionar e marcar presente</Button></div><p>O aluno será associado à sessão e a presença ficará registada como presente.</p></form>}
      </section>

      {canManageAttendance && hasStarted && session.status !== "cancelled" && <form className="platform-session-comment" onSubmit={event => onSaveComment(event, session)}>
        <h3>Notas da sessão</h3>
        {session.comment && <p className="platform-session-last-note">{session.comment}{session.commentUpdatedAt && <small> · Atualizada {dateTime(session.commentUpdatedAt)}</small>}</p>}
        <label className="platform-field"><span>{session.comment ? "Atualizar nota" : "Registar nota"}</span><Textarea name="comment" maxLength={1600} rows={4} defaultValue={session.comment || ""} placeholder="O que foi trabalhado, ocorrências e próximos passos."/></label>
        <Button type="submit" className="platform-primary" disabled={busy}>Guardar notas da sessão</Button>
      </form>}
    </section>
  </Sheet>;
}
