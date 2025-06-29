CREATE TABLE "attachments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"card_id" bigint NOT NULL,
	"file_name" text NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"background_color" text DEFAULT '#0079bf',
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "card_labels" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"card_id" bigint NOT NULL,
	"label_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cards" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"list_id" bigint NOT NULL,
	"work_order_id" bigint,
	"title" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"due_date" timestamp with time zone,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"checklist_id" bigint NOT NULL,
	"text" text NOT NULL,
	"is_completed" boolean DEFAULT false,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"card_id" bigint NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"card_id" bigint NOT NULL,
	"content" text NOT NULL,
	"author_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "labels" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"board_id" bigint NOT NULL,
	"name" text NOT NULL,
	"color" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"board_id" bigint NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_archived" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_labels" ADD CONSTRAINT "card_labels_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "public"."labels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_list_id_lists_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."lists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cards" ADD CONSTRAINT "cards_work_order_id_work_orders_id_fk" FOREIGN KEY ("work_order_id") REFERENCES "public"."work_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_card_id_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."cards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "labels" ADD CONSTRAINT "labels_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lists" ADD CONSTRAINT "lists_board_id_boards_id_fk" FOREIGN KEY ("board_id") REFERENCES "public"."boards"("id") ON DELETE cascade ON UPDATE no action;