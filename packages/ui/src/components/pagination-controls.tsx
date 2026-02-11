import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "./pagination";

export interface PaginationControlsProps {
	pagination: {
		limit: number;
		offset: number;
		page: number;
		goToPage: (page: number) => void;
		nextPage: () => void;
		previousPage: () => void;
	};
	total: number;
	className?: string;
	maxPages?: number; // Max page numbers to show before using ellipsis
}

export function PaginationControls({
	pagination,
	total,
	className,
	maxPages = 7,
}: PaginationControlsProps) {
	// Compute pagination values from total
	const totalPages = Math.ceil(total / pagination.limit);
	const hasNextPage = pagination.page < totalPages;
	const hasPreviousPage = pagination.page > 1;

	// Don't render if there's only one page or no data
	if (totalPages <= 1) {
		return null;
	}

	// Generate page numbers with ellipsis for large page counts
	const getPageNumbers = () => {
		if (totalPages <= maxPages) {
			// Show all pages if total is less than max
			return Array.from({ length: totalPages }, (_, i) => i + 1);
		}

		const pages: (number | "ellipsis")[] = [];
		const leftEllipsis = pagination.page > 3;
		const rightEllipsis = pagination.page < totalPages - 2;

		// Always show first page
		pages.push(1);

		if (leftEllipsis) {
			pages.push("ellipsis");
		}

		// Show pages around current page
		const startPage = Math.max(2, pagination.page - 1);
		const endPage = Math.min(totalPages - 1, pagination.page + 1);

		for (let i = startPage; i <= endPage; i++) {
			pages.push(i);
		}

		if (rightEllipsis) {
			pages.push("ellipsis");
		}

		// Always show last page
		if (totalPages > 1) {
			pages.push(totalPages);
		}

		return pages;
	};

	const pageNumbers = getPageNumbers();

	return (
		<Pagination className={className}>
			<PaginationContent>
				{/* Previous Button */}
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (hasPreviousPage) {
								pagination.previousPage();
							}
						}}
						aria-disabled={!hasPreviousPage}
						className={
							!hasPreviousPage ? "pointer-events-none opacity-50" : undefined
						}
					/>
				</PaginationItem>

				{/* Page Numbers */}
				{pageNumbers.map((pageNum, index) => {
					if (pageNum === "ellipsis") {
						return (
							<PaginationItem
								key={`ellipsis-${
									// biome-ignore lint/suspicious/noArrayIndexKey: <>
									index
								}`}
							>
								<PaginationEllipsis />
							</PaginationItem>
						);
					}

					return (
						<PaginationItem key={pageNum}>
							<PaginationLink
								href="#"
								isActive={pagination.page === pageNum}
								onClick={(e) => {
									e.preventDefault();
									pagination.goToPage(pageNum);
								}}
							>
								{pageNum}
							</PaginationLink>
						</PaginationItem>
					);
				})}

				{/* Next Button */}
				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (hasNextPage) {
								pagination.nextPage();
							}
						}}
						aria-disabled={!hasNextPage}
						className={
							!hasNextPage ? "pointer-events-none opacity-50" : undefined
						}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
