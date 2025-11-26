import { useQuery } from "@tanstack/react-query";
import { hc } from "@/lib/api-client";

interface UseOrdersParams {
	status?: string;
	limit?: string;
	offset?: string;
}

export const useOrders = ({
	status,
	limit = "10",
	offset = "0",
}: UseOrdersParams = {}) => {
	const query = {
		limit,
		offset,
		orderBy: "createdAt",
		direction: "desc" as const,
		...(status && { status }),
	};

	return useQuery({
		queryKey: ["orders", status, limit, offset],
		queryFn: async () => {
			const result = await hc.api.store.orders.$get({
				query,
			});
			return (await result.json()).data;
		},
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};
