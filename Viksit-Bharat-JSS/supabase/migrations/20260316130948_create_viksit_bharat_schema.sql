/*
  # Viksit Bharat - Rural Work Monitoring System Schema

  ## Overview
  This migration creates the complete database schema for a three-tier government
  work monitoring system with real-time face recognition, approval workflows,
  and fraud detection.

  ## New Tables

  ### 1. officers
  Government officials managing the system
  - `id` (uuid, pk) - Auto-generated officer ID
  - `user_id` (uuid, fk) - References auth.users
  - `officer_code` (text) - Unique officer identification code
  - `name` (text) - Full name
  - `role` (text) - village_officer, block_officer, district_officer
  - `phone` (text) - Contact number
  - `email` (text) - Email address
  - `jurisdiction` (jsonb) - Area of jurisdiction (village/block/district names)
  - `reporting_to` (uuid, fk) - Superior officer ID
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. workers
  Registered workers/farmers
  - `id` (uuid, pk) - Auto-generated worker ID
  - `worker_code` (text) - Unique worker identification (e.g., VB-2024-001)
  - `name` (text) - Full name
  - `father_name` (text) - Father's/Guardian's name
  - `date_of_birth` (date) - Date of birth
  - `gender` (text) - Gender
  - `phone` (text) - Contact number
  - `address` (jsonb) - Complete address details
  - `village` (text) - Village name
  - `block` (text) - Block name
  - `district` (text) - District name
  - `bank_account` (jsonb) - Bank account details for wage payment
  - `registered_by` (uuid, fk) - Officer who registered
  - `is_active` (boolean) - Active status
  - `created_at` (timestamptz) - Registration timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 3. worker_face_data
  Face recognition data for workers
  - `id` (uuid, pk) - Auto-generated ID
  - `worker_id` (uuid, fk) - References workers
  - `face_encoding` (text) - Base64 encoded face embedding/features
  - `face_image_url` (text) - Storage URL for face image
  - `captured_by` (uuid, fk) - Officer who captured
  - `quality_score` (numeric) - Face image quality (0-100)
  - `is_active` (boolean) - Active face data
  - `created_at` (timestamptz) - Capture timestamp

  ### 4. projects
  Work projects managed by government
  - `id` (uuid, pk) - Auto-generated project ID
  - `project_code` (text) - Unique project code
  - `name` (text) - Project name
  - `description` (text) - Project description
  - `project_type` (text) - Type of work (road, canal, building, etc.)
  - `village` (text) - Village name
  - `block` (text) - Block name
  - `district` (text) - District name
  - `location` (jsonb) - GPS coordinates
  - `budget` (numeric) - Total budget
  - `start_date` (date) - Project start date
  - `end_date` (date) - Project end date
  - `status` (text) - planned, active, completed, suspended
  - `created_by` (uuid, fk) - Officer who created
  - `managed_by` (uuid, fk) - Officer managing project
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 5. attendance
  Daily attendance records with face recognition
  - `id` (uuid, pk) - Auto-generated attendance ID
  - `worker_id` (uuid, fk) - References workers
  - `project_id` (uuid, fk) - References projects
  - `attendance_date` (date) - Date of attendance
  - `check_in_time` (timestamptz) - Check-in timestamp
  - `check_out_time` (timestamptz) - Check-out timestamp
  - `check_in_location` (jsonb) - GPS coordinates at check-in
  - `check_out_location` (jsonb) - GPS coordinates at check-out
  - `face_match_score` (numeric) - Face recognition confidence (0-100)
  - `attendance_type` (text) - present, half_day, absent
  - `recorded_by` (uuid, fk) - Officer who recorded
  - `face_image_url` (text) - Attendance face photo URL
  - `is_verified` (boolean) - Verification status
  - `created_at` (timestamptz) - Record timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 6. work_progress
  Work progress submissions with geotagged images
  - `id` (uuid, pk) - Auto-generated progress ID
  - `project_id` (uuid, fk) - References projects
  - `submitted_by` (uuid, fk) - Officer who submitted
  - `submission_date` (date) - Date of submission
  - `work_description` (text) - Description of work done
  - `workers_count` (integer) - Number of workers
  - `worker_ids` (jsonb) - Array of worker IDs
  - `images` (jsonb) - Array of geotagged image URLs with metadata
  - `location` (jsonb) - GPS coordinates
  - `measurement` (jsonb) - Work measurements (length, area, volume, etc.)
  - `status` (text) - pending, approved, rejected
  - `created_at` (timestamptz) - Submission timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 7. approvals
  Multi-level approval workflow
  - `id` (uuid, pk) - Auto-generated approval ID
  - `entity_type` (text) - Type: work_progress, wage, project
  - `entity_id` (uuid) - ID of entity being approved
  - `level` (integer) - Approval level (1=Village, 2=Block, 3=District)
  - `approver_id` (uuid, fk) - Officer ID
  - `status` (text) - pending, approved, rejected
  - `comments` (text) - Approval/rejection comments
  - `approved_at` (timestamptz) - Approval timestamp
  - `created_at` (timestamptz) - Creation timestamp

  ### 8. wages
  Wage calculations and payments
  - `id` (uuid, pk) - Auto-generated wage ID
  - `worker_id` (uuid, fk) - References workers
  - `project_id` (uuid, fk) - References projects
  - `period_start` (date) - Wage period start
  - `period_end` (date) - Wage period end
  - `days_worked` (numeric) - Total days worked
  - `daily_rate` (numeric) - Daily wage rate
  - `total_amount` (numeric) - Total wage amount
  - `deductions` (jsonb) - Any deductions
  - `net_amount` (numeric) - Net payable amount
  - `status` (text) - calculated, approved, paid
  - `calculated_by` (uuid, fk) - Officer who calculated
  - `payment_date` (date) - Payment date
  - `payment_ref` (text) - Payment reference number
  - `created_at` (timestamptz) - Calculation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 9. fraud_alerts
  Fraud detection alerts from AI analysis
  - `id` (uuid, pk) - Auto-generated alert ID
  - `alert_type` (text) - duplicate_face, location_mismatch, time_anomaly, etc.
  - `severity` (text) - low, medium, high, critical
  - `entity_type` (text) - worker, attendance, work_progress, wage
  - `entity_id` (uuid) - Related entity ID
  - `description` (text) - Alert description
  - `ai_confidence` (numeric) - AI confidence score (0-100)
  - `databricks_analysis` (jsonb) - Full AI analysis data
  - `status` (text) - new, investigating, resolved, false_positive
  - `investigated_by` (uuid, fk) - Officer investigating
  - `resolution_notes` (text) - Investigation notes
  - `created_at` (timestamptz) - Alert timestamp
  - `resolved_at` (timestamptz) - Resolution timestamp

  ### 10. audit_logs
  System audit trail
  - `id` (uuid, pk) - Auto-generated log ID
  - `officer_id` (uuid, fk) - Officer who performed action
  - `action` (text) - Action performed
  - `entity_type` (text) - Entity type
  - `entity_id` (uuid) - Entity ID
  - `old_data` (jsonb) - Previous data
  - `new_data` (jsonb) - New data
  - `ip_address` (text) - IP address
  - `created_at` (timestamptz) - Action timestamp

  ## Security
  - Enable RLS on all tables
  - Officers can only access data within their jurisdiction
  - Village officers have limited access
  - Block officers can view village-level data
  - District officers have full district access
  - All sensitive operations are logged
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
DO $$ BEGIN
  CREATE TYPE officer_role AS ENUM ('village_officer', 'block_officer', 'district_officer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gender_type AS ENUM ('male', 'female', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM ('planned', 'active', 'completed', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE attendance_type AS ENUM ('present', 'half_day', 'absent');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE wage_status AS ENUM ('calculated', 'approved', 'paid');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. Officers table
CREATE TABLE IF NOT EXISTS officers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  officer_code text UNIQUE NOT NULL,
  name text NOT NULL,
  role officer_role NOT NULL,
  phone text NOT NULL,
  email text NOT NULL,
  jurisdiction jsonb NOT NULL DEFAULT '{}',
  reporting_to uuid REFERENCES officers(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Workers table
CREATE TABLE IF NOT EXISTS workers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_code text UNIQUE NOT NULL,
  name text NOT NULL,
  father_name text NOT NULL,
  date_of_birth date NOT NULL,
  gender gender_type NOT NULL,
  phone text,
  address jsonb NOT NULL DEFAULT '{}',
  village text NOT NULL,
  block text NOT NULL,
  district text NOT NULL,
  bank_account jsonb DEFAULT '{}',
  registered_by uuid REFERENCES officers(id) NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Worker face data table
CREATE TABLE IF NOT EXISTS worker_face_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  face_encoding text NOT NULL,
  face_image_url text NOT NULL,
  captured_by uuid REFERENCES officers(id) NOT NULL,
  quality_score numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  project_type text NOT NULL,
  village text NOT NULL,
  block text NOT NULL,
  district text NOT NULL,
  location jsonb DEFAULT '{}',
  budget numeric(15,2) DEFAULT 0,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status project_status DEFAULT 'planned',
  created_by uuid REFERENCES officers(id) NOT NULL,
  managed_by uuid REFERENCES officers(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  attendance_date date NOT NULL,
  check_in_time timestamptz,
  check_out_time timestamptz,
  check_in_location jsonb DEFAULT '{}',
  check_out_location jsonb DEFAULT '{}',
  face_match_score numeric(5,2) DEFAULT 0,
  attendance_type attendance_type DEFAULT 'present',
  recorded_by uuid REFERENCES officers(id) NOT NULL,
  face_image_url text,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(worker_id, project_id, attendance_date)
);

-- 6. Work progress table
CREATE TABLE IF NOT EXISTS work_progress (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  submitted_by uuid REFERENCES officers(id) NOT NULL,
  submission_date date NOT NULL,
  work_description text NOT NULL,
  workers_count integer DEFAULT 0,
  worker_ids jsonb DEFAULT '[]',
  images jsonb DEFAULT '[]',
  location jsonb DEFAULT '{}',
  measurement jsonb DEFAULT '{}',
  status approval_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Approvals table
CREATE TABLE IF NOT EXISTS approvals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  level integer NOT NULL,
  approver_id uuid REFERENCES officers(id) NOT NULL,
  status approval_status DEFAULT 'pending',
  comments text,
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 8. Wages table
CREATE TABLE IF NOT EXISTS wages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_id uuid REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  days_worked numeric(5,2) DEFAULT 0,
  daily_rate numeric(10,2) DEFAULT 0,
  total_amount numeric(15,2) DEFAULT 0,
  deductions jsonb DEFAULT '{}',
  net_amount numeric(15,2) DEFAULT 0,
  status wage_status DEFAULT 'calculated',
  calculated_by uuid REFERENCES officers(id) NOT NULL,
  payment_date date,
  payment_ref text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. Fraud alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_type text NOT NULL,
  severity alert_severity NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  description text NOT NULL,
  ai_confidence numeric(5,2) DEFAULT 0,
  databricks_analysis jsonb DEFAULT '{}',
  status text DEFAULT 'new',
  investigated_by uuid REFERENCES officers(id),
  resolution_notes text,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- 10. Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  officer_id uuid REFERENCES officers(id),
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  old_data jsonb DEFAULT '{}',
  new_data jsonb DEFAULT '{}',
  ip_address text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_officers_role ON officers(role);
CREATE INDEX IF NOT EXISTS idx_officers_user_id ON officers(user_id);
CREATE INDEX IF NOT EXISTS idx_workers_code ON workers(worker_code);
CREATE INDEX IF NOT EXISTS idx_workers_village ON workers(village);
CREATE INDEX IF NOT EXISTS idx_workers_block ON workers(block);
CREATE INDEX IF NOT EXISTS idx_workers_district ON workers(district);
CREATE INDEX IF NOT EXISTS idx_worker_face_worker_id ON worker_face_data(worker_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_location ON projects(village, block, district);
CREATE INDEX IF NOT EXISTS idx_attendance_worker ON attendance(worker_id);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_work_progress_project ON work_progress(project_id);
CREATE INDEX IF NOT EXISTS idx_work_progress_status ON work_progress(status);
CREATE INDEX IF NOT EXISTS idx_approvals_entity ON approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_approvals_approver ON approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_wages_worker ON wages(worker_id);
CREATE INDEX IF NOT EXISTS idx_wages_project ON wages(project_id);
CREATE INDEX IF NOT EXISTS idx_wages_status ON wages(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_officer ON audit_logs(officer_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Enable Row Level Security
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_face_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Officers
CREATE POLICY "Officers can view their own profile"
  ON officers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Officers can update their own profile"
  ON officers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Workers
CREATE POLICY "Officers can view workers in their jurisdiction"
  ON workers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND (
        (officers.role = 'village_officer' AND workers.village = officers.jurisdiction->>'village')
        OR (officers.role = 'block_officer' AND workers.block = officers.jurisdiction->>'block')
        OR (officers.role = 'district_officer' AND workers.district = officers.jurisdiction->>'district')
      )
    )
  );

CREATE POLICY "Officers can register workers in their jurisdiction"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = registered_by
    )
  );

CREATE POLICY "Officers can update workers in their jurisdiction"
  ON workers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Worker Face Data
CREATE POLICY "Officers can view face data for workers in jurisdiction"
  ON worker_face_data FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM workers w
      JOIN officers o ON o.user_id = auth.uid()
      WHERE w.id = worker_face_data.worker_id
      AND o.is_active = true
    )
  );

CREATE POLICY "Officers can insert face data for workers"
  ON worker_face_data FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = captured_by
    )
  );

-- RLS Policies for Projects
CREATE POLICY "Officers can view projects in their jurisdiction"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND (
        (officers.role = 'village_officer' AND projects.village = officers.jurisdiction->>'village')
        OR (officers.role = 'block_officer' AND projects.block = officers.jurisdiction->>'block')
        OR (officers.role = 'district_officer' AND projects.district = officers.jurisdiction->>'district')
      )
    )
  );

CREATE POLICY "Officers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = created_by
    )
  );

CREATE POLICY "Officers can update projects they manage"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND (officers.id = managed_by OR officers.id = created_by)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Attendance
CREATE POLICY "Officers can view attendance in their jurisdiction"
  ON attendance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers o
      JOIN projects p ON p.id = attendance.project_id
      WHERE o.user_id = auth.uid()
      AND o.is_active = true
    )
  );

CREATE POLICY "Officers can record attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = recorded_by
    )
  );

CREATE POLICY "Officers can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Work Progress
CREATE POLICY "Officers can view work progress in their jurisdiction"
  ON work_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers o
      JOIN projects p ON p.id = work_progress.project_id
      WHERE o.user_id = auth.uid()
      AND o.is_active = true
    )
  );

CREATE POLICY "Officers can submit work progress"
  ON work_progress FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = submitted_by
    )
  );

CREATE POLICY "Officers can update work progress"
  ON work_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Approvals
CREATE POLICY "Officers can view approvals"
  ON approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

CREATE POLICY "Officers can create approvals"
  ON approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = approver_id
    )
  );

CREATE POLICY "Officers can update their approvals"
  ON approvals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = approver_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Wages
CREATE POLICY "Officers can view wages in their jurisdiction"
  ON wages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers o
      JOIN projects p ON p.id = wages.project_id
      WHERE o.user_id = auth.uid()
      AND o.is_active = true
    )
  );

CREATE POLICY "Officers can calculate wages"
  ON wages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
      AND officers.id = calculated_by
    )
  );

CREATE POLICY "Officers can update wages"
  ON wages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Fraud Alerts
CREATE POLICY "Officers can view fraud alerts"
  ON fraud_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

CREATE POLICY "System can create fraud alerts"
  ON fraud_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Officers can update fraud alerts"
  ON fraud_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

-- RLS Policies for Audit Logs
CREATE POLICY "Officers can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.is_active = true
    )
  );

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_officers_updated_at BEFORE UPDATE ON officers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workers_updated_at BEFORE UPDATE ON workers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_work_progress_updated_at BEFORE UPDATE ON work_progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wages_updated_at BEFORE UPDATE ON wages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
