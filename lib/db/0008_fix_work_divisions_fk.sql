-- Re-add the foreign key constraint for work_divisions parent_division_id
-- This was dropped in migration 0005 but is needed for Supabase relationships

ALTER TABLE "work_divisions" ADD CONSTRAINT "work_divisions_parent_division_id_work_divisions_id_fk" 
FOREIGN KEY ("parent_division_id") REFERENCES "public"."work_divisions"("id") 
ON DELETE SET NULL ON UPDATE NO ACTION;