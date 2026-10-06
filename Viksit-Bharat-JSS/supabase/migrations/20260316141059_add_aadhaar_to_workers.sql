/*
  # Add Aadhaar Authentication for Workers

  ## Overview
  This migration adds Aadhaar number as the unique identifier for workers and enables
  worker self-registration through the signup page.

  ## Changes Made

  ### 1. Workers Table Modifications
    - Add `aadhaar_number` (text) - 12-digit unique Aadhaar identification number
    - Add `user_id` (uuid, fk) - References auth.users for worker authentication
    - Add unique constraint on aadhaar_number
    - Make `registered_by` nullable (for self-registration)
    - Make `phone` required (was optional)

  ### 2. Security
    - Update RLS policies to allow workers to view their own profile
    - Add policy for worker self-registration during signup
    - Maintain existing officer access policies

  ### 3. Indexes
    - Add index on aadhaar_number for fast lookups

  ## Notes
  - Aadhaar number serves as the primary worker identification
  - Workers can self-register using Aadhaar and phone number
  - Officers can still register workers on their behalf
  - Worker authentication is separate from officer authentication
*/

-- Add aadhaar_number and user_id to workers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'aadhaar_number'
  ) THEN
    ALTER TABLE workers ADD COLUMN aadhaar_number text UNIQUE NOT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE workers ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Make registered_by nullable for self-registration
ALTER TABLE workers ALTER COLUMN registered_by DROP NOT NULL;

-- Make phone required
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workers' AND column_name = 'phone' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE workers ALTER COLUMN phone SET NOT NULL;
  END IF;
END $$;

-- Create index on aadhaar_number
CREATE INDEX IF NOT EXISTS idx_workers_aadhaar ON workers(aadhaar_number);

-- Add RLS policy for workers to view their own profile
CREATE POLICY "Workers can view their own profile"
  ON workers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add RLS policy for worker self-registration
CREATE POLICY "Workers can register themselves"
  ON workers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Add RLS policy for workers to update their own profile
CREATE POLICY "Workers can update their own profile"
  ON workers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);