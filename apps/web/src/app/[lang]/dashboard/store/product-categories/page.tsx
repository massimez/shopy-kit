"use client";

import { useState } from "react";
import { PageDashboardHeader } from "@/components/sections/page-dashboard-header";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { ProductCategoriesList } from "./_components/product-categories-list";
import { ProductCategoryModal } from "./_components/product-category-modal";

export default function ProductCategoriesPage() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LOCALE);

	return (
		<div className="space-y-4">
			<PageDashboardHeader
				title="Product Categories"
				description="Manage your product categories"
			/>
			<ProductCategoriesList
				selectedLanguage={selectedLanguage}
				setSelectedLanguage={setSelectedLanguage}
			/>
			<ProductCategoryModal
				currentLanguage={selectedLanguage}
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
			/>
		</div>
	);
}
