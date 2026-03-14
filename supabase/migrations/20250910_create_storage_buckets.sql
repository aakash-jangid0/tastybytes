-- Migration: Create Storage Buckets for Image Uploads
-- Description: Sets up RLS policies for storage buckets
-- Created: 2025-02-21
-- Note: Bucket creation should be done via Supabase Dashboard or API

-- Try to create website-assets bucket if it doesn't exist
-- Note: This will only work if executed in the Supabase context that has storage functions
-- If this fails, create the bucket manually via Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Click "New Bucket"
-- 3. Name it "website-assets"
-- 4. Set to Public
-- 5. Set file size limit to 5MB
-- 6. Set allowed MIME types to: image/jpeg, image/png, image/webp, image/gif

-- Set up RLS policies for website-assets bucket (these apply once bucket exists)
-- Allow public read access
CREATE POLICY "Public read access to website-assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'website-assets');

-- Allow authenticated users to upload to the bucket
CREATE POLICY "Authenticated users can upload to website-assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'website-assets' AND auth.role() = 'authenticated');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their own website-assets"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'website-assets' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'website-assets' AND auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own website-assets"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'website-assets' AND auth.role() = 'authenticated');
