import { CategoryGrid } from "@/components/features/category/category-grid";
import { PromoBanner } from "@/components/features/promo-banner";

export default function HomePage() {
	return (
		<div className="flex min-h-screen flex-col gap-10">
			<PromoBanner className="-mx-4 -mt-4 rounded-2xl" />
			<CategoryGrid />
		</div>
	);
}
