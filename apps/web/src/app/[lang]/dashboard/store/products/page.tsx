"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@workspace/ui/components/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import Link from "next/link";
import { useState } from "react";
import { PageDashboardHeader } from "@/components/sections/page-dashboard-header";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { ProductList } from "./_components/product-list";
import { useProducts } from "./_components/use-products";

const ProductsPage = () => {
	const queryClient = useQueryClient();

	const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LOCALE);
	const [page, setPage] = useState(1);
	const limit = 10;
	const offset = (page - 1) * limit;

	const {
		data: productsData,
		isLoading,
		error,
	} = useProducts({
		languageCode: selectedLanguage,
		limit: limit.toString(),
		offset: offset.toString(),
	});

	const products = productsData?.data || [];
	const total = productsData?.total || 0;
	const totalPages = Math.ceil(total / limit);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;

	return (
		<div className="p-4">
			<div className="mb-4 flex flex-col justify-between">
				<PageDashboardHeader title="Products" />
				<div className="flex items-center gap-4">
					<Select
						onValueChange={setSelectedLanguage}
						defaultValue={selectedLanguage}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="select language" />
						</SelectTrigger>
						<SelectContent>
							{LOCALES.map((locale) => (
								<SelectItem key={locale.code} value={locale.code}>
									{locale.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Link href={`/${selectedLanguage}/dashboard/store/products/new`}>
						<Button>Add Product</Button>
					</Link>
				</div>
			</div>
			<ProductList
				products={products}
				selectedLanguage={selectedLanguage}
				onDeleteProduct={async (productId) => {
					await hc.api.store.products[":id"].$delete({
						param: { id: productId },
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
			/>
			{totalPages > 1 && (
				<Pagination className="mt-4">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setPage((p) => Math.max(1, p - 1));
								}}
								aria-disabled={page === 1}
								className={
									page === 1 ? "pointer-events-none opacity-50" : undefined
								}
							/>
						</PaginationItem>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
							<PaginationItem key={p}>
								<PaginationLink
									href="#"
									isActive={page === p}
									onClick={(e) => {
										e.preventDefault();
										setPage(p);
									}}
								>
									{p}
								</PaginationLink>
							</PaginationItem>
						))}
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setPage((p) => Math.min(totalPages, p + 1));
								}}
								aria-disabled={page === totalPages}
								className={
									page === totalPages
										? "pointer-events-none opacity-50"
										: undefined
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	);
};

export default ProductsPage;
