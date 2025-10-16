import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

interface StockData {
	quantity: number;
	reservedQuantity: number;
}

export function useInventoryStock(productVariantId: string) {
	return useQuery({
		queryKey: ["inventory-stock", productVariantId],
		queryFn: async (): Promise<StockData> => {
			const response = await hc.api.store.inventory.stock[
				":productVariantId"
			].$get({
				param: { productVariantId },
			});
			if (!response.ok) {
				throw new Error("Failed to fetch stock data");
			}
			const data = await response.json();
			return data as StockData;
		},
		enabled: !!productVariantId,
	});
}
