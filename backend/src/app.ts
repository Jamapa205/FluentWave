// FluentWave Core MVP Endpoints (Phases 1 - 5) + Auth & Admin Portal APIs
import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { dbStore as store } from './db_store';
import { Student, Assessment, UserAccount } from './types';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'fluentwave-backend', database: 'persistent-sqlite', timestamp: new Date() });
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

    const existing = store.findUserByEmailOrPhone(email) || store.findUserByEmailOrPhone(phone);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone number already exists.' });
    }

    const userId = uuidv4();
    const newUser: UserAccount = {
      id: userId,
      email: email.toLowerCase(),
      phone,
      passwordHash: Buffer.from(password).toString('base64'),
      role: 'STUDENT',
      createdAt: new Date()
    };

    store.saveUser(newUser);

    const newStudent: Student = {
      id: userId,
      firstName,
      lastName,
      phone,
      email: email.toLowerCase(),
      nationality: 'Global',
      currentCountry: 'Global',
      targetCountry: 'India',
      targetProgramLevel: 'UNDERGRADUATE',
      budgetCurrency: 'USD',
      budgetMaxAnnual: 4500,
      status: 'LEAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.saveStudent(newStudent);
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
    const user = store.findUserByEmailOrPhone(emailOrPhone);

    if (!user || user.passwordHash !== encoded) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const student = store.getStudent(user.id);

    res.json({
      message: 'Login successful.',
      user: { id: user.id, email: user.email, phone: user.phone, role: user.role },
      student: student || null
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/auth/google
app.post('/api/v1/auth/google', (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account.' });
    }

    let existing = store.findUserByEmailOrPhone(email);
    if (existing) {
      const student = store.getStudent(existing.id);
      return res.json({
        message: 'Google Sign In successful.',
        user: { id: existing.id, email: existing.email, phone: existing.phone, role: existing.role },
        student: student || null
      });
    }

    const userId = uuidv4();
    const newUser: UserAccount = {
      id: userId,
      email: email.toLowerCase(),
      phone: req.body.phone || '+243990000000',
      passwordHash: 'GOOGLE_OAUTH_' + (googleId || 'USER'),
      role: 'STUDENT',
      createdAt: new Date()
    };

    store.saveUser(newUser);

    const newStudent: Student = {
      id: userId,
      firstName: firstName || 'Student',
      lastName: lastName || 'User',
      phone: newUser.phone,
      email: email.toLowerCase(),
      nationality: 'Global',
      currentCountry: 'Global',
      targetCountry: 'India',
      targetProgramLevel: 'UNDERGRADUATE',
      budgetCurrency: 'USD',
      budgetMaxAnnual: 4500,
      status: 'LEAD',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.saveStudent(newStudent);
    store.logEvent(userId, 'USER_REGISTERED_GOOGLE', undefined, 'LEAD', { email }, 'STUDENT', userId);

    res.status(201).json({
      message: 'Account created with Google successfully.',
      user: { id: newUser.id, email: newUser.email, phone: newUser.phone, role: newUser.role },
      student: newStudent
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
  const students = store.getAllStudents();
  const applications = students.map(student => {
    const assessment = store.getAssessment(student.id);
    const documents = store.getDocuments(student.id);
    const events = store.getEvents(student.id);

    return {
      student,
      readinessScore: assessment?.readinessScore ?? null,
      aiConfidence: assessment?.aiConfidence ?? null,
      documentsCount: documents.length,
      uploadedCount: documents.filter(d => d.state === 'UPLOADED' || d.state === 'VERIFIED').length,
      documents,
      lastEvent: events[events.length - 1] || null
    };
  });

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
  const student = store.getStudent(id);
  if (!student) return res.status(404).json({ error: 'Application not found.' });

  const assessment = store.getAssessment(id);
  const documents = store.getDocuments(id);
  const timeline = store.getEvents(id);

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
    const { action, notes, targetPartner } = req.body;

    const student = store.getStudent(id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    if (action === 'APPROVE') {
      store.transitionStudent(id, 'APPROVED', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Application approved successfully.', student: store.getStudent(id) });
    } else if (action === 'REQUEST_CORRECTION') {
      store.transitionStudent(id, 'DOCS_PENDING', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Correction requested from student.', student: store.getStudent(id) });
    } else if (action === 'ROUTE') {
      if (student.status !== 'APPROVED') {
        store.transitionStudent(id, 'APPROVED', 'REVIEWER');
      }
      store.transitionStudent(id, 'ROUTED', 'REVIEWER', undefined, { partner: targetPartner || 'KIIT University' });
      return res.json({ message: `Successfully routed to partner: ${targetPartner || 'KIIT University'}`, student: store.getStudent(id) });
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

    let student = studentId ? store.getStudent(studentId) : null;
    if (!student) {
      return res.status(400).json({ error: 'Please sign up or log in first.' });
    }

    student.targetCountry = targetCountry || student.targetCountry;
    student.budgetMaxAnnual = budgetMaxAnnual || student.budgetMaxAnnual;

    if (student.status === 'LEAD') {
      student = store.transitionStudent(student.id, 'INTAKE', 'STUDENT', undefined, { targetCountry });
    } else {
      store.saveStudent(student);
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

    const student = store.getStudent(studentId);
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

    store.saveAssessment(assessment);
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
  const docs = store.getDocuments(id);
  if (!docs || docs.length === 0) return res.status(404).json({ error: `Checklist not found for student ${id}` });
  res.json({ studentId: id, checklist: docs });
});

// POST /api/v1/documents/:docId/mock-upload
app.post('/api/v1/documents/:docId/mock-upload', (req: Request, res: Response) => {
  const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
  const { studentId, fileUrl } = req.body;

  const docs = store.getDocuments(studentId);
  if (!docs || docs.length === 0) return res.status(404).json({ error: 'Student documents not found.' });

  const doc = docs.find(d => d.id === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const uploadedUrl = fileUrl || `https://storage.fluentwave.internal/docs/${docId}.pdf`;
  store.updateDocument(docId, 'UPLOADED', uploadedUrl);

  store.logEvent(studentId, 'DOCUMENT_UPLOADED', 'REQUESTED', 'UPLOADED', { docType: doc.docType, docId }, 'STUDENT');

  const refreshedDocs = store.getDocuments(studentId);
  const allUploaded = refreshedDocs.every(d => d.state === 'UPLOADED' || d.state === 'VERIFIED');
  if (allUploaded) {
    store.transitionStudent(studentId, 'DOCS_REVIEW', 'SYSTEM');
  }

  res.json({ message: 'Document uploaded.', document: { ...doc, state: 'UPLOADED', fileUrl: uploadedUrl } });
});

// GET /api/v1/students/:id/dashboard
app.get('/api/v1/students/:id/dashboard', (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const student = store.getStudent(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const events = store.getEvents(id);
  const checklist = store.getDocuments(id);
  const assessment = store.getAssessment(id);

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
