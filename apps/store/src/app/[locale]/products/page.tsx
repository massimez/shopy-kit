import { Suspense } from "react";
import { ProductsView } from "@/components/features/products-view";

export default function ProductsPage() {
	return (
		<Suspense>
			<ProductsView />
		</Suspense>
	);
}
