import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
// Use the path alias to ensure the module is found
import * as schema from '@/lib/db/schema'; 
import "dotenv/config";

// Ensure the environment variable is loaded
if (!process.env.SUPABASE_DB_URL) {
  throw new Error("SUPABASE_DB_URL is not set");
}

const client = postgres(process.env.SUPABASE_DB_URL, { ssl: 'require' });
export const db = drizzle(client, { schema });