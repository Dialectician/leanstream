-- Run this SQL in your Supabase SQL Editor to enable realtime
-- Go to your Supabase dashboard > SQL Editor and run these commands:

ALTER PUBLICATION supabase_realtime ADD TABLE cards;
ALTER PUBLICATION supabase_realtime ADD TABLE lists;
ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
ALTER PUBLICATION supabase_realtime ADD TABLE attachments;
ALTER PUBLICATION supabase_realtime ADD TABLE card_labels;
ALTER PUBLICATION supabase_realtime ADD TABLE checklists;