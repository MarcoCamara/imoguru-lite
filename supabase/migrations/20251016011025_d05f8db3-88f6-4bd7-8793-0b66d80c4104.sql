-- Create bucket for system branding assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'system-branding',
  'system-branding',
  true,
  2097152, -- 2MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/x-icon']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for system-branding bucket
CREATE POLICY "Admins can upload system branding"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'system-branding' AND
  (storage.foldername(name))[1] IN ('logo', 'favicon') AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can update system branding"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'system-branding' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Admins can delete system branding"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'system-branding' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Anyone can view system branding"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'system-branding');