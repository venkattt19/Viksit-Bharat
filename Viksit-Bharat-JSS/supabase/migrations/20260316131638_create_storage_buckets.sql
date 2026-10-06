/*
  # Create Storage Buckets for Viksit Bharat

  1. Storage Buckets
    - `worker-faces` - Store worker face ID images
    - `work-progress-images` - Store geotagged work progress photos
    - `attendance-photos` - Store attendance verification photos

  2. Security
    - Enable RLS on all buckets
    - Officers can upload and view files
    - Public read access for verification purposes
*/

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('worker-faces', 'worker-faces', true),
  ('work-progress-images', 'work-progress-images', true),
  ('attendance-photos', 'attendance-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Officers can upload worker faces"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'worker-faces' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Officers can view worker faces"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'worker-faces' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Public can view worker faces"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'worker-faces');

CREATE POLICY "Officers can upload work progress images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'work-progress-images' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Officers can view work progress images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'work-progress-images' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Public can view work progress images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'work-progress-images');

CREATE POLICY "Officers can upload attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Officers can view attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos' AND
  EXISTS (
    SELECT 1 FROM officers
    WHERE officers.user_id = auth.uid()
    AND officers.is_active = true
  )
);

CREATE POLICY "Public can view attendance photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'attendance-photos');
