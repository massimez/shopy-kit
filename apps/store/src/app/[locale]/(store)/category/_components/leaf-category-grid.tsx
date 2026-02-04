"use client";

import { useLocale } from "next-intl";
import { ProductCard } from "@/components/features/product-card";
import { useDefaultLocation, useProducts } from "@/lib/hooks/use-storefront";
import {
	getProductTranslation,
	getVariantTranslation,
} from "@/lib/storefront-types";

export function LeafCategoryGrid({ collectionId }: { collectionId: string }) {
	const { data: location } = useDefaultLocation(true);
	const locale = useLocale();

	const { data: products = [], isLoading } = useProducts(
		{
			collectionId,
			locationId: location?.id,
			limit: 100,
			offset: 0,
		},
		!!collectionId,
	);

	if (isLoading)
		return <div className="h-96 w-full animate-pulse rounded-xl bg-muted/10" />;

	if (products.length === 0)
		return (
			<div className="py-20 text-center text-muted-foreground">
				No products found.
			</div>
		);

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
			{products.map((p) => {
				// Inline mapping logic or extract utility
				const firstVariant = p.variants?.[0];

				const variantTranslation = getVariantTranslation(firstVariant, locale);

				const productTranslation = getProductTranslation(p, locale);

				const mappedProduct = {
					id: p.id,
					name: productTranslation?.name || "",
					price: firstVariant
						? Number.parseFloat(firstVariant.price)
						: p.minPrice || 0,
					category: "",
					description: "",
					image: p.thumbnailImage?.url,
					rating: 4.5,
					reviews: 0,
					isNew:
						new Date(p.createdAt).getTime() >
						Date.now() - 30 * 24 * 60 * 60 * 1000,
					productVariantId: firstVariant?.id,
					variantName: variantTranslation?.name,
					variantSku: firstVariant?.sku,
					variants: p.variants,
				};

				return (
					<div key={p.id} className="flex justify-center">
						<div className="w-full">
							<ProductCard product={mappedProduct} />
						</div>
					</div>
				);
			})}
		</div>
	);
}
