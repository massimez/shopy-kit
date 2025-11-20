"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { CategoryCarousel } from "@/components/features/category-carousel";
import { type Product, ProductCard } from "@/components/features/product-card";
import { filters, ProductFilters } from "@/components/features/product-filters";

// Extended Product type for filters
interface ExtendedProduct extends Product {
	color?: string;
	material?: string;
	brand?: string;
	size?: string;
	subcategory?: string;
}

// Mock products data - in real app this would come from an API
const allProducts: ExtendedProduct[] = [
	{
		id: "1",
		name: "Wireless Headphones",
		price: 199.99,
		category: "Electronics",
		subcategory: "Headphones",
		description:
			"High-quality wireless headphones with noise cancellation technology for immersive listening experience",
		rating: 4.5,
		reviews: 123,
		isOnSale: true,
		discountPercentage: 20,
		color: "Black",
		brand: "Sony",
		material: "Plastic",
	},
	{
		id: "2",
		name: "Running Shoes",
		price: 89.99,
		category: "Sports",
		subcategory: "Running",
		description:
			"Comfortable running shoes with advanced cushioning and breathable materials",
		rating: 4.2,
		reviews: 89,
		isNew: true,
		color: "Blue",
		brand: "Nike",
		size: "M",
		material: "Mesh",
	},
	{
		id: "3",
		name: "Smart Watch",
		price: 249.99,
		category: "Electronics",
		subcategory: "Smartwatches",
		description:
			"Feature-rich smartwatch with health monitoring, GPS, and long battery life",
		rating: 4.7,
		reviews: 256,
		color: "Black",
		brand: "Apple",
		material: "Metal",
	},
	{
		id: "4",
		name: "Coffee Maker",
		price: 129.99,
		category: "Home",
		subcategory: "Kitchen",
		description:
			"Automatic coffee maker with programmable timer and multiple brewing modes",
		rating: 4.0,
		reviews: 67,
		isOnSale: true,
		discountPercentage: 15,
		color: "Black",
		brand: "Generic",
		material: "Plastic",
	},
	{
		id: "5",
		name: "Bluetooth Speaker",
		price: 59.99,
		category: "Electronics",
		subcategory: "Speakers",
		description:
			"Portable Bluetooth speaker with excellent sound quality and waterproof design",
		rating: 4.3,
		reviews: 145,
		color: "Red",
		brand: "JBL",
		material: "Plastic",
	},
	{
		id: "6",
		name: "Yoga Mat",
		price: 29.99,
		category: "Sports",
		subcategory: "Yoga",
		description:
			"Non-slip yoga mat made from eco-friendly materials, perfect for all exercise routines",
		rating: 4.1,
		reviews: 98,
		isNew: true,
		color: "Green",
		brand: "Generic",
		material: "Rubber",
	},
	{
		id: "7",
		name: "Laptop Stand",
		price: 39.99,
		category: "Electronics",
		subcategory: "Laptops",
		description:
			"Adjustable laptop stand with ergonomic design for better posture and cooling",
		rating: 4.4,
		reviews: 72,
		color: "Silver",
		brand: "Generic",
		material: "Metal",
	},
	{
		id: "8",
		name: "Water Bottle",
		price: 19.99,
		category: "Sports",
		subcategory: "Accessories",
		description:
			"Insulated stainless steel water bottle that keeps drinks cold for 24 hours",
		rating: 4.6,
		reviews: 203,
		isNew: true,
		isOnSale: true,
		discountPercentage: 25,
		color: "Blue",
		brand: "Generic",
		material: "Metal",
	},
	{
		id: "9",
		name: "Cotton T-Shirt",
		price: 24.99,
		category: "Clothing",
		subcategory: "Men",
		description: "Premium cotton t-shirt",
		rating: 4.5,
		reviews: 45,
		color: "White",
		brand: "Nike",
		material: "Cotton",
		size: "L",
	},
	{
		id: "10",
		name: "Leather Jacket",
		price: 199.99,
		category: "Clothing",
		subcategory: "Women",
		description: "Genuine leather jacket",
		rating: 4.8,
		reviews: 32,
		color: "Black",
		brand: "Generic",
		material: "Leather",
		size: "L",
	},
];

