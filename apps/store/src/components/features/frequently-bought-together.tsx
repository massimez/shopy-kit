"use client";

import type { Product } from "./product-card";
import { ProductCarousel } from "./product-carousel";

interface FrequentlyBoughtTogetherProps {
	currentProductId?: string;
}

// In a real app, this would come from an API based on the current product
const relatedProducts: Product[] = [
	{
		id: "fb-1",
		name: "Cable Management Kit",
		price: 24.99,
		category: "Electronics",
		description:
			"Complete cable management solution for your home/office setup",
		rating: 4.6,
		reviews: 87,
		isOnSale: true,
		discountPercentage: 10,
	},
	{
		id: "fb-2",
		name: "Wall Mount Adapter",
		price: 34.99,
		category: "Electronics",
		description: "Universal wall mount adapter for easy installation",
		rating: 4.4,
		reviews: 45,
	},
	{
		id: "fb-3",
		name: "Cleaning Kit",
		price: 19.99,
		category: "Home",
		description: "Professional cleaning kit for electronics",
		rating: 4.3,
		reviews: 134,
	},
	{
		id: "fb-4",
		name: "Extended Warranty",
		price: 49.99,
		category: "Services",
		description: "2-year extended warranty for peace of mind",
		rating: 4.8,
		reviews: 201,
	},
];

export function FrequentlyBoughtTogether({
	currentProductId,
}: FrequentlyBoughtTogetherProps) {
	// Filter out the current product if it's in the related products
	const filteredProducts = relatedProducts.filter(
		(product) => product.id !== currentProductId,
	);

	return (
		<ProductCarousel
			products={filteredProducts}
			title="Frequently Bought Together"
			showWishlist
			compact
			className="py-8"
		/>
	);
}
