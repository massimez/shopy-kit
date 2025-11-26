import { useQuery } from "@tanstack/react-query";
import { storefrontClient } from "@/lib/storefront";

export function useOrganization(slug: string) {
	return useQuery({
		queryKey: ["organization", slug],
		queryFn: () => storefrontClient.getOrganization({ orgSlug: slug }),
	});
}

export function useProducts(
	params: Parameters<typeof storefrontClient.getProducts>[0],
	enabled = true,
) {
	return useQuery({
		queryKey: ["products", params],
		queryFn: () => storefrontClient.getProducts(params),
		enabled,
	});
}

export function useCollections(organizationId: string, enabled = true) {
	return useQuery({
		queryKey: ["collections", organizationId],
		queryFn: async () => {
			const collections = await storefrontClient.getCollections({
				organizationId,
			});
			return collections;
		},
		enabled,
	});
}

export function useDefaultLocation(organizationId: string, enabled = true) {
	return useQuery({
		queryKey: ["defaultLocation", organizationId],
		queryFn: () => storefrontClient.getDefaultLocation({ organizationId }),
		enabled: enabled && !!organizationId,
	});
}

export function useProduct(
	params: Parameters<typeof storefrontClient.getProduct>[0],
	enabled = true,
) {
	return useQuery({
		queryKey: ["product", params],
		queryFn: () => storefrontClient.getProduct(params),
		enabled,
	});
}

export function useOrders(
	params: Parameters<typeof storefrontClient.getOrders>[0],
	enabled = true,
) {
	return useQuery({
		queryKey: ["orders", params],
		queryFn: () => storefrontClient.getOrders(params),
		enabled,
	});
}

export function useOrder(
	params: { organizationId: string; orderId: string; userId?: string },
	enabled = true,
) {
	const { organizationId, orderId, userId } = params;

	return useQuery({
		queryKey: ["order", organizationId, orderId],
		queryFn: () =>
			storefrontClient.getOrder({ organizationId, orderId, userId }),
		enabled: enabled && !!organizationId && !!orderId,
	});
}
