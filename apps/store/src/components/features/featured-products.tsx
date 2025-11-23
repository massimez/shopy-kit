"use client";

import type { Product } from "./product-card";
import { ProductCarousel } from "./product-carousel";

export function FeaturedProducts({ products }: { products: Product[] }) {
	if (!products || products.length === 0) return null;

	return (
		<ProductCarousel
			products={products}
			title="Featured Products"
			showWishlist
			compact
			showArrows={false}
			showDots
			enableAutoplay
		/>
	);
}
