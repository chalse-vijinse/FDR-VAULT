-- ==============================================================================
-- SecureFDR PostgreSQL & Supabase Database Migration
-- SIH26265 - Smart Security Deposit & FDR Management Portal (AICTE Workflows)
-- Complete Schema with Row Level Security (RLS) & Role-Based Access Control
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.institutions (
  id SERIAL PRIMARY KEY,
  institution_code VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT 'Engineering & Technology',
  address TEXT NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  pincode VARCHAR(20) NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  contact_email VARCHAR(150) NOT NULL,
  contact_phone VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID UNIQUE, -- Maps to Supabase auth.users.id
  email VARCHAR(191) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL, -- 'SUPER_ADMIN', 'VERIFICATION_OFFICER', 'INSTITUTION_ADMIN'
  institution_id INT REFERENCES public.institutions(id) ON DELETE SET NULL,
  designation VARCHAR(100),
  phone VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'Active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSTITUTION USER ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.institution_user_assignments (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution_id INT NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  role_title VARCHAR(100) NOT NULL DEFAULT 'Authorized Signatory',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uniq_user_inst UNIQUE (user_id, institution_id)
);

-- 5. FDR RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.fdr_records (
  id SERIAL PRIMARY KEY,
  institution_id INT NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  record_type VARCHAR(80) NOT NULL DEFAULT 'Fixed Deposit Receipt',
  fdr_number VARCHAR(100),
  bank_name VARCHAR(150),
  branch_name VARCHAR(150),
  ifsc_code VARCHAR(50),
  deposit_amount NUMERIC(15, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  issue_date DATE NOT NULL,
  maturity_date DATE NOT NULL,
  deposit_holder_name VARCHAR(255) NOT NULL,
  deposit_purpose VARCHAR(255) NOT NULL,
  approval_reference VARCHAR(150),
  status VARCHAR(50) NOT NULL DEFAULT 'Draft',
  discrepancy_flag BOOLEAN DEFAULT FALSE,
  discrepancy_details TEXT,
  assigned_officer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  verification_status_label VARCHAR(100) NOT NULL DEFAULT 'Not Reviewed',
  additional_notes TEXT,
  created_by INT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.documents (
  id SERIAL PRIMARY KEY,
  fdr_id INT NOT NULL REFERENCES public.fdr_records(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL DEFAULT 'FDR Certificate',
  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  ocr_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  ocr_raw_text TEXT,
  ocr_extracted_json JSONB,
  discrepancy_summary TEXT,
  uploaded_by INT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. VERIFICATION TASKS
CREATE TABLE IF NOT EXISTS public.verification_tasks (
  id SERIAL PRIMARY KEY,
  fdr_id INT NOT NULL REFERENCES public.fdr_records(id) ON DELETE CASCADE,
  assigned_to INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_by INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  priority VARCHAR(50) NOT NULL DEFAULT 'Medium',
  due_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. VERIFICATION HISTORY
CREATE TABLE IF NOT EXISTS public.verification_history (
  id SERIAL PRIMARY KEY,
  fdr_id INT NOT NULL REFERENCES public.fdr_records(id) ON DELETE CASCADE,
  previous_status VARCHAR(50) NOT NULL,
  new_status VARCHAR(50) NOT NULL,
  action_by INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  findings TEXT,
  decision VARCHAR(100),
  independent_evidence_ref VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. RELEASE REQUESTS
CREATE TABLE IF NOT EXISTS public.release_requests (
  id SERIAL PRIMARY KEY,
  fdr_id INT NOT NULL REFERENCES public.fdr_records(id) ON DELETE CASCADE,
  institution_id INT NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  request_reference VARCHAR(100) NOT NULL UNIQUE,
  request_date DATE NOT NULL,
  reason_for_release TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
  clearance_remarks TEXT,
  assigned_officer_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  decision_by INT REFERENCES public.users(id) ON DELETE SET NULL,
  decision_date TIMESTAMPTZ,
  release_confirmation_ref VARCHAR(255),
  created_by INT REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. RELEASE REQUEST DOCUMENTS
CREATE TABLE IF NOT EXISTS public.release_request_documents (
  id SERIAL PRIMARY KEY,
  release_request_id INT NOT NULL REFERENCES public.release_requests(id) ON DELETE CASCADE,
  document_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT NOT NULL,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  institution_id INT REFERENCES public.institutions(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
  link_url VARCHAR(255),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES public.users(id) ON DELETE SET NULL,
  user_email VARCHAR(191),
  user_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  change_summary TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. SYSTEM SETTINGS
CREATE TABLE IF NOT EXISTS public.system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description VARCHAR(255),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fdr_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.release_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role from JWT claims or users table
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get current user institution ID
CREATE OR REPLACE FUNCTION public.current_user_institution_id()
RETURNS integer AS $$
  SELECT institution_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Institutions Policy
CREATE POLICY "Super Admins and Officers view all institutions"
ON public.institutions FOR SELECT
USING (public.current_user_role() IN ('SUPER_ADMIN', 'VERIFICATION_OFFICER') OR id = public.current_user_institution_id());

-- FDR Records Policy
CREATE POLICY "Institutions view only their own FDRs"
ON public.fdr_records FOR SELECT
USING (public.current_user_role() IN ('SUPER_ADMIN', 'VERIFICATION_OFFICER') OR institution_id = public.current_user_institution_id());

CREATE POLICY "Institutions insert their own FDRs"
ON public.fdr_records FOR INSERT
WITH CHECK (public.current_user_role() IN ('SUPER_ADMIN', 'VERIFICATION_OFFICER') OR institution_id = public.current_user_institution_id());

CREATE POLICY "Authorized FDR updates"
ON public.fdr_records FOR UPDATE
USING (
  public.current_user_role() = 'SUPER_ADMIN' OR
  public.current_user_role() = 'VERIFICATION_OFFICER' OR
  (public.current_user_role() = 'INSTITUTION_ADMIN' AND institution_id = public.current_user_institution_id() AND status IN ('Draft', 'Clarification Required', 'Additional Documents Required'))
);

-- Documents Policy
CREATE POLICY "Documents access control"
ON public.documents FOR SELECT
USING (
  public.current_user_role() IN ('SUPER_ADMIN', 'VERIFICATION_OFFICER') OR
  fdr_id IN (SELECT id FROM public.fdr_records WHERE institution_id = public.current_user_institution_id())
);

-- Notifications Policy
CREATE POLICY "Users view only their own notifications"
ON public.notifications FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_user_id = auth.uid()));

-- ==============================================================================
-- SUPABASE STORAGE BUCKET SETUP
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('fdr-documents', 'fdr-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policy
CREATE POLICY "Allow authenticated uploads to fdr-documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'fdr-documents');

CREATE POLICY "Allow authenticated downloads from fdr-documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'fdr-documents');
