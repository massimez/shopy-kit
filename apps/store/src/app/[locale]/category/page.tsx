"use client";

import { Link } from "@/i18n/routing";
import { useCollections } from "@/lib/hooks/use-storefront";
import type { Collection } from "@/lib/storefront-types";
import { CategorySidebar } from "./_components/category-sidebar";

export default function CategoriesPage() {
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";
	const { data: collections = [], isLoading } = useCollections(
		organizationId,
		!!organizationId,
	);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8">
			{/* <h1 className="mb-8 font-bold text-3xl md:text-4xl">Browse Categories</h1> */}

			<div className="grid grid-cols-1 gap-8 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
				<div className="hidden md:block">
					{/* Pass empty activeSlug since we are on the root category page */}
					<CategorySidebar collections={collections as any} activeSlug="" />
				</div>

				<div className="min-w-0 space-y-16">
					{(collections as Collection[]).map((collection) => (
						<section key={collection.id} className="space-y-6">
							<Link
								href={`/category/${collection.slug}`}
								className="group inline-flex items-center gap-2"
							>
								<h2 className="font-bold text-2xl transition-colors hover:text-primary md:text-3xl">
									{collection.name}
								</h2>
							</Link>

							{collection.children && collection.children.length > 0 ? (
								<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
									{collection.children.map((child: Collection) => (
										<Link
											key={child.id}
											href={`/category/${child.slug}`}
											className="block"
										>
											<div className="group relative h-[180px] overflow-hidden rounded-2xl bg-muted/30 p-4 transition-all hover:bg-muted/50 hover:shadow-sm">
												<h3 className="relative z-10 w-3/4 font-medium text-base leading-tight md:text-lg">
													{child.name}
												</h3>

												<div className="absolute right-0 bottom-0 h-32 w-32 translate-x-4 translate-y-4 transform transition-transform duration-300 group-hover:scale-110">
													{child.image ? (
														<img
															src={child.image}
															alt={child.name}
															className="h-full w-full object-contain object-bottom"
														/>
													) : (
														<div className="flex h-full w-full items-end justify-end p-4 text-4xl opacity-50">
															📦
														</div>
													)}
												</div>
											</div>
										</Link>
									))}
								</div>
							) : (
								<p className="text-muted-foreground italic">
									No subcategories found.
								</p>
							)}
						</section>
					))}
				</div>
			</div>
		</div>
	);
}
