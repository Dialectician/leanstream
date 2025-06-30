// scripts/enable-realtime.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function enableRealtime() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const sqlCommands = [
    'ALTER PUBLICATION supabase_realtime ADD TABLE cards;',
    'ALTER PUBLICATION supabase_realtime ADD TABLE checklist_items;',
    'ALTER PUBLICATION supabase_realtime ADD TABLE comments;',
    'ALTER PUBLICATION supabase_realtime ADD TABLE attachments;',
    'ALTER PUBLICATION supabase_realtime ADD TABLE card_labels;',
    'ALTER PUBLICATION supabase_realtime ADD TABLE checklists;'
  ];

  for (const sql of sqlCommands) {
    try {
      console.log(`Executing: ${sql}`);
      const { data, error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error(`Error executing ${sql}:`, error);
      } else {
        console.log(`✓ Successfully executed: ${sql}`);
      }
    } catch (err) {
      console.error(`Error with ${sql}:`, err);
    }
  }
}

enableRealtime().catch(console.error);