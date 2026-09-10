// FluentWave Core MVP Endpoints (Phases 1 - 5)
import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { store, StateMachineError } from './store';
import { Student, Assessment, DocumentState } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'fluentwave-backend', timestamp: new Date() });
});

// 2. [INTAKE] POST /api/v1/intake/start
// Converts raw prospect/contact into structured INTAKE case
app.post('/api/v1/intake/start', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, targetCountry, budgetMaxAnnual } = req.body;

    if (!firstName || !lastName || !phone) {
      return res.status(400).json({ error: 'firstName, lastName, and phone are required.' });
    }

    const studentId = uuidv4();
    const newStudent: Student = {
      id: studentId,
      firstName,
      lastName,
      phone,
      email,
      nationality: 'DRC',
      currentCountry: 'DRC',
      targetCountry: targetCountry || 'India',
      targetProgramLevel: 'UNDERGRADUATE',
      budgetCurrency: 'USD',
      budgetMaxAnnual: budgetMaxAnnual || 4500,
      status: 'LEAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.students.set(studentId, newStudent);
    store.logEvent(studentId, 'LEAD_CAPTURED', undefined, 'LEAD', { source: 'homepage_form' }, 'STUDENT');

    // Automatically transition to INTAKE once basic registration payload is validated
    const activeStudent = store.transitionStudent(studentId, 'INTAKE', 'STUDENT', undefined, { step: 'registration_complete' });

    res.status(201).json({
      message: 'Intake initiated successfully.',
      student: activeStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. [ASSESSMENT] POST /api/v1/assessments/submit
// Computes explainable bilingual readiness score (Phase 1)
app.post('/api/v1/assessments/submit', (req: Request, res: Response) => {
  try {
    const { studentId, languageSignals, academicSignals, intentSignals } = req.body;

    const student = store.students.get(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID ${studentId} not found.` });
    }

    // Move to ASSESSMENT phase if currently in INTAKE
    if (student.status === 'INTAKE') {
      store.transitionStudent(studentId, 'ASSESSMENT', 'STUDENT');
    }

    // Rubric Scoring Logic (Grounded in PRD P1 Rubric)
    let academicScore = 0;
    const percentage = academicSignals?.examPercentage || 50;
    if (percentage >= 70) academicScore = 35;
    else if (percentage >= 60) academicScore = 28;
    else if (percentage >= 50) academicScore = 20;
    else academicScore = 12;

    let languageScore = 0;
    const level = (languageSignals?.selfDeclaredLevel || 'INTERMEDIATE').toUpperCase();
    if (level === 'ADVANCED' || level === 'FLUENT') languageScore = 30;
    else if (level === 'INTERMEDIATE') languageScore = 22;
    else languageScore = 14;

    let intentScore = 0;
    if (intentSignals?.hasFinancialSponsor) intentScore += 15;
    if (intentSignals?.intendedFaculty) intentScore += 10;
    if (intentSignals?.targetIntakeMonth) intentScore += 10;

    const totalScore = Math.min(100, academicScore + languageScore + intentScore);
    const aiConfidence = percentage < 45 || level === 'BEGINNER' ? 0.65 : 0.92;
    const requiresHumanGate = aiConfidence < 0.75;

    const assessment: Assessment = {
      id: uuidv4(),
      studentId,
      languageSignals: languageSignals || {},
      academicSignals: academicSignals || {},
      intentSignals: intentSignals || {},
      readinessScore: totalScore,
      rubricBreakdown: {
        academicScore,
        languageScore,
        intentScore,
        maxPossible: 100
      },
      aiConfidence,
      requiresHumanGate,
      evaluatedAt: new Date()
    };

    store.assessments.set(studentId, assessment);
    store.logEvent(studentId, 'ASSESSMENT_COMPLETED', 'ASSESSMENT', undefined, { readinessScore: totalScore, aiConfidence }, 'AI_AGENT');

    // Transition to DOCS_PENDING and initialize required document checklist
    store.transitionStudent(studentId, 'DOCS_PENDING', 'SYSTEM', undefined, { readinessScore: totalScore });
    const checklist = store.initializeChecklist(studentId);

    res.json({
      message: 'Assessment evaluated successfully.',
      assessment,
      checklist
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. [DOCUMENTS] GET /api/v1/students/:id/checklist
// Returns required documents and current states
app.get('/api/v1/students/:id/checklist', (req: Request, res: Response) => {
  const { id } = req.params;
  const docs = store.documents.get(id);
  if (!docs) {
    return res.status(404).json({ error: `Checklist not found for student ${id}` });
  }
  res.json({ studentId: id, checklist: docs });
});

// 5. [DOCUMENTS] POST /api/v1/documents/:docId/mock-upload
// Simulates mobile camera capture & file upload
app.post('/api/v1/documents/:docId/mock-upload', (req: Request, res: Response) => {
  const { docId } = req.params;
  const { studentId, fileUrl } = req.body;

  const docs = store.documents.get(studentId);
  if (!docs) return res.status(404).json({ error: 'Student documents not found.' });

  const doc = docs.find(d => d.id === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  doc.state = 'UPLOADED';
  doc.fileUrl = fileUrl || `https://storage.fluentwave.internal/docs/${docId}.pdf`;
  doc.uploadedAt = new Date();

  store.logEvent(studentId, 'DOCUMENT_UPLOADED', 'REQUESTED', 'UPLOADED', { docType: doc.docType, docId }, 'STUDENT');

  // If all documents are uploaded, move student to DOCS_REVIEW
  const allUploaded = docs.every(d => d.state === 'UPLOADED' || d.state === 'VERIFIED');
  if (allUploaded) {
    store.transitionStudent(studentId, 'DOCS_REVIEW', 'SYSTEM');
  }

  res.json({ message: 'Document uploaded.', document: doc });
});

// 6. [REVIEW] GET /api/v1/reviewer/queue
// Reviewer queue sorted by risk and exception flags (Phase 3)
app.get('/api/v1/reviewer/queue', (req: Request, res: Response) => {
  const queue: any[] = [];
  store.students.forEach(s => {
    if (['DOCS_REVIEW', 'HUMAN_REVIEW', 'ESCALATED'].includes(s.status)) {
      const assessment = store.assessments.get(s.id);
      queue.push({
        student: s,
        assessment,
        documents: store.documents.get(s.id) || []
      });
    }
  });
  res.json({ count: queue.length, queue });
});

// 7. [REVIEW] POST /api/v1/reviewer/cases/:id/decision
// Reviewer approval or correction request
app.post('/api/v1/reviewer/cases/:id/decision', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, reasonCode, reviewerId } = req.body; // 'APPROVE' | 'REQUEST_CORRECTION' | 'REJECT' | 'ESCALATE'

    if (decision === 'APPROVE') {
      const student = store.transitionStudent(id, 'APPROVED', 'REVIEWER', reviewerId, { decision, reasonCode });
      return res.json({ message: 'Case approved.', student });
    } else if (decision === 'REQUEST_CORRECTION') {
      const student = store.transitionStudent(id, 'DOCS_PENDING', 'REVIEWER', reviewerId, { decision, reasonCode });
      return res.json({ message: 'Correction requested. Case returned to DOCS_PENDING.', student });
    } else if (decision === 'ESCALATE') {
      const student = store.transitionStudent(id, 'ESCALATED', 'REVIEWER', reviewerId, { decision, reasonCode });
      return res.json({ message: 'Case escalated for executive review.', student });
    }

    res.status(400).json({ error: 'Invalid decision type.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// 8. [DASHBOARD] GET /api/v1/students/:id/dashboard
// Single event-driven status + next-action view (Phase 5)
app.get('/api/v1/students/:id/dashboard', (req: Request, res: Response) => {
  const { id } = req.params;
  const student = store.students.get(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const events = store.caseEvents.filter(e => e.caseId === id);
  const checklist = store.documents.get(id) || [];
  const assessment = store.assessments.get(id);

  // Compute clear next action for the student
  let nextAction = 'Complete your intake';
  if (student.status === 'INTAKE') nextAction = 'Take the Readiness Assessment';
  else if (student.status === 'ASSESSMENT') nextAction = 'Submit assessment responses';
  else if (student.status === 'DOCS_PENDING') nextAction = 'Upload your passport and diploma';
  else if (student.status === 'DOCS_REVIEW' || student.status === 'HUMAN_REVIEW') nextAction = 'Admissions team is reviewing your dossier';
  else if (student.status === 'APPROVED') nextAction = 'Select your target university partner';
  else if (student.status === 'ROUTED') nextAction = 'Application submitted to partner university';

  res.json({
    student,
    nextAction,
    readinessScore: assessment?.readinessScore || null,
    checklist,
    timeline: events
  });
});

export default app;
