ALTER TABLE "assemblies" DROP CONSTRAINT "assemblies_parent_assembly_id_assemblies_id_fk";
--> statement-breakpoint
ALTER TABLE "work_divisions" DROP CONSTRAINT "work_divisions_parent_division_id_work_divisions_id_fk";
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "first_name" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "last_name" text;--> statement-breakpoint
ALTER TABLE "clients" DROP COLUMN "name";