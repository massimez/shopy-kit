import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Link } from "@/i18n/routing";

export function generateStaticParams() {
	return [{ slug: "all" }, { slug: "electronics" }, { slug: "clothing" }];
}

export default async function CategoryPage({
	params,
}: {
	params: Promise<{ slug: string }>;
}) {
	const { slug } = await params;
	// const t = await useTranslations("HomePage"); // Using HomePage for now, should have Category namespace

	return (
		<div className="container mx-auto px-4 py-10">
			<h1 className="mb-8 font-bold text-4xl capitalize">{slug}</h1>
			<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
				{/* Subcategories or related categories */}
				{["Subcategory 1", "Subcategory 2", "Subcategory 3"].map((sub) => (
					<Card
						key={sub}
						className="cursor-pointer transition-shadow hover:shadow-lg"
					>
						<CardHeader>
							<CardTitle>{sub}</CardTitle>
						</CardHeader>
						<CardContent className="flex h-32 items-center justify-center bg-muted/20">
							<span className="text-4xl">📂</span>
						</CardContent>
						<CardFooter>
							<Link
								href={`/products?category=${slug}&subcategory=${sub}`}
								className="w-full"
							>
								<Button className="w-full" variant="outline">
									Explore
								</Button>
							</Link>
						</CardFooter>
					</Card>
				))}
			</div>
		</div>
	);
}
