ALTER TABLE "product_translation" DROP CONSTRAINT "product_translation_language_id_language_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_info" ALTER COLUMN "active_languages" SET DATA TYPE jsonb;--> statement-breakpoint
ALTER TABLE "product_translation" ALTER COLUMN "language_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_translation" ALTER COLUMN "tags" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "product_translation" ADD CONSTRAINT "product_translation_language_id_language_code_fk" FOREIGN KEY ("language_id") REFERENCES "public"."language"("code") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_category_language_idx" ON "product_category_translation" USING btree ("organization_id","category_id","language_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_language_idx" ON "product_translation" USING btree ("organization_id","product_id","language_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_language_idx" ON "product_variant_translation" USING btree ("organization_id","product_variant_id","language_id");