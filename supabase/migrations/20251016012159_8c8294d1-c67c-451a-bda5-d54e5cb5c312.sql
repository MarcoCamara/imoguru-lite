-- Enable realtime for properties table
ALTER TABLE public.properties REPLICA IDENTITY FULL;

-- Add properties table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.properties;