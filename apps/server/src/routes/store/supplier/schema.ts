import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { supplier } from "starter-db/schema";
import { idAndAuditFields } from "@/helpers/constant/fields";

export const insertSupplierSchema = createInsertSchema(supplier);
export const updateSupplierSchema = createSelectSchema(supplier)
	.omit(idAndAuditFields)
	.partial();
