// In-Memory Event-Driven Repository & State Machine Engine
// Implements Workbook Sheet 6 & Sheet 7 Exception & State Transition Logic

import { 
  Student, 
  StudentStatus, 
  ALLOWED_STUDENT_TRANSITIONS, 
  Assessment, 
  DocumentItem, 
  CaseEvent 
} from './types';
import { v4 as uuidv4 } from 'uuid';

export class StateMachineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StateMachineError';
  }
}

export class InMemoryStore {
  public students: Map<string, Student> = new Map();
  public assessments: Map<string, Assessment> = new Map();
  public documents: Map<string, DocumentItem[]> = new Map();
  public caseEvents: CaseEvent[] = [];
  private eventSeq = 1;

  // Append-only event logger (Matches database case_events table)
  public logEvent(
    caseId: string, 
    eventType: string, 
    fromState: string | undefined, 
    toState: string | undefined, 
    payload: Record<string, any>,
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string
  ): CaseEvent {
    const event: CaseEvent = {
      id: this.eventSeq++,
      caseId,
      actorId,
      actorType,
      eventType,
      fromState,
      toState,
      payload,
      createdAt: new Date()
    };
    this.caseEvents.push(event);
    return event;
  }

  // Transition Student State with Validation & Audit Trail
  public transitionStudent(
    studentId: string, 
    nextState: StudentStatus, 
    actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM' = 'SYSTEM',
    actorId?: string,
    evidencePayload: Record<string, any> = {}
  ): Student {
    const student = this.students.get(studentId);
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

  // Initialize Default Checklist for Student (Phase 2)
  public initializeChecklist(studentId: string): DocumentItem[] {
    const defaultDocs: DocumentItem[] = [
      { id: uuidv4(), studentId, docType: 'PASSPORT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'DIPLOMA_CERTIFICATE', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'TRANSCRIPT', state: 'REQUESTED' },
      { id: uuidv4(), studentId, docType: 'PHOTO', state: 'REQUESTED' }
    ];
    this.documents.set(studentId, defaultDocs);
    return defaultDocs;
  }
}

export const store = new InMemoryStore();
