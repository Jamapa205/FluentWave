import { pool } from './db';
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

export class PostgresDatabaseStore {

  // USERS
  public async saveUser(user: UserAccount): Promise<void> {
    await pool.query(`
      INSERT INTO users (id, email, phone, password_hash, role, created_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET 
        email = EXCLUDED.email, 
        phone = EXCLUDED.phone, 
        password_hash = EXCLUDED.password_hash, 
        role = EXCLUDED.role;
    `, [user.id, user.email, user.phone, user.passwordHash, user.role, user.createdAt]);
  }

  public async findUserByEmailOrPhone(identifier: string): Promise<UserAccount | null> {
    const res = await pool.query(`
      SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR phone = $2
    `, [identifier, identifier]);

    const row = res.rows[0];
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
  public async saveStudent(s: Student): Promise<void> {
    await pool.query(`
      INSERT INTO students 
      (id, first_name, last_name, phone, email, nationality, current_country, target_country, target_program_level, budget_currency, budget_max_annual, status, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        nationality = EXCLUDED.nationality,
        current_country = EXCLUDED.current_country,
        target_country = EXCLUDED.target_country,
        target_program_level = EXCLUDED.target_program_level,
        budget_currency = EXCLUDED.budget_currency,
        budget_max_annual = EXCLUDED.budget_max_annual,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at;
    `, [
      s.id, s.firstName, s.lastName, s.phone, s.email || null, s.nationality, s.currentCountry,
      s.targetCountry, s.targetProgramLevel, s.budgetCurrency, s.budgetMaxAnnual, s.status,
      s.createdAt, s.updatedAt
    ]);
  }

  public async getStudent(id: string): Promise<Student | null> {
    const res = await pool.query(`SELECT * FROM students WHERE id = $1`, [id]);
    const row = res.rows[0];
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

  public async getAllStudents(): Promise<Student[]> {
    const res = await pool.query(`SELECT * FROM students ORDER BY created_at DESC`);
    return res.rows.map(row => ({
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
  public async saveAssessment(a: Assessment): Promise<void> {
    await pool.query(`
      INSERT INTO assessments
      (id, student_id, language_signals, academic_signals, intent_signals, readiness_score, rubric_breakdown, ai_confidence, requires_human_gate, evaluated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        readiness_score = EXCLUDED.readiness_score,
        rubric_breakdown = EXCLUDED.rubric_breakdown,
        ai_confidence = EXCLUDED.ai_confidence,
        evaluated_at = EXCLUDED.evaluated_at;
    `, [
      a.id, a.studentId, a.languageSignals, a.academicSignals,
      a.intentSignals, a.readinessScore, a.rubricBreakdown,
      a.aiConfidence, a.requiresHumanGate, a.evaluatedAt
    ]);
  }

  public async getAssessment(studentId: string): Promise<Assessment | null> {
    const res = await pool.query(`SELECT * FROM assessments WHERE student_id = $1`, [studentId]);
    const row = res.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      studentId: row.student_id,
      languageSignals: row.language_signals,
      academicSignals: row.academic_signals,
      intentSignals: row.intent_signals,
      readinessScore: Number(row.readiness_score),
      rubricBreakdown: row.rubric_breakdown,
      aiConfidence: Number(row.ai_confidence),
      requiresHumanGate: row.requires_human_gate,
      evaluatedAt: new Date(row.evaluated_at)
    };
  }

  // DOCUMENTS
  public async initializeChecklist(studentId: string): Promise<DocumentItem[]> {
    const defaultDocs: DocumentItem[] = [
      { id: uuidv4(), studentId, docType: 'PASSPORT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'DIPLOMA_CERTIFICATE', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'TRANSCRIPT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'PHOTO', state: 'REQUESTED' }
    ];

    for (const d of defaultDocs) {
      await pool.query(`
        INSERT INTO documents (id, student_id, doc_type, state, file_url)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING;
      `, [d.id, d.studentId, d.docType, d.state, d.fileUrl || null]);
    }

    return defaultDocs;
  }

  public async getDocuments(studentId: string): Promise<DocumentItem[]> {
    const res = await pool.query(`SELECT * FROM documents WHERE student_id = $1`, [studentId]);
    return res.rows.map(r => ({
      id: r.id,
      studentId: r.student_id,
      docType: r.doc_type,
      state: r.state,
      fileUrl: r.file_url,
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at) : undefined
    }));
  }

  public async updateDocument(docId: string, state: string, fileUrl: string): Promise<void> {
    await pool.query(`
      UPDATE documents SET state = $1, file_url = $2, uploaded_at = CURRENT_TIMESTAMP WHERE id = $3
    `, [state, fileUrl, docId]);
  }

  // AUDIT CASE EVENTS (Append-Only)
  public async logEvent(
    caseId: string, 
    eventType: string, 
    fromState: string | undefined, 
    toState: string | undefined, 
    payload: Record<string, any>,
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string
  ): Promise<CaseEvent> {
    const res = await pool.query(`
      INSERT INTO case_events (case_id, actor_id, actor_type, event_type, from_state, to_state, payload)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [caseId, actorId || null, actorType, eventType, fromState || null, toState || null, payload]);
    
    const row = res.rows[0];
    return {
      id: Number(row.id),
      caseId: row.case_id,
      actorId: row.actor_id,
      actorType: row.actor_type,
      eventType: row.event_type,
      fromState: row.from_state,
      toState: row.to_state,
      payload: row.payload,
      createdAt: new Date(row.created_at)
    };
  }

  public async getEvents(caseId: string): Promise<CaseEvent[]> {
    const res = await pool.query(`SELECT * FROM case_events WHERE case_id = $1 ORDER BY id ASC`, [caseId]);
    return res.rows.map(r => ({
      id: Number(r.id),
      caseId: r.case_id,
      actorId: r.actor_id,
      actorType: r.actor_type,
      eventType: r.event_type,
      fromState: r.from_state,
      toState: r.to_state,
      payload: r.payload,
      createdAt: new Date(r.created_at)
    }));
  }

  // STATE MACHINE TRANSITION WITH AUDIT
  public async transitionStudent(
    studentId: string, 
    nextState: StudentStatus, 
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string,
    evidencePayload: Record<string, any> = {}
  ): Promise<Student> {
    const student = await this.getStudent(studentId);
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
    await this.saveStudent(student);

    await this.logEvent(
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

export const dbStore = new PostgresDatabaseStore();
