"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { PaginationControls } from "@workspace/ui/components/pagination-controls";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Search, X } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { toast } from "sonner";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";
import { useNuqsPagination } from "@/hooks/use-nuqs-pagination";
import { Link } from "@/i18n/navigation";
import { hc } from "@/lib/api-client";
import { CollectionFilter } from "../../_components/collection-filter";
import { useProductCollections } from "../../product-collections/hooks/use-product-collection";
import { ProductList } from "./product-list";
import { useProducts } from "./use-products";

export const ProductsClient = () => {
	const queryClient = useQueryClient();

	// Query state management
	const [selectedLanguage, setSelectedLanguage] = useQueryState(
		"filterLocale",
		parseAsString.withDefault(DEFAULT_LOCALE),
	);
	const [searchQuery, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ throttleMs: 500 }),
	);
	const [selectedCollection, setSelectedCollection] = useQueryState(
		"collection",
		parseAsString,
	);

	const { data: collectionsData } = useProductCollections(selectedLanguage);
	const collections = collectionsData?.data || [];

	const pagination = useNuqsPagination();

	const { data: productsData, isLoading } = useProducts({
		languageCode: selectedLanguage,
		limit: pagination.limit.toString(),
		offset: pagination.offset.toString(),
		search: searchQuery || undefined,
		collectionId: selectedCollection || undefined,
	});

	const products = productsData?.data || [];
	// Memoized computed values
	const hasActiveFilters = searchQuery || selectedCollection;

	// Handler functions
	const handleClearFilters = () => {
		setSearchQuery(null);
		setSelectedCollection(null);
		pagination.setPage(1);
	};

	const handleSearchChange = (value: string) => {
		setSearchQuery(value || null);
		pagination.setPage(1);
	};

	const handleClearSearch = () => {
		setSearchQuery(null);
		pagination.setPage(1);
	};

	const handleCollectionChange = (value: string | null) => {
		setSelectedCollection(value);
		pagination.setPage(1);
	};

	const handleLanguageChange = (value: string) => {
		setSelectedLanguage(value);
		pagination.setPage(1);
	};

	const handleDeleteProduct = async (productId: string) => {
		try {
			await hc.api.store.products[":id"].$delete({
				param: { id: productId },
			});

			// Invalidate and refetch
			await queryClient.invalidateQueries({ queryKey: ["products"] });

			toast.success("Product deleted successfully");
		} catch (error) {
			console.error("Failed to delete product:", error);
			toast.error("Failed to delete product. Please try again.");
		}
	};

	return (
		<div className="p-4">
			{/* Header Section */}
			<div className="mb-6 flex flex-col justify-between gap-4">
				<PageDashboardHeader title="Products" />

				{/* Filters and Actions */}
				<div className="flex flex-wrap items-center gap-4">
					{/* Search Input */}
					<div className="relative min-w-[200px] max-w-sm flex-1">
						<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
						<Input
							placeholder="Search products..."
							value={searchQuery}
							onChange={(e) => handleSearchChange(e.target.value)}
							className="pr-9 pl-9"
							aria-label="Search products"
						/>
						{searchQuery && (
							<button
								type="button"
								onClick={handleClearSearch}
								className="-translate-y-1/2 absolute top-1/2 right-3 text-muted-foreground transition-colors hover:text-foreground"
								aria-label="Clear search"
							>
								<X className="h-4 w-4" />
							</button>
						)}
					</div>

					{/* Collection Filter */}
					<CollectionFilter
						collections={collections}
						selectedCollectionId={selectedCollection || null}
						onSelect={handleCollectionChange}
					/>

					{/* Language Selector */}
					<Select onValueChange={handleLanguageChange} value={selectedLanguage}>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							{LOCALES.map((locale) => (
								<SelectItem key={locale.code} value={locale.code}>
									{locale.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>

					{/* Clear Filters Button */}
					{hasActiveFilters && (
						<Button
							variant="outline"
							onClick={handleClearFilters}
							aria-label="Clear all filters"
						>
							Clear Filters
						</Button>
					)}

					{/* Add Product Button */}
					<Link href="/dashboard/store/products/new">
						<Button>Add Product</Button>
					</Link>
				</div>
			</div>

			{/* Product List */}
			<ProductList
				products={products}
				selectedLanguage={selectedLanguage}
				isLoading={isLoading}
				onDeleteProduct={handleDeleteProduct}
			/>

			{/* Pagination - Now with total passed directly */}
			{!isLoading && products.length > 0 && (
				<PaginationControls
					pagination={pagination}
					total={productsData?.total ?? 0}
					className="mt-4"
				/>
			)}
		</div>
	);
};
