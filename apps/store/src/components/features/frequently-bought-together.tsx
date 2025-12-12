"use client";

import { ProductCarousel } from "./product-carousel";

interface FrequentlyBoughtTogetherProps {
	currentProductId?: string;
}

export function FrequentlyBoughtTogether({
	currentProductId,
}: FrequentlyBoughtTogetherProps) {
	// Filter out the current product if it's in the related products

	return (
		<ProductCarousel
			products={[]}
			title="Frequently Bought Together"
			showWishlist
			compact
			className=""
			showArrows={false}
			showDots={true}
		/>
	);
}
