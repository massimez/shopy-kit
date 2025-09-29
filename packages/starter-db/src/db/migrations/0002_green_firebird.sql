DROP TABLE "product_category_translation" CASCADE;--> statement-breakpoint
DROP TABLE "product_translation" CASCADE;--> statement-breakpoint
DROP TABLE "product_variant_translation" CASCADE;--> statement-breakpoint
ALTER TABLE "product" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "product_category" ADD COLUMN "translations" jsonb;--> statement-breakpoint
ALTER TABLE "product_variant" ADD COLUMN "translations" jsonb;