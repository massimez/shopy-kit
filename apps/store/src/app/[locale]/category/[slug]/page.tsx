"use client";

import { Separator } from "@workspace/ui/components/separator";
import { use } from "react";
import { CategoryHeader } from "@/components/features/category-header";
import { ProductBreadcrumbs } from "@/components/features/product-breadcrumbs";
import { SubcategoryRow } from "@/components/features/subcategory-row";
import { useCollections } from "@/lib/hooks/use-storefront";
import { CategorySidebar } from "../_components/category-sidebar";
import { LeafCategoryGrid } from "../_components/leaf-category-grid";
import { type Collection, getCollectionPath } from "../_components/utils";

interface PageProps {
	params: Promise<{
		slug: string;
		locale: string;
	}>;
}

export default function CategoryPage({ params }: PageProps) {
	const resolvedParams = use(params);
	const { slug } = resolvedParams;
	const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID || "";

	// Fetch all collections to find the current one and its tree
	const { data: collections = [], isLoading } = useCollections(
		organizationId,
		!!organizationId,
	);

	const collectionPath = getCollectionPath(collections, slug);
	const collection = collectionPath
		? collectionPath[collectionPath.length - 1]
		: null;

	const hasSubcategories =
		collection?.children && collection.children.length > 0;

	// Breadcrumbs
	const breadcrumbs = (collectionPath || []).map((c, index) => ({
		label: c.name,
		href:
			collectionPath && index < collectionPath.length - 1
				? `/category/${c.slug}`
				: undefined,
	}));

	const renderContent = () => {
		if (isLoading) {
			return (
				<div className="flex h-96 items-center justify-center">
					<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
				</div>
			);
		}

		if (!collection) {
			return (
				<div className="py-20 text-center">
					<h1 className="font-bold text-2xl">Category not found</h1>
				</div>
			);
		}

		// If it has subcategories, show the "Grouped View"
		if (hasSubcategories && collection.children) {
			return (
				<div className="space-y-3">
					<ProductBreadcrumbs items={breadcrumbs} />

					<CategoryHeader
						title={collection.name}
						subcategories={collection.children}
					/>

					<div className="space-y-2">
						{collection.children.map((child: Collection, index: number) => (
							<div key={child.id}>
								<SubcategoryRow
									collectionId={child.id}
									title={child.name}
									slug={child.slug}
									className="mt-4 mb-8"
								/>
							</div>
						))}
					</div>
				</div>
			);
		}

		// Leaf category view
		return (
			<div className="space-y-8">
				<ProductBreadcrumbs items={breadcrumbs} />
				<div className="space-y-6">
					<h1 className="font-bold text-3xl md:text-4xl">{collection.name}</h1>
					<LeafCategoryGrid collectionId={collection.id} />
				</div>
			</div>
		);
	};

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[260px_1fr]">
				<div className="hidden border-border/50 border-e pe-6 md:block">
					<CategorySidebar collections={collections} activeSlug={slug} />
				</div>
				<div className="min-w-0 sm:ps-8">{renderContent()}</div>
			</div>
		</div>
	);
}
