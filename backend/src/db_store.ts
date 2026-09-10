// FluentWave Persistent SQLite Database Repository
// Stores all users, students, assessments, documents, and audit logs to fluentwave.sqlite

import { sqlite } from './sqlite_db';
import { 
  Student, 
  StudentStatus, 
  ALLOWED_STUDENT_TRANSITIONS, 
  Assessment, 
  DocumentItem, 
  CaseEvent,
  UserAccount
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export class PersistentDatabaseStore {

  // USERS
  public saveUser(user: UserAccount): void {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO users (id, email, phone, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(user.id, user.email, user.phone, user.passwordHash, user.role, user.createdAt.toISOString());
  }

  public findUserByEmailOrPhone(identifier: string): UserAccount | null {
    const row = sqlite.prepare(`
      SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR phone = ?
    `).get(identifier, identifier) as any;

    if (!row) return null;
    return {
      id: row.id,
      email: row.email,
      phone: row.phone,
      passwordHash: row.password_hash,
      role: row.role,
      createdAt: new Date(row.created_at)
    };
  }

  // STUDENTS
  public saveStudent(s: Student): void {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO students 
      (id, first_name, last_name, phone, email, nationality, current_country, target_country, target_program_level, budget_currency, budget_max_annual, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      s.id, s.firstName, s.lastName, s.phone, s.email || null, s.nationality, s.currentCountry,
      s.targetCountry, s.targetProgramLevel, s.budgetCurrency, s.budgetMaxAnnual, s.status,
      s.createdAt.toISOString(), s.updatedAt.toISOString()
    );
  }

  public getStudent(id: string): Student | null {
    const row = sqlite.prepare(`SELECT * FROM students WHERE id = ?`).get(id) as any;
    if (!row) return null;
    return {
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      nationality: row.nationality,
      currentCountry: row.current_country,
      targetCountry: row.target_country,
      targetProgramLevel: row.target_program_level,
      budgetCurrency: row.budget_currency,
      budgetMaxAnnual: row.budget_max_annual,
      status: row.status as StudentStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  public getAllStudents(): Student[] {
    const rows = sqlite.prepare(`SELECT * FROM students ORDER BY created_at DESC`).all() as any[];
    return rows.map(row => ({
      id: row.id,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      email: row.email,
      nationality: row.nationality,
      currentCountry: row.current_country,
      targetCountry: row.target_country,
      targetProgramLevel: row.target_program_level,
      budgetCurrency: row.budget_currency,
      budgetMaxAnnual: row.budget_max_annual,
      status: row.status as StudentStatus,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }));
  }

  // ASSESSMENTS
  public saveAssessment(a: Assessment): void {
    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO assessments
      (id, student_id, language_signals, academic_signals, intent_signals, readiness_score, rubric_breakdown, ai_confidence, requires_human_gate, evaluated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      a.id, a.studentId, JSON.stringify(a.languageSignals), JSON.stringify(a.academicSignals),
      JSON.stringify(a.intentSignals), a.readinessScore, JSON.stringify(a.rubricBreakdown),
      a.aiConfidence, a.requiresHumanGate ? 1 : 0, a.evaluatedAt.toISOString()
    );
  }

  public getAssessment(studentId: string): Assessment | null {
    const row = sqlite.prepare(`SELECT * FROM assessments WHERE student_id = ?`).get(studentId) as any;
    if (!row) return null;
    return {
      id: row.id,
      studentId: row.student_id,
      languageSignals: JSON.parse(row.language_signals || '{}'),
      academicSignals: JSON.parse(row.academic_signals || '{}'),
      intentSignals: JSON.parse(row.intent_signals || '{}'),
      readinessScore: row.readiness_score,
      rubricBreakdown: JSON.parse(row.rubric_breakdown || '{}'),
      aiConfidence: row.ai_confidence,
      requiresHumanGate: row.requires_human_gate === 1,
      evaluatedAt: new Date(row.evaluated_at)
    };
  }

  // DOCUMENTS
  public initializeChecklist(studentId: string): DocumentItem[] {
    const defaultDocs: DocumentItem[] = [
      { id: uuidv4(), studentId, docType: 'PASSPORT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'DIPLOMA_CERTIFICATE', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'TRANSCRIPT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'PHOTO', state: 'REQUESTED' }
    ];

    const stmt = sqlite.prepare(`
      INSERT OR REPLACE INTO documents (id, student_id, doc_type, state, file_url)
      VALUES (?, ?, ?, ?, ?)
    `);
    defaultDocs.forEach(d => stmt.run(d.id, d.studentId, d.docType, d.state, d.fileUrl || null));

    return defaultDocs;
  }

  public getDocuments(studentId: string): DocumentItem[] {
    const rows = sqlite.prepare(`SELECT * FROM documents WHERE student_id = ?`).all(studentId) as any[];
    return rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      docType: r.doc_type,
      state: r.state,
      fileUrl: r.file_url,
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at) : undefined
    }));
  }

  public updateDocument(docId: string, state: string, fileUrl: string): void {
    const stmt = sqlite.prepare(`
      UPDATE documents SET state = ?, file_url = ?, uploaded_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(state, fileUrl, docId);
  }

  // AUDIT CASE EVENTS (Append-Only)
  public logEvent(
    caseId: string, 
    eventType: string, 
    fromState: string | undefined, 
    toState: string | undefined, 
    payload: Record<string, any>,
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string
  ): CaseEvent {
    const stmt = sqlite.prepare(`
      INSERT INTO case_events (case_id, actor_id, actor_type, event_type, from_state, to_state, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(caseId, actorId || null, actorType, eventType, fromState || null, toState || null, JSON.stringify(payload));
    
    return {
      id: Number(info.lastInsertRowid),
      caseId,
      actorId,
      actorType,
      eventType,
      fromState,
      toState,
      payload,
      createdAt: new Date()
    };
  }

  public getEvents(caseId: string): CaseEvent[] {
    const rows = sqlite.prepare(`SELECT * FROM case_events WHERE case_id = ? ORDER BY id ASC`).all(caseId) as any[];
    return rows.map(r => ({
      id: r.id,
      caseId: r.case_id,
      actorId: r.actor_id,
      actorType: r.actor_type,
      eventType: r.event_type,
      fromState: r.from_state,
      toState: r.to_state,
      payload: JSON.parse(r.payload || '{}'),
      createdAt: new Date(r.created_at)
    }));
  }

  // STATE MACHINE TRANSITION WITH AUDIT
  public transitionStudent(
    studentId: string, 
    nextState: StudentStatus, 
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string,
    evidencePayload: Record<string, any> = {}
  ): Student {
    const student = this.getStudent(studentId);
    if (!student) {
      throw new StateMachineError(`Student with ID ${studentId} not found.`);
    }

    const currentState = student.status;
    const allowed = ALLOWED_STUDENT_TRANSITIONS[currentState];

    if (!allowed.includes(nextState)) {
      throw new StateMachineError(
        `Invalid state transition: Cannot transition student from '${currentState}' to '${nextState}'. Allowed next states: [${allowed.join(', ')}]`
      );
    }

    student.status = nextState;
    student.updatedAt = new Date();
    this.saveStudent(student);

    this.logEvent(
      studentId, 
      `STUDENT_STATUS_CHANGED`, 
      currentState, 
      nextState, 
      evidencePayload, 
      actorType, 
      actorId
    );

    return student;
  }
}

export const dbStore = new PersistentDatabaseStore();
