-- Create storage buckets for property files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']),
  ('property-videos', 'property-videos', true, 104857600, ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo']),
  ('property-documents', 'property-documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']);

-- Storage policies for property-images
CREATE POLICY "Anyone can view property images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-images' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their property images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their property images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for property-videos
CREATE POLICY "Anyone can view property videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-videos');

CREATE POLICY "Authenticated users can upload property videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-videos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their property videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their property videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-videos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for property-documents (private)
CREATE POLICY "Users can view their own property documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all property documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-documents'
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Authenticated users can upload property documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their property documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their property documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );