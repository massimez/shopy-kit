"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { listFiles } from "@/lib/storage";

export function useMediaLibrary(options?: {
	limit?: number;
	status?: "pending" | "committed" | "deleted";
	search?: string;
	folderId?: string | null;
}) {
	const { limit = 24, status, search, folderId } = options || {};

	return useInfiniteQuery({
		queryKey: ["media-library", { limit, status, search, folderId }],
		queryFn: async ({ pageParam = 1 }) => {
			const data = await listFiles({
				page: pageParam,
				limit,
				status,
				search,
				folderId: folderId ?? undefined,
			});
			return {
				data: data,
				nextPage: data.length === limit ? pageParam + 1 : undefined,
			};
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage.nextPage,
		staleTime: 1000 * 60, // 1 minute
	});
}
