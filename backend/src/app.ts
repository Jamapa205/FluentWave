// FluentWave Core MVP Endpoints (Phases 1 - 5) + Auth & Admin Portal APIs
import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { dbStore as store } from './db_store';
import { Student, Assessment, UserAccount } from './types';
import bcrypt from 'bcrypt';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'mock_access_key',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'mock_secret_key',
  }
});
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || 'fluentwave-docs-mock-bucket';

const app = express();
app.use(cors());
app.use(express.json());

// 1. Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'fluentwave-backend', database: 'persistent-postgresql', timestamp: new Date() });
});

// Seed Admin Account (run on startup)
(async () => {
  try {
    const adminEmail = 'Dueng';
    const adminPassword = 'Dueng@123';
    
    // Create users table if it exists and check for admin
    const existingAdmin = await store.findUserByEmailOrPhone(adminEmail).catch(() => null);
    
    if (!existingAdmin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(adminPassword, salt);
      
      const adminUser: UserAccount = {
        id: uuidv4(),
        email: adminEmail,
        phone: '0000000000',
        passwordHash,
        role: 'ADMIN',
        createdAt: new Date()
      };
      
      await store.saveUser(adminUser);
      console.log('✅ Default Admin account created successfully.');
    }
  } catch (err) {
    console.error('Failed to seed admin account:', err);
  }
})();

// ==========================================
// AUTHENTICATION APIs (Student Accounts)
// ==========================================

