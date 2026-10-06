/*
  # Update Worker Registration - Officer Only

  ## Overview
  This migration updates worker registration to be officer-only, removing
  self-registration capabilities while maintaining Aadhaar as unique identifier.

  ## Changes Made

  ### 1. Security Policy Updates
    - Remove worker self-registration policy
    - Remove worker profile view policy (officers only can view)
    - Remove worker profile update policy (officers only can update)
    - Keep Aadhaar number as unique identifier
    - Keep user_id field for future authentication needs

  ### 2. Workers Table
    - Make `registered_by` required again (officers must register workers)

  ## Notes
  - Only officers can register workers
  - Only officers can view and update worker information
  - Aadhaar remains the unique worker identification
  - Workers are registered by village officials through the Workers page
*/

-- Drop worker self-service policies
DROP POLICY IF EXISTS "Workers can view their own profile" ON workers;
DROP POLICY IF EXISTS "Workers can register themselves" ON workers;
DROP POLICY IF EXISTS "Workers can update their own profile" ON workers;

-- Make registered_by required again
ALTER TABLE workers ALTER COLUMN registered_by SET NOT NULL;