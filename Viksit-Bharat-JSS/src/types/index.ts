export type OfficerRole = 'village_officer' | 'block_officer' | 'district_officer';
export type Gender = 'male' | 'female' | 'other';
export type ProjectStatus = 'planned' | 'active' | 'completed' | 'suspended' | 'pending_block_approval' | 'pending_district_approval';
export type AttendanceType = 'present' | 'half_day' | 'absent';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected';
export type WageStatus = 'calculated' | 'approved' | 'paid';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Officer {
  id: string;
  user_id: string;
  officer_code: string;
  name: string;
  role: OfficerRole;
  phone: string;
  email: string;
  jurisdiction: {
    village?: string;
    block?: string;
    district?: string;
  };
  reporting_to?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Worker {
  id: string;
  worker_code: string;
  name: string;
  father_name: string;
  date_of_birth: string;
  gender: Gender;
  phone?: string;
  address: Record<string, any>;
  village: string;
  block: string;
  district: string;
  bank_account?: Record<string, any>;
  registered_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkerFaceData {
  id: string;
  worker_id: string;
  face_encoding: string;
  face_image_url: string;
  captured_by: string;
  quality_score: number;
  is_active: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  project_code: string;
  name: string;
  description?: string;
  project_type: string;
  village: string;
  block: string;
  district: string;
  location: {
    latitude?: number;
    longitude?: number;
  };
  budget: number;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  created_by: string;
  managed_by?: string;
  estimated_workers?: number;
  work_details?: {
    type: string;
    quantity: string;
  };
  materials_required?: string[];
  site_photos?: string[];
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  worker_id: string;
  project_id: string;
  attendance_date: string;
  check_in_time?: string;
  check_out_time?: string;
  check_in_location: {
    latitude?: number;
    longitude?: number;
  };
  check_out_location: {
    latitude?: number;
    longitude?: number;
  };
  face_match_score: number;
  attendance_type: AttendanceType;
  recorded_by: string;
  face_image_url?: string;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface WorkProgress {
  id: string;
  project_id: string;
  submitted_by: string;
  submission_date: string;
  work_description: string;
  workers_count: number;
  worker_ids: string[];
  images: Array<{
    url: string;
    latitude?: number;
    longitude?: number;
    timestamp?: string;
  }>;
  location: {
    latitude?: number;
    longitude?: number;
  };
  measurement: Record<string, any>;
  status: ApprovalStatus;
  created_at: string;
  updated_at: string;
}

export interface Approval {
  id: string;
  entity_type: string;
  entity_id: string;
  level: number;
  approver_id: string;
  status: ApprovalStatus;
  comments?: string;
  approved_at?: string;
  created_at: string;
}

export interface Wage {
  id: string;
  worker_id: string;
  project_id: string;
  period_start: string;
  period_end: string;
  days_worked: number;
  daily_rate: number;
  total_amount: number;
  deductions: Record<string, any>;
  net_amount: number;
  status: WageStatus;
  calculated_by: string;
  payment_date?: string;
  payment_ref?: string;
  created_at: string;
  updated_at: string;
}

export interface FraudAlert {
  id: string;
  alert_type: string;
  severity: AlertSeverity;
  entity_type: string;
  entity_id: string;
  description: string;
  ai_confidence: number;
  databricks_analysis: Record<string, any>;
  status: string;
  investigated_by?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface AuditLog {
  id: string;
  officer_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_data: Record<string, any>;
  new_data: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface WageConfig {
  id: string;
  district: string;
  daily_wage: number;
  effective_from: string;
  set_by: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  wage_id: string;
  amount: number;
  payment_date: string;
  reference_number: string;
  status: string;
  processed_by: string;
  created_at: string;
}
