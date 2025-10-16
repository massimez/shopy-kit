import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface InventoryTransactionsResponse {
	total: number;
	data: any[];
}

export const useInventoryTransactions = (productVariantId?: string) => {
	return useQuery<InventoryTransactionsResponse, Error>({
		queryKey: ["transactions", productVariantId || "all"],
		queryFn: async () => {
			const response = productVariantId
				? await hc.api.store.inventory["stock-transactions"][
						":productVariantId"
					].$get({
						param: { productVariantId },
						query: { limit: "300", offset: "0" },
					})
				: await hc.api.store.inventory["stock-transactions"].$get({
						query: { limit: "300", offset: "0" },
					});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch transactions: ${errorText}`);
			}

			const json = await response.json();

			if ("error" in json) {
				throw new Error(json.error.message || "Failed to fetch transactions");
			}
			return json;
		},
		enabled: true,
	});
};
