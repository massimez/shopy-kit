import { hc } from "@/lib/api-client";

export class StorefrontError extends Error {
	issues?: Array<{
		code: string;
		path: (string | number)[];
		message: string;
	}>;

	constructor(
		message: string,
		issues?: Array<{
			code: string;
			path: (string | number)[];
			message: string;
		}>,
	) {
		super(message);
		this.name = "StorefrontError";
		this.issues = issues;
	}
}

export const storefrontClient = {
	getProducts: async (params: {
		organizationId: string;
		collectionId?: string;
		limit?: number;
		offset?: number;
		sort?: string;
		q?: string;
		minPrice?: number;
		maxPrice?: number;
		locationId?: string;
	}) => {
		const response = await hc.api.storefront.products.$get({
			query: {
				organizationId: params.organizationId,
				...(params.collectionId ? { collectionId: params.collectionId } : {}),
				...(params.sort ? { sort: params.sort } : {}),
				...(params.q ? { q: params.q } : {}),
				limit: (params.limit ?? 10).toString(),
				offset: (params.offset ?? 0).toString(),
				...(params.minPrice !== undefined
					? { minPrice: params.minPrice.toString() }
					: {}),
				...(params.maxPrice !== undefined
					? { maxPrice: params.maxPrice.toString() }
					: {}),
				...(params.locationId ? { locationId: params.locationId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch products");
		}
		return json.data;
	},

	getProduct: async (params: {
		organizationId: string;
		productId: string;
		locationId?: string;
	}) => {
		const response = await hc.api.storefront.products[":productId"].$get({
			param: { productId: params.productId },
			query: {
				organizationId: params.organizationId,
				...(params.locationId ? { locationId: params.locationId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch product");
		}
		return json.data;
	},

	getCollections: async (params: { organizationId: string }) => {
		const response = await hc.api.storefront.collections.$get({
			query: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch collections");
		}
		return json.data;
	},

	getOrganization: async (params: {
		orgSlug?: string;
		organizationId?: string;
	}) => {
		const response = await hc.api.storefront.organizations.info.$get({
			query: params,
		});
		console.log(response);
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch organization");
		}
		return json.data;
	},

	getDefaultLocation: async (params: { organizationId: string }) => {
		const response = await hc.api.storefront.locations.default.$get({
			query: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(
				json.error?.message || "Failed to fetch default location",
			);
		}
		return json.data;
	},

	createOrder: async (params: {
		organizationId: string;
		shippingAddress: {
			street: string;
			city: string;
			state: string;
			country: string;
			postalCode: string;
		};
		items: Array<{
			productVariantId: string;
			quantity: number;
			locationId: string;
		}>;
		currency: string;
		customerEmail?: string;
		customerPhone?: string;
		customerFullName?: string;
		locationId: string;
		userId?: string;
	}) => {
		const response = await hc.api.storefront.orders.$post({
			json: params,
		});
		const json = await response.json();
		if (!json.success) {
			throw new StorefrontError(
				json.error?.message || "Failed to create order",
				json.error?.issues,
			);
		}
		return json.data;
	},

	getOrders: async (params: {
		organizationId: string;
		userId: string;
		limit?: number;
		offset?: number;
	}) => {
		const response = await hc.api.storefront.orders.$get({
			query: {
				organizationId: params.organizationId,
				userId: params.userId,
				limit: (params.limit ?? 20).toString(),
				offset: (params.offset ?? 0).toString(),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch orders");
		}
		return json.data;
	},

	getOrder: async (params: {
		organizationId: string;
		orderId: string;
		userId?: string;
	}) => {
		const response = await hc.api.storefront.orders[":orderId"].$get({
			param: { orderId: params.orderId },
			query: {
				organizationId: params.organizationId,
				...(params.userId ? { userId: params.userId } : {}),
			},
		});
		const json = await response.json();
		if (!json.success) {
			throw new Error(json.error?.message || "Failed to fetch order");
		}
		return json.data;
	},
};
