"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
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
	const {
		data: productsQueryResult,
		isLoading,
		error,
	} = useProducts({ languageCode: selectedLanguage });

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
				// biome-ignore lint/suspicious/noExplicitAny: <>
				products={(productsQueryResult?.data as any) || []}
				selectedLanguage={selectedLanguage}
				onDeleteProduct={async (productId) => {
					await hc.api.store.products[":id"].$delete({
						param: { id: productId },
					});
					queryClient.invalidateQueries({ queryKey: ["products"] });
				}}
			/>
		</div>
	);
};

export default ProductsPage;
