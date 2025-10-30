-- Add archived column to public_contact_requests table
ALTER TABLE public.public_contact_requests
ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on archived status
CREATE INDEX IF NOT EXISTS idx_public_contact_requests_archived 
ON public.public_contact_requests (archived);

