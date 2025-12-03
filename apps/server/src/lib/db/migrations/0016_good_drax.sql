CREATE TABLE "payout_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"cash_amount" numeric(12, 2) NOT NULL,
	"points_deducted" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"payout_method" jsonb NOT NULL,
	"bonus_transaction_id" uuid NOT NULL,
	"processed_at" timestamp,
	"processed_by" text,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp,
	"created_by" text,
	"updated_by" text
);
--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_bonus_transaction_id_bonus_transaction_id_fk" FOREIGN KEY ("bonus_transaction_id") REFERENCES "public"."bonus_transaction"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;