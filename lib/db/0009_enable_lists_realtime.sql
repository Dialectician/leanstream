-- Enable realtime for lists table
-- This allows Supabase to send real-time updates when lists are added/updated/deleted

ALTER PUBLICATION supabase_realtime ADD TABLE lists;