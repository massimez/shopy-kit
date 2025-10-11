CREATE TABLE "uploads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_key" text NOT NULL,
	"bucket" varchar(100) NOT NULL,
	"content_type" varchar(100),
	"size" integer,
	"metadata" jsonb DEFAULT 'null'::jsonb,
	"user_id" uuid,
	"status" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
DROP TABLE "product_variant_attribute" CASCADE;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "uploads" ADD CONSTRAINT "uploads_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" DROP COLUMN "currency";