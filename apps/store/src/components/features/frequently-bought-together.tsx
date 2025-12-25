"use client";

import { ProductCarousel } from "./product-carousel";

interface FrequentlyBoughtTogetherProps {
	currentProductId?: string;
}

export function FrequentlyBoughtTogether({
	currentProductId,
}: FrequentlyBoughtTogetherProps) {
	console.log(currentProductId);

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