export function ProductsView() {
	const t = useTranslations("Navigation");
	const [categories, setCategories] = useQueryState(
		"category",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [colors] = useQueryState(
		"color",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [materials] = useQueryState(
		"material",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [brands] = useQueryState(
		"brand",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [sizes] = useQueryState(
		"size",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [sortOrder, setSortOrder] = useQueryState("sort");
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isSortOpen, setIsSortOpen] = useState(false);

	const filteredProducts = allProducts.filter((p) => {
		if (categories.length > 0) {
			const matchesCategory = categories.includes(p.category);
			const matchesSubcategory =
				p.subcategory && categories.includes(p.subcategory);
			if (!matchesCategory && !matchesSubcategory) return false;
		}
		if (colors.length > 0 && (!p.color || !colors.includes(p.color)))
			return false;
		if (
			materials.length > 0 &&
			(!p.material || !materials.includes(p.material))
		)
			return false;
		if (brands.length > 0 && (!p.brand || !brands.includes(p.brand)))
			return false;
		if (sizes.length > 0 && (!p.size || !sizes.includes(p.size))) return false;
		return true;
	});

	// Sort products
	const sortedProducts = [...filteredProducts].sort((a, b) => {
		switch (sortOrder) {
			case "price-low":
				return a.price - b.price;
			case "price-high":
				return b.price - a.price;
			case "rating":
				return (b.rating || 0) - (a.rating || 0);
			case "newest":
				return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
			default:
				return 0;
		}
	});

	// Calculate active filter count
	const activeFilterCount =
		categories.length +
		colors.length +
		materials.length +
		brands.length +
		sizes.length;

	const handleCategorySelect = (category: string) => {
		if (categories.includes(category)) {
			const newCategories = categories.filter((c) => c !== category);
			setCategories(newCategories.length > 0 ? newCategories : null);
		} else {
			setCategories([...categories, category]);
		}
	};

	return (
		<div className="container mx-auto px-4 py-10">
			<h1 className="mb-8 font-bold text-4xl">{t("products")}</h1>

			<CategoryCarousel
				categories={filters.categories}
				selectedCategories={categories}
				onSelectCategory={handleCategorySelect}
				className="mb-10"
			/>

			{/* Mobile Filter and Sort Buttons */}
			<div className="mb-6 flex items-center gap-3 md:hidden">
				{/* Filter Button with Drawer */}
				<Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="relative flex-1">
							<SlidersHorizontal className="mr-2 size-4" />
							Filters
							{activeFilterCount > 0 && (
								<Badge
									variant="destructive"
									className="ml-2 size-5 rounded-full p-0 text-xs"
								>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="w-[300px] overflow-y-auto">
						<SheetHeader>
							<SheetTitle>Filters</SheetTitle>
						</SheetHeader>
						<div className="mt-6">
							<ProductFilters />
						</div>
					</SheetContent>
				</Sheet>

				{/* Sort Button with Drawer */}
				<Sheet open={isSortOpen} onOpenChange={setIsSortOpen}>
					<SheetTrigger asChild>
						<Button variant="outline" className="relative flex-1">
							<ArrowUpDown className="mr-2 size-4" />
							Sort
							{sortOrder && (
								<Badge
									variant="secondary"
									className="ml-2 size-2 rounded-full p-0"
								/>
							)}
						</Button>
					</SheetTrigger>
					<SheetContent side="right" className="w-[300px]">
						<SheetHeader>
							<SheetTitle>Sort By</SheetTitle>
						</SheetHeader>
						<div className="mt-6 space-y-2">
							<Button
								variant={sortOrder === null ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder(null);
									setIsSortOpen(false);
								}}
							>
								Default
							</Button>
							<Button
								variant={sortOrder === "newest" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("newest");
									setIsSortOpen(false);
								}}
							>
								Newest First
							</Button>
							<Button
								variant={sortOrder === "price-low" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("price-low");
									setIsSortOpen(false);
								}}
							>
								Price: Low to High
							</Button>
							<Button
								variant={sortOrder === "price-high" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("price-high");
									setIsSortOpen(false);
								}}
							>
								Price: High to Low
							</Button>
							<Button
								variant={sortOrder === "rating" ? "primary" : "ghost"}
								className="w-full justify-start"
								onClick={() => {
									setSortOrder("rating");
									setIsSortOpen(false);
								}}
							>
								Highest Rated
							</Button>
						</div>
					</SheetContent>
				</Sheet>

				{/* Active Filters Display */}
				{activeFilterCount > 0 && (
					<div className="flex items-center gap-2">
						<span className="text-muted-foreground text-sm">
							{activeFilterCount} active
						</span>
					</div>
				)}
			</div>

			<div className="flex flex-col gap-8 md:flex-row">
				{/* Sidebar Filters - Hidden on mobile */}
				<aside className="hidden w-full shrink-0 space-y-6 md:block md:w-64">
					<ProductFilters />
				</aside>

				{/* Product Grid */}
				<div className="flex-1">
					<div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
						{sortedProducts.length > 0 ? (
							sortedProducts.map((product) => (
								<div key={product.id} className="flex justify-center">
									<div className="w-full max-w-[280px]">
										<ProductCard product={product} showWishlist />
									</div>
								</div>
							))
						) : (
							<div className="col-span-full py-12 text-center text-muted-foreground">
								<p>No products found matching your filters.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
