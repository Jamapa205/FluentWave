// FluentWave State Machine & Domain Type Definitions
// Derived from FluentWave PRD V1 & Build Control Workbook Sheet 6

export type UserRole = 'STUDENT' | 'PARENT' | 'AGENT' | 'REVIEWER' | 'PARTNER_REP' | 'ADMIN';

export type StudentStatus = 
  | 'LEAD'
  | 'INTAKE'
  | 'ASSESSMENT'
  | 'DOCS_PENDING'
  | 'DOCS_REVIEW'
  | 'HUMAN_REVIEW'
  | 'APPROVED'
  | 'ROUTED'
  | 'APPLICATION_ACTIVE'
  | 'COMPLETED'
  | 'WITHDRAWN'
  | 'ESCALATED';

export type DocumentType = 
  | 'PASSPORT'
  | 'DIPLOMA_CERTIFICATE'
  | 'TRANSCRIPT'
  | 'PHOTO'
  | 'FINANCIAL_PROOF'
  | 'LANGUAGE_TEST';

export type DocumentState = 
  | 'REQUESTED'
  | 'UPLOADED'
  | 'EXTRACTION_PENDING'
  | 'EXTRACTED'
  | 'VALIDATION_PENDING'
  | 'VERIFIED'
  | 'NEEDS_CORRECTION'
  | 'REJECTED';

export type ReferralState = 
  | 'CREATED'
  | 'ATTRIBUTED'
  | 'QUALIFIED'
  | 'ROUTED'
  | 'APPLICATION_STARTED'
  | 'ADMITTED'
  | 'ENROLLED'
  | 'COMMISSION_ELIGIBLE'
  | 'COMMISSION_PAID'
  | 'DISPUTED';

// Allowed Next States Matrix (Grounded in Build Control Workbook Sheet 6)
export const ALLOWED_STUDENT_TRANSITIONS: Record<StudentStatus, StudentStatus[]> = {
  LEAD: ['INTAKE', 'WITHDRAWN'],
  INTAKE: ['ASSESSMENT', 'WITHDRAWN'],
  ASSESSMENT: ['DOCS_PENDING', 'ESCALATED', 'WITHDRAWN'],
  DOCS_PENDING: ['DOCS_REVIEW', 'WITHDRAWN'],
  DOCS_REVIEW: ['HUMAN_REVIEW', 'APPROVED', 'DOCS_PENDING', 'ESCALATED'],
  HUMAN_REVIEW: ['APPROVED', 'DOCS_PENDING', 'ESCALATED', 'WITHDRAWN'],
  APPROVED: ['ROUTED', 'WITHDRAWN'],
  ROUTED: ['APPLICATION_ACTIVE', 'WITHDRAWN', 'ESCALATED'],
  APPLICATION_ACTIVE: ['COMPLETED', 'WITHDRAWN', 'ESCALATED'],
  COMPLETED: [],
  WITHDRAWN: [],
  ESCALATED: ['HUMAN_REVIEW', 'WITHDRAWN']
};

export interface UserAccount {
  id: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  nationality: string;
  currentCountry: string;
  targetCountry: string;
  targetProgramLevel: string;
  budgetCurrency: string;
  budgetMaxAnnual: number;
  status: StudentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Assessment {
  id: string;
  studentId: string;
  languageSignals: {
    selfDeclaredLevel?: string;
    bilingualFrenchEnglish?: boolean;
    spokenComfortScore?: number; // 1 - 5
  };
  academicSignals: {
    certificateType?: string; // e.g. "Diplome d'Etat"
    examPercentage?: number;
    yearOfCompletion?: number;
  };
  intentSignals: {
    intendedFaculty?: string;
    hasFinancialSponsor?: boolean;
    targetIntakeMonth?: string;
  };
  readinessScore: number; // 0 - 100
  rubricBreakdown: Record<string, number>;
  aiConfidence: number;
  requiresHumanGate: boolean;
  evaluatedAt: Date;
}

export interface DocumentItem {
  id: string;
  studentId: string;
  docType: DocumentType;
  fileUrl?: string;
  state: DocumentState;
  ocrExtractedData?: Record<string, any>;
  rejectionReasonCode?: string;
  uploadedAt?: Date;
}

export interface CaseEvent {
  id: number;
  caseId: string;
  actorId?: string;
  actorType: 'STUDENT' | 'REVIEWER' | 'AI_AGENT' | 'SYSTEM';
  eventType: string;
  fromState?: string;
  toState?: string;
  payload: Record<string, any>;
  createdAt: Date;
}
