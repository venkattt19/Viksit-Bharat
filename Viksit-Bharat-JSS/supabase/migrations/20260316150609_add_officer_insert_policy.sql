/*
  # Add Officer Insert Policy

  ## Overview
  This migration adds an INSERT policy to allow new officers to register themselves
  during the signup process.

  ## Changes Made

  ### 1. RLS Policy for Officers Table
    - Add INSERT policy allowing authenticated users to create their own officer profile
    - Ensures user can only create a profile linked to their own auth.uid()

  ## Security Notes
  - Officers can only insert their own profile (user_id must match auth.uid())
  - This allows the signup flow to work properly
  - Prevents users from creating profiles for other users
*/

-- Add RLS policy for officers to insert their own profile during signup
CREATE POLICY "Officers can create their own profile"
  ON officers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
