import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

export interface ProductCategory {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	parentId?: string | null;
	translations?:
		| {
				languageCode: string;
				name: string;
				slug: string;
				description?: string;
				metaTitle?: string;
				metaDescription?: string;
		  }[]
		| null;
	createdAt: string;
	updatedAt: string | null;
}

export function useProductCategories(languageCode?: string) {
	return useQuery({
		queryKey: ["product-categories", languageCode],
		queryFn: async () => {
			const res = await hc.api.store["product-categories"].$get({
				query: {
					lang: languageCode,
				},
			});
			if (!res.ok) {
				console.error("Failed to fetch categories: Network response not ok");
				return { data: [] };
			}
			const result = await res.json();
			if ("error" in result && result.error) {
				console.error(
					"Failed to fetch categories: API returned an error",
					result.error,
				);
				return { data: [] };
			}
			if ("data" in result && Array.isArray(result.data)) {
				return { data: result.data as ProductCategory[] };
			}
			console.error(
				"Failed to fetch categories: Unexpected API response format",
				result,
			);
			return { data: [] };
		},
	});
}
