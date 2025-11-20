import { useTranslations } from "next-intl";
import { CategoryGrid } from "@/components/features/category-grid";
import { FeaturedProducts } from "@/components/features/featured-products";
import { PromoBanner } from "@/components/features/promo-banner";
import { WhyShopWithUs } from "@/components/features/why-shop-with-us";

export default function HomePage() {
	const t = useTranslations("HomePage");

	return (
		<div className="flex min-h-screen flex-col">
			{/* Hero Section */}
			<section className="bg-background py-20 text-center">
				<div className="container mx-auto px-4">
					<h1 className="mb-6 font-bold text-6xl">{t("title")}</h1>
					<p className="mb-8 text-2xl text-muted-foreground">{t("subtitle")}</p>
				</div>
			</section>

			<CategoryGrid />
			<FeaturedProducts />
			<WhyShopWithUs />
			<PromoBanner />
		</div>
	);
}