// POST /api/v1/auth/signup
app.post('/api/v1/auth/signup', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, email, password } = req.body;

    if (!firstName || !lastName || !phone || !email || !password) {
      return res.status(400).json({ error: 'All fields (firstName, lastName, phone, email, password) are required.' });
    }

    const existing = await store.findUserByEmailOrPhone(email) || await store.findUserByEmailOrPhone(phone);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email or phone number already exists.' });
    }

    const userId = uuidv4();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: UserAccount = {
      id: userId,
      email: email.toLowerCase(),
      phone,
      passwordHash,
      role: 'STUDENT',
      createdAt: new Date()
    };

    await store.saveUser(newUser);

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

    await store.saveStudent(newStudent);
    await store.logEvent(userId, 'USER_REGISTERED', undefined, 'LEAD', { email, phone }, 'STUDENT', userId);

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
app.post('/api/v1/auth/login', async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;
    if (!emailOrPhone || !password) {
      return res.status(400).json({ error: 'Email/Phone and password are required.' });
    }

    const user = await store.findUserByEmailOrPhone(emailOrPhone);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email/phone or password.' });
    }

    const student = await store.getStudent(user.id);

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
app.post('/api/v1/auth/google', async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, googleId } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required from Google account.' });
    }

    let existing = await store.findUserByEmailOrPhone(email);
    if (existing) {
      const student = await store.getStudent(existing.id);
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

    await store.saveUser(newUser);

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

    await store.saveStudent(newStudent);
    await store.logEvent(userId, 'USER_REGISTERED_GOOGLE', undefined, 'LEAD', { email }, 'STUDENT', userId);

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
app.get('/api/v1/admin/applications', async (_req: Request, res: Response) => {
  const students = await store.getAllStudents();
  const applications = await Promise.all(students.map(async student => {
    const assessment = await store.getAssessment(student.id);
    const documents = await store.getDocuments(student.id);
    const events = await store.getEvents(student.id);

    return {
      student,
      readinessScore: assessment?.readinessScore ?? null,
      aiConfidence: assessment?.aiConfidence ?? null,
      documentsCount: documents.length,
      uploadedCount: documents.filter(d => d.state === 'UPLOADED' || d.state === 'VERIFIED').length,
      documents,
      lastEvent: events[events.length - 1] || null
    };
  }));

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
app.get('/api/v1/admin/applications/:id', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const student = await store.getStudent(id);
  if (!student) return res.status(404).json({ error: 'Application not found.' });

  const assessment = await store.getAssessment(id);
  const documents = await store.getDocuments(id);
  const timeline = await store.getEvents(id);

  res.json({
    student,
    assessment: assessment || null,
    documents,
    timeline
  });
});

// POST /api/v1/admin/applications/:id/decision
app.post('/api/v1/admin/applications/:id/decision', async (req: Request, res: Response) => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { action, notes, targetPartner } = req.body;

    const student = await store.getStudent(id);
    if (!student) return res.status(404).json({ error: 'Student not found.' });

    if (action === 'APPROVE') {
      await store.transitionStudent(id, 'APPROVED', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Application approved successfully.', student: await store.getStudent(id) });
    } else if (action === 'REQUEST_CORRECTION') {
      await store.transitionStudent(id, 'DOCS_PENDING', 'REVIEWER', undefined, { notes });
      return res.json({ message: 'Correction requested from student.', student: await store.getStudent(id) });
    } else if (action === 'ROUTE') {
      if (student.status !== 'APPROVED') {
        await store.transitionStudent(id, 'APPROVED', 'REVIEWER');
      }
      await store.transitionStudent(id, 'ROUTED', 'REVIEWER', undefined, { partner: targetPartner || 'KIIT University' });
      return res.json({ message: `Successfully routed to partner: ${targetPartner || 'KIIT University'}`, student: await store.getStudent(id) });
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
app.post('/api/v1/intake/start', async (req: Request, res: Response) => {
  try {
    const { studentId, targetCountry, budgetMaxAnnual } = req.body;

    let student = studentId ? await store.getStudent(studentId) : null;
    if (!student) {
      return res.status(400).json({ error: 'Please sign up or log in first.' });
    }

    student.targetCountry = targetCountry || student.targetCountry;
    student.budgetMaxAnnual = budgetMaxAnnual || student.budgetMaxAnnual;

    if (student.status === 'LEAD') {
      student = await store.transitionStudent(student.id, 'INTAKE', 'STUDENT', undefined, { targetCountry });
    } else {
      await store.saveStudent(student);
    }

    res.json({ message: 'Intake initiated.', student });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/assessments/submit
app.post('/api/v1/assessments/submit', async (req: Request, res: Response) => {
  try {
    const { studentId, languageSignals, academicSignals, intentSignals } = req.body;

    const student = await store.getStudent(studentId);
    if (!student) {
      return res.status(404).json({ error: `Student with ID ${studentId} not found.` });
    }

    if (student.status === 'INTAKE' || student.status === 'LEAD') {
      await store.transitionStudent(studentId, 'ASSESSMENT', 'STUDENT');
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

    await store.saveAssessment(assessment);
    await store.logEvent(studentId, 'ASSESSMENT_COMPLETED', 'ASSESSMENT', undefined, { readinessScore: totalScore, aiConfidence }, 'AI_AGENT');

    await store.transitionStudent(studentId, 'DOCS_PENDING', 'SYSTEM', undefined, { readinessScore: totalScore });
    const checklist = await store.initializeChecklist(studentId);

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
app.get('/api/v1/students/:id/checklist', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const docs = await store.getDocuments(id);
  if (!docs || docs.length === 0) return res.status(404).json({ error: `Checklist not found for student ${id}` });
  res.json({ studentId: id, checklist: docs });
});

// GET /api/v1/documents/:docId/upload-url
app.get('/api/v1/documents/:docId/upload-url', async (req: Request, res: Response) => {
  try {
    const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
    const { studentId, fileName, fileType } = req.query;

    if (!studentId || !fileName || !fileType) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const docs = await store.getDocuments(studentId as string);
    const doc = docs.find(d => d.id === docId);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const fileExtension = (fileName as string).split('.').pop();
    const fileKey = `students/${studentId}/documents/${docId}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType as string
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ uploadUrl, fileKey });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/documents/:docId/confirm-upload
app.post('/api/v1/documents/:docId/confirm-upload', async (req: Request, res: Response) => {
  const docId = Array.isArray(req.params.docId) ? req.params.docId[0] : req.params.docId;
  const { studentId, fileKey } = req.body;

  const docs = await store.getDocuments(studentId);
  if (!docs || docs.length === 0) return res.status(404).json({ error: 'Student documents not found.' });

  const doc = docs.find(d => d.id === docId);
  if (!doc) return res.status(404).json({ error: 'Document not found.' });

  const fileUrl = `https://${S3_BUCKET_NAME}.s3.amazonaws.com/${fileKey}`;
  await store.updateDocument(docId, 'UPLOADED', fileUrl);

  await store.logEvent(studentId, 'DOCUMENT_UPLOADED', 'REQUESTED', 'UPLOADED', { docType: doc.docType, docId }, 'STUDENT');

  const refreshedDocs = await store.getDocuments(studentId);
  const allUploaded = refreshedDocs.every(d => d.state === 'UPLOADED' || d.state === 'VERIFIED');
  if (allUploaded) {
    await store.transitionStudent(studentId, 'DOCS_REVIEW', 'SYSTEM');
  }

  res.json({ message: 'Document confirmed uploaded.', document: { ...doc, state: 'UPLOADED', fileUrl } });
});

// GET /api/v1/students/:id/dashboard
app.get('/api/v1/students/:id/dashboard', async (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const student = await store.getStudent(id);
  if (!student) return res.status(404).json({ error: 'Student not found.' });

  const events = await store.getEvents(id);
  const checklist = await store.getDocuments(id);
  const assessment = await store.getAssessment(id);

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
