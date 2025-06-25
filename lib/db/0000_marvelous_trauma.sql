-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "employees" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"first_name" text,
	"last_name" text,
	"rate_per_hour" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_divisions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"parent_division_id" bigint,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "work_divisions" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "work_orders" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"quantity" integer,
	"start_date" date,
	"due_date" date,
	"status" text DEFAULT 'Planned',
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "work_orders_order_number_key" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "work_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "time_entries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"work_order_id" bigint NOT NULL,
	"work_division_id" bigint NOT NULL,
	"employee_id" bigint NOT NULL,
	"date_worked" date NOT NULL,
	"hours_spent" numeric(5, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "time_entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "work_divisions" ADD CONSTRAINT "work_divisions_parent_division_id_fkey" FOREIGN KEY ("parent_division_id") REFERENCES "public"."work_divisions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_division_id_fkey" FOREIGN KEY ("work_division_id") REFERENCES "public"."work_divisions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_work_order_id_fkey" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "Allow full access for authenticated users" ON "employees" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow full access to authenticated users" ON "work_divisions" AS PERMISSIVE FOR ALL TO "authenticated" USING (true) WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow insert for authenticated users" ON "work_orders" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (true);--> statement-breakpoint
CREATE POLICY "Allow read access to authenticated users" ON "work_orders" AS PERMISSIVE FOR SELECT TO "authenticated";--> statement-breakpoint
CREATE POLICY "Allow read access to authenticated users" ON "time_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (true);--> statement-breakpoint
CREATE POLICY "Allow insert for authenticated users" ON "time_entries" AS PERMISSIVE FOR INSERT TO "authenticated";
*/