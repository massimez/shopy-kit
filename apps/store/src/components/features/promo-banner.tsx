import { Button } from "@workspace/ui/components/button";
import { Link } from "@/i18n/routing";

export function PromoBanner() {
	return (
		<section className="bg-primary py-20 text-primary-foreground">
			<div className="container mx-auto px-4 text-center">
				<h2 className="mb-4 font-bold text-4xl">Summer Sale is Here!</h2>
				<p className="mb-8 text-xl opacity-90">
					Get up to 50% off on selected items. Limited time offer.
				</p>
				<Link href="/products">
					<Button size="lg" variant="secondary" className="font-bold">
						Shop Sale
					</Button>
				</Link>
			</div>
		</section>
	);
}
