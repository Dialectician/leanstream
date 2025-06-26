CREATE TABLE "assemblies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"parent_assembly_id" bigint,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"contact_person" text,
	"email" text,
	"phone" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "item_assemblies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"item_id" bigint NOT NULL,
	"assembly_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "time_entries" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_divisions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_orders" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_order_number_key";--> statement-breakpoint
ALTER TABLE "work_divisions" DROP CONSTRAINT "work_divisions_parent_division_id_fkey";
--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_employee_id_fkey";
--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_work_division_id_fkey";
--> statement-breakpoint
ALTER TABLE "time_entries" DROP CONSTRAINT "time_entries_work_order_id_fkey";
--> statement-breakpoint
ALTER TABLE "work_orders" ADD COLUMN "client_id" bigint;--> statement-breakpoint
ALTER TABLE "assemblies" ADD CONSTRAINT "assemblies_parent_assembly_id_assemblies_id_fk" FOREIGN KEY ("parent_assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_assemblies" ADD CONSTRAINT "item_assemblies_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_assemblies" ADD CONSTRAINT "item_assemblies_assembly_id_assemblies_id_fk" FOREIGN KEY ("assembly_id") REFERENCES "public"."assemblies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_divisions" ADD CONSTRAINT "work_divisions_parent_division_id_work_divisions_id_fk" FOREIGN KEY ("parent_division_id") REFERENCES "public"."work_divisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_division_id_work_divisions_id_fk" FOREIGN KEY ("work_division_id") REFERENCES "public"."work_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP POLICY "Allow full access for authenticated users" ON "employees" CASCADE;--> statement-breakpoint
DROP POLICY "Allow full access to authenticated users" ON "work_divisions" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for authenticated users" ON "work_orders" CASCADE;--> statement-breakpoint
DROP POLICY "Allow read access to authenticated users" ON "work_orders" CASCADE;--> statement-breakpoint
DROP POLICY "Allow read access to authenticated users" ON "time_entries" CASCADE;--> statement-breakpoint
DROP POLICY "Allow insert for authenticated users" ON "time_entries" CASCADE;