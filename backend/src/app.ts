// FluentWave Core MVP Endpoints (Phases 1 - 5) + Auth & Admin Portal APIs
import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { store } from './store';
import { Student, Assessment, UserAccount } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'fluentwave-backend', timestamp: new Date() });
});

// ==========================================
// AUTHENTICATION APIs (Student Accounts)
// ==========================================

// POST /api/v1/auth/signup
app.post('/api/v1/auth/signup', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields (firstName, lastName, phone, email, password) are required.' });
    }

    // Check if user already exists
    for (const u of store.users.values()) {
      if (u.email.toLowerCase() === email.toLowerCase() || u.phone === phone) {
        return res.status(400).json({ error: 'An account with this email or phone number already exists.' });
      }
    }

    const userId = uuidv4();
    const newUser: UserAccount = {
      id: userId,
      email: email.toLowerCase(),
      phone,
      passwordHash: Buffer.from(password).toString('base64'), // Simple demo encoding
      role: 'STUDENT',
      createdAt: new Date()
    };

    store.users.set(userId, newUser);

    // Also auto-create their student record in LEAD state
    const newStudent: Student = {
      id: userId,
      firstName,
      lastName,
      phone,
      email: email.toLowerCase(),
      nationality: 'DRC',
      currentCountry: 'DRC',
      targetCountry: 'India',
      targetProgramLevel: 'UNDERGRADUATE',
      budgetCurrency: 'USD',
      budgetMaxAnnual: 4500,
      status: 'LEAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.students.set(userId, newStudent);
    store.logEvent(userId, 'USER_REGISTERED', undefined, 'LEAD', { email, phone }, 'STUDENT', userId);

    res.status(201).json({
      message: 'Account created successfully.',
      user: { id: newUser.id, email: newUser.email, phone: newUser.phone, role: newUser.role },
      student: newStudent
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/login
app.post('/api/v1/auth/login', (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required.' });
    }

    const encoded = Buffer.from(password).toString('base64');
    let foundUser: UserAccount | null = null;

    for (const u of store.users.values()) {
      if (
        (u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone) &&
        u.passwordHash === encoded
      ) {
        foundUser = u;
        break;
      }
    }

    if (!foundUser) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const student = store.students.get(foundUser.id);

    res.json({
      message: 'Login successful.',
      user: { id: foundUser.id, email: foundUser.email, phone: foundUser.phone, role: foundUser.role },
      student: student || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ADMIN / OPERATIONS PORTAL APIs
// ==========================================

// GET /api/v1/admin/applications
app.get('/api/v1/admin/applications', (_req: Request, res: Response) => {
  const applications: any[] = [];
  
  store.students.forEach(student => {
    const assessment = store.assessments.get(student.id);
    const documents = store.documents.get(student.id) || [];
    const events = store.caseEvents.filter(e => e.caseId === student.id);

    applications.push({
      student,
      readinessScore: assessment?.readinessScore ?? null,
      aiConfidence: assessment?.aiConfidence ?? null,
      documentsCount: documents.length,
      uploadedCount: documents.filter(d => d.state === 'UPLOADED' || d.state === 'VERIFIED').length,
      documents,
      lastEvent: events[events.length - 1] || null
    });
  });

  // Calculate metrics
  const total = applications.length;
  const awaitingReview = applications.filter(a => a.student.status === 'DOCS_REVIEW' || a.student.status === 'HUMAN_REVIEW').length;
  const approved = applications.filter(a => a.student.status === 'APPROVED').length;
  const routed = applications.filter(a => a.student.status === 'ROUTED').length;

  res.json({
    metrics: { total, awaitingReview, approved, routed },
    applications
  });
});

// GET /api/v1/admin/applications/:id
app.get('/api/v1/admin/applications/:id', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const student = store.students.get(id);
  if (!student) return res.status(404).json({ error: 'Application not found.' });

  const assessment = store.assessments.get(id);
  const documents = store.documents.get(id) || [];
  const timeline = store.caseEvents.filter(e => e.caseId === id);

  res.json({
    student,
    assessment: assessment || null,
    documents,
    timeline
  });
});

// POST /api/v1/admin/applications/:id/decision
app.post('/api/v1/admin/applications/:id/decision', (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { action, notes, targetPartner } = req.body; // 'APPROVE' | 'REQUEST_CORRECTION' | 'ROUTE'

    const student = store.students.get(id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    if (action === 'APPROVE') {
      store.transitionStudent(id, 'APPROVED', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Application approved successfully.', student: store.students.get(id) });
    } else if (action === 'REQUEST_CORRECTION') {
      store.transitionStudent(id, 'DOCS_PENDING', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Correction requested from student.', student: store.students.get(id) });
    } else if (action === 'ROUTE') {
      if (student.status !== 'APPROVED') {
        store.transitionStudent(id, 'APPROVED', 'REVIEWER');
      }
      store.transitionStudent(id, 'ROUTED', 'REVIEWER', undefined, { partner: targetPartner || 'KIIT University' });
      return res.json({ message: `Successfully routed to partner: ${targetPartner || 'KIIT University'}`, student: store.students.get(id) });
    }

    res.status(400).json({ error: 'Invalid action.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// CORE STUDENT INTAKE & ASSESSMENT APIs
// ==========================================

// POST /api/v1/intake/start
app.post('/api/v1/intake/start', (req: Request, res: Response) => {
  try {
    const { studentId, targetCountry, budgetMaxAnnual } = req.body;

    let student = studentId ? store.students.get(studentId) : null;
    if (!student) {
      return res.status(400).json({ error: 'Please sign up or log in first.' });
    }

    student.targetCountry = targetCountry || student.targetCountry;
    student.budgetMaxAnnual = budgetMaxAnnual || student.budgetMaxAnnual;

    // Transition from LEAD to INTAKE
    if (student.status === 'LEAD') {
      student = store.transitionStudent(student.id, 'INTAKE', 'STUDENT', undefined, { targetCountry });
    }

    res.json({ message: 'Intake initiated.', student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/assessments/submit
app.post('/api/v1/assessments/submit', (req: Request, res: Response) => {
  try {
    const { studentId, languageSignals, academicSignals, intentSignals } = req.body;

    const student = store.students.get(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID ${studentId} not found.` });
    }

    if (student.status === 'INTAKE' || student.status === 'LEAD') {
      store.transitionStudent(studentId, 'ASSESSMENT', 'STUDENT');
    }

    // Rubric Scoring Logic
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
      rubricBreakdown: { academicScore, languageScore, intentScore, maxPossible: 100 },
      aiConfidence,
      requiresHumanGate,
      evaluatedAt: new Date()
    };

    store.assessments.set(studentId, assessment);
    store.logEvent(studentId, 'ASSESSMENT_COMPLETED', 'ASSESSMENT', undefined, { readinessScore: totalScore, aiConfidence }, 'AI_AGENT');

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

// GET /api/v1/students/:id/checklist
app.get('/api/v1/students/:id/checklist', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const docs = store.documents.get(id);
  if (!docs) return res.status(404).json({ error: `Checklist not found for student ${id}` });
  res.json({ studentId: id, checklist: docs });
});

// POST /api/v1/documents/:docId/mock-upload
app.post('/api/v1/documents/:docId/mock-upload', (req: Request, res: Response) => {
  const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
  const { studentId, fileUrl } = req.body;

  const docs = store.documents.get(studentId);
  if (!docs) return res.status(404).json({ error: 'Student documents not found.' });

  const doc = docs.find(d => d.id === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  doc.state = 'UPLOADED';
  doc.fileUrl = fileUrl || `https://storage.fluentwave.internal/docs/${docId}.pdf`;
  doc.uploadedAt = new Date();

  store.logEvent(studentId, 'DOCUMENT_UPLOADED', 'REQUESTED', 'UPLOADED', { docType: doc.docType, docId }, 'STUDENT');

  const allUploaded = docs.every(d => d.state === 'UPLOADED' || d.state === 'VERIFIED');
  if (allUploaded) {
    store.transitionStudent(studentId, 'DOCS_REVIEW', 'SYSTEM');
  }

  res.json({ message: 'Document uploaded.', document: doc });
});

// GET /api/v1/students/:id/dashboard
app.get('/api/v1/students/:id/dashboard', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const student = store.students.get(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const events = store.caseEvents.filter(e => e.caseId === id);
  const checklist = store.documents.get(id) || [];
  const assessment = store.assessments.get(id);

  let nextAction = 'Complete your intake';
  if (student.status === 'INTAKE') nextAction = 'Take the Readiness Assessment';
  else if (student.status === 'ASSESSMENT') nextAction = 'Submit assessment responses';
  else if (student.status === 'DOCS_PENDING') nextAction = 'Upload required documents (Passport & Diploma)';
  else if (student.status === 'DOCS_REVIEW' || student.status === 'HUMAN_REVIEW') nextAction = 'Admissions team is reviewing your dossier';
  else if (student.status === 'APPROVED') nextAction = 'Your profile is approved! Ready for university dispatch';
  else if (student.status === 'ROUTED') nextAction = 'Application dispatched to partner university';

  res.json({
    student,
    nextAction,
    readinessScore: assessment?.readinessScore || null,
    checklist,
    timeline: events
  });
});

export default app;
