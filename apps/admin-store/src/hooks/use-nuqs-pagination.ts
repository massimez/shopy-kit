import { parseAsInteger, useQueryState } from "nuqs";
import { useCallback } from "react";

export const paginationPageParser = parseAsInteger.withDefault(1);

interface UseNuqsPaginationOptions {
	limit?: number;
	pageParam?: string;
}

export function useNuqsPagination({
	limit = 10,
	pageParam = "page",
}: UseNuqsPaginationOptions = {}) {
	const [page, setPage] = useQueryState(pageParam, paginationPageParser);

	const offset = ((page || 1) - 1) * limit;

	// Memoized navigation functions
	const nextPage = useCallback(() => {
		setPage((p) => (p ?? 1) + 1);
	}, [setPage]);

	const previousPage = useCallback(() => {
		setPage((p) => Math.max(1, (p ?? 1) - 1));
	}, [setPage]);

	const goToPage = useCallback(
		(p: number) => {
			setPage(p);
		},
		[setPage],
	);

	return {
		page: page || 1,
		limit,
		offset,
		nextPage,
		previousPage,
		goToPage,
		setPage,
	};
}
