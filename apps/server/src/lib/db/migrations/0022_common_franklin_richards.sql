ALTER TABLE "product_variant_batch" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_variant_batch" CASCADE;--> statement-breakpoint
ALTER TABLE "product_variant_stock_transaction" DROP COLUMN "batch_id";
--> statement-breakpoint
ALTER TABLE "salary_advance" ADD COLUMN "installments" numeric(12, 0) DEFAULT '1' NOT NULL;--> statement-breakpoint