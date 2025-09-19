import { z } from "zod";

export const shippingAddressSchema = z.object({
	street: z.string().min(1),
	city: z.string().min(1),
	state: z.string().min(1),
	country: z.string().min(1),
	postalCode: z.string().min(1),
});

export const orderItemSchema = z.object({
	productId: z.uuid(),
	quantity: z.number().int().positive(),
	locationId: z.uuid(),
});

export const createOrderSchema = z.object({
	shippingAddress: shippingAddressSchema,
	items: z.array(orderItemSchema).min(1),
	currency: z.string().length(3),
	customerEmail: z.string().email().optional(),
	customerPhone: z.string().optional(),
	locationId: z.uuid(),
});

export const updateOrderSchema = z.object({
	status: z
		.enum(["pending", "processing", "completed", "cancelled"])
		.optional(),
	shippingAddress: shippingAddressSchema.optional(),
});
