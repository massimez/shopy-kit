import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface InventoryResponse {
	total: number;
	data: any[];
}

export const useInventory = () => {
	return useQuery<InventoryResponse, Error>({
		queryKey: ["inventory"],
		queryFn: async () => {
			const response = await hc.api.store.products.$get({
				query: { limit: "100", offset: "0" },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch inventory: ${errorText}`);
			}

			const json = await response.json();

			if ("error" in json) {
				throw new Error(json.error.message || "Failed to fetch inventory");
			}

			return json as InventoryResponse;
		},
	});
};
