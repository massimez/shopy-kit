"use client";

import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "@workspace/ui/components/carousel";
import { type Product, ProductCard } from "./product-card";

interface ProductCarouselProps {
	products: Product[];
	title?: string;
	showWishlist?: boolean;
	compact?: boolean;
	className?: string;
}

export function ProductCarousel({
	products,
	title,
	showWishlist = false,
	compact = false,
	className = "",
}: ProductCarouselProps) {
	if (products.length === 0) {
		return null;
	}

	return (
		<section className={`bg-muted/30 py-12 ${className}`}>
			<div className="container mx-auto px-4">
				{title && (
					<h2 className="mb-6 text-center font-bold text-xl md:mb-8 md:text-3xl">
						{title}
					</h2>
				)}
				<Carousel
					opts={{
						align: "start",
					}}
					className="mx-auto w-full max-w-6xl"
				>
					<CarouselContent>
						{products.map((product) => (
							<CarouselItem
								key={product.id}
								className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5"
							>
								<div className="p-1">
									<div className="max-w-[260px]">
										<ProductCard
											product={product}
											showWishlist={showWishlist}
											compact={compact}
										/>
									</div>
								</div>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</div>
		</section>
	);
}
