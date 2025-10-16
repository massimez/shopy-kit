import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface BatchesResponse {
	data: any[];
}

export const useBatches = (productVariantId: string) => {
	return useQuery<BatchesResponse, Error>({
		queryKey: ["batches", productVariantId],
		queryFn: async () => {
			const response = await hc.api.store.inventory.batches[
				":productVariantId"
			].$get({
				param: { productVariantId },
			});

			if (!response.ok) {
				const errorText = await response
					.text()
					.catch(() => response.statusText);
				throw new Error(`Failed to fetch batches: ${errorText}`);
			}

			const json = await response.json();

			if ("error" in json) {
				throw new Error(json.error.message || "Failed to fetch batches");
			}

			return json as BatchesResponse;
		},
		enabled: !!productVariantId,
	});
};
