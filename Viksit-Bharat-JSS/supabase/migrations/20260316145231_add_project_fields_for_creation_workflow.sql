/*
  # Add Project Creation Workflow Fields

  ## Overview
  This migration adds fields to the projects table to support the complete
  project creation workflow with approval process, work details, materials,
  and site documentation.

  ## Changes Made

  ### 1. Projects Table Modifications
    - Add `estimated_workers` (integer) - Number of workers needed for the project
    - Add `work_details` (jsonb) - Type and quantity of work to be done
    - Add `materials_required` (text[]) - Array of required materials
    - Add `site_photos` (text[]) - Array of site photo URLs with geolocation
    - Make `managed_by` nullable (assigned after approval)
    - Update status enum to include approval workflow statuses

  ### 2. Project Status Enum Update
    - Add `pending_block_approval` - Project submitted by Village Officer
    - Add `pending_district_approval` - Project approved by Block Officer
    - Keep existing statuses: planned, active, completed, suspended

  ## Notes
  - Village Officers create projects that need Block Officer approval
  - Block Officers can approve and forward to District Officers
  - District Officers give final approval before projects become active
  - Site photos include geolocation metadata for verification
*/

-- Add new project statuses
DO $$ BEGIN
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'pending_block_approval';
  ALTER TYPE project_status ADD VALUE IF NOT EXISTS 'pending_district_approval';
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add estimated_workers column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'estimated_workers'
  ) THEN
    ALTER TABLE projects ADD COLUMN estimated_workers integer DEFAULT 0;
  END IF;
END $$;

-- Add work_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'work_details'
  ) THEN
    ALTER TABLE projects ADD COLUMN work_details jsonb DEFAULT '{}';
  END IF;
END $$;

-- Add materials_required column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'materials_required'
  ) THEN
    ALTER TABLE projects ADD COLUMN materials_required text[] DEFAULT '{}';
  END IF;
END $$;

-- Add site_photos column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'site_photos'
  ) THEN
    ALTER TABLE projects ADD COLUMN site_photos text[] DEFAULT '{}';
  END IF;
END $$;

-- Make managed_by nullable (assigned after approval)
ALTER TABLE projects ALTER COLUMN managed_by DROP NOT NULL;

-- Add RLS policy for Village Officers to create projects
CREATE POLICY "Village Officers can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.role = 'village_officer'
      AND officers.id = created_by
    )
  );

-- Add RLS policy for officers to view projects in their jurisdiction
CREATE POLICY "Officers can view projects in jurisdiction"
  ON projects FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND (
        (officers.role = 'village_officer' AND officers.jurisdiction->>'village' = projects.village)
        OR (officers.role = 'block_officer' AND officers.jurisdiction->>'block' = projects.block)
        OR (officers.role = 'district_officer' AND officers.jurisdiction->>'district' = projects.district)
      )
    )
  );

-- Add RLS policy for Block Officers to update project status
CREATE POLICY "Block Officers can approve projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.role = 'block_officer'
      AND officers.jurisdiction->>'block' = projects.block
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.role = 'block_officer'
      AND officers.jurisdiction->>'block' = projects.block
    )
  );

-- Add RLS policy for District Officers to approve projects
CREATE POLICY "District Officers can approve projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.role = 'district_officer'
      AND officers.jurisdiction->>'district' = projects.district
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM officers
      WHERE officers.user_id = auth.uid()
      AND officers.role = 'district_officer'
      AND officers.jurisdiction->>'district' = projects.district
    )
  );