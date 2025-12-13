DROP TABLE "bank_account" CASCADE;--> statement-breakpoint
DROP TABLE "bank_transaction" CASCADE;--> statement-breakpoint
ALTER TABLE "organization_info" ADD COLUMN "currency" varchar(10) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "payment" DROP COLUMN "bank_account_id";