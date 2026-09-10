-- FluentWave MVP Database Schema Migration V1.0
-- Compatible with PostgreSQL 14+ / Supabase
-- Grounded in FluentWave PRD V1 & Build Control Workbook V1

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Enums
CREATE TYPE user_role AS ENUM (
    'STUDENT',
    'PARENT',
    'AGENT',
    'REVIEWER',
    'PARTNER_REP',
    'ADMIN'
);

CREATE TYPE student_status AS ENUM (
    'LEAD',
    'INTAKE',
    'ASSESSMENT',
    'DOCS_PENDING',
    'DOCS_REVIEW',
    'HUMAN_REVIEW',
    'APPROVED',
    'ROUTED',
    'APPLICATION_ACTIVE',
    'COMPLETED',
    'WITHDRAWN',
    'ESCALATED'
);

CREATE TYPE document_type AS ENUM (
    'PASSPORT',
    'DIPLOMA_CERTIFICATE',
    'TRANSCRIPT',
    'PHOTO',
    'FINANCIAL_PROOF',
    'LANGUAGE_TEST'
);

CREATE TYPE document_state AS ENUM (
    'REQUESTED',
    'UPLOADED',
    'EXTRACTION_PENDING',
    'EXTRACTED',
    'VALIDATION_PENDING',
    'VERIFIED',
    'NEEDS_CORRECTION',
    'REJECTED'
);

CREATE TYPE referral_state AS ENUM (
    'CREATED',
    'ATTRIBUTED',
    'QUALIFIED',
    'ROUTED',
    'APPLICATION_STARTED',
    'ADMITTED',
    'ENROLLED',
    'COMMISSION_ELIGIBLE',
    'COMMISSION_PAID',
    'DISPUTED'
);

CREATE TYPE routing_status AS ENUM (
    'PROPOSED',
    'SENT',
    'ACKNOWLEDGED',
    'ACCEPTED',
    'REJECTED',
    'EXPIRED'
);

-- 3. Users Table (Core Auth / Identity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(50) UNIQUE NOT NULL, -- Crucial for DRC WhatsApp communication
    role user_role NOT NULL DEFAULT 'STUDENT',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Students Profile Table
CREATE TABLE students (
    id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    nationality VARCHAR(50) DEFAULT 'DRC',
    current_country VARCHAR(50) DEFAULT 'DRC',
    target_country VARCHAR(50) DEFAULT 'India',
    target_program_level VARCHAR(50) DEFAULT 'UNDERGRADUATE',
    budget_currency VARCHAR(3) DEFAULT 'USD',
    budget_max_annual NUMERIC(10, 2),
    status student_status NOT NULL DEFAULT 'LEAD',
    assigned_reviewer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Assessments Table (Phase 1 — Readiness Scoring)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    language_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    academic_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    intent_signals JSONB NOT NULL DEFAULT '{}'::jsonb,
    readiness_score NUMERIC(5, 2), -- 0.00 - 100.00
    rubric_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    ai_confidence NUMERIC(3, 2) NOT NULL DEFAULT 1.0,
    requires_human_gate BOOLEAN NOT NULL DEFAULT false,
    evaluated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Documents Table (Phase 2 — Intake & OCR Verification)
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    doc_type document_type NOT NULL,
    file_url TEXT,
    file_mime VARCHAR(100),
    file_size_bytes INTEGER,
    state document_state NOT NULL DEFAULT 'REQUESTED',
    ocr_extracted_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    validation_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    rejection_reason_code VARCHAR(100),
    rejection_notes TEXT,
    uploaded_at TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Partners Table (Institutions: Universities / Colleges)
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_name VARCHAR(255) NOT NULL,
    country VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255),
    agreement_reference VARCHAR(100),
    sla_hours INTEGER NOT NULL DEFAULT 48,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Referrals Table (Phase 4 — Attribution & Commission)
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES users(id),
    student_id UUID NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
    attribution_token VARCHAR(100) NOT NULL UNIQUE,
    state referral_state NOT NULL DEFAULT 'CREATED',
    commission_amount NUMERIC(10, 2),
    commission_currency VARCHAR(3) DEFAULT 'USD',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Partner Routings Table
CREATE TABLE routings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES partners(id),
    referral_id UUID REFERENCES referrals(id),
    status routing_status NOT NULL DEFAULT 'PROPOSED',
    dossier_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    decision_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Immutable Case Audit Events (Builder Stage 10 & Sheet 6/7)
CREATE TABLE case_events (
    id BIGSERIAL PRIMARY KEY,
    case_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES users(id),
    actor_type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM', -- 'STUDENT', 'REVIEWER', 'AI_AGENT', 'SYSTEM'
    event_type VARCHAR(100) NOT NULL,
    from_state VARCHAR(50),
    to_state VARCHAR(50),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Immutability Trigger for Case Events (No updates or deletes allowed)
CREATE OR REPLACE FUNCTION prevent_case_event_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit trail violation: case_events table is append-only.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_events_immutable
BEFORE UPDATE OR DELETE ON case_events
FOR EACH ROW EXECUTE FUNCTION prevent_case_event_mutation();

-- 12. Indexes for Performance
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_documents_student_id ON documents(student_id);
CREATE INDEX idx_documents_state ON documents(state);
CREATE INDEX idx_case_events_case_id ON case_events(case_id);
CREATE INDEX idx_referrals_attribution_token ON referrals(attribution_token);
CREATE INDEX idx_routings_student_id ON routings(student_id);
