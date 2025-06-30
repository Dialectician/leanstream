-- Enable realtime for Trello board tables
-- This allows Supabase to send real-time updates when these tables change

-- Enable realtime for cards table
ALTER PUBLICATION supabase_realtime ADD TABLE cards;

-- Enable realtime for checklist_items table  
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;

-- Enable realtime for comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- Enable realtime for attachments table
ALTER PUBLICATION supabase_realtime ADD TABLE attachments;

-- Enable realtime for card_labels table
ALTER PUBLICATION supabase_realtime ADD TABLE card_labels;

-- Enable realtime for checklists table
ALTER PUBLICATION supabase_realtime ADD TABLE checklists;