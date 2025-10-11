"use client";

import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { useDeleteProductCategory } from "@/app/[lang]/dashboard/store/product-categories/hooks/use-delete-product-category";
import {
	type ProductCategory,
	useProductCategories,
} from "@/app/[lang]/dashboard/store/product-categories/hooks/use-product-categories";
import { Button } from "@/components/ui/button";
import { DeleteDropdownMenuItem } from "@/components/ui/delete-confirmation-dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";
import { ProductCategoryModal } from "./product-category-modal";

const getTranslation = (
	category: ProductCategory,
	lang: string,
	field: "name" | "description",
) =>
	category.translations?.find((t) => t.languageCode === lang)?.[field] || "-";

export function ProductCategoriesList({
	selectedLanguage,
	setSelectedLanguage,
}: {
	selectedLanguage: string;
	setSelectedLanguage: (lang: string) => void;
}) {
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		category?: ProductCategory;
	}>({ isOpen: false });

	const { data: categoriesData, isLoading } =
		useProductCategories(selectedLanguage);
	const { deleteCategory, isDeletingCategory } =
		useDeleteProductCategory(selectedLanguage);

	const openModal = (category?: ProductCategory) =>
		setModalState({ isOpen: true, category });

	const closeModal = () => setModalState({ isOpen: false });

	return (
		<div className="space-y-4">
			<div className="flex justify-between">
				<Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="Select a language" />
					</SelectTrigger>
					<SelectContent>
						{LOCALES.map((locale) => (
							<SelectItem key={locale.code} value={locale.code}>
								{locale.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button onClick={() => openModal()}>Add Category</Button>
			</div>

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Name</TableHead>
						<TableHead>Description</TableHead>
						<TableHead>Created At</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{isLoading ? (
						<TableRow>
							<TableCell colSpan={4} className="text-center">
								Loading...
							</TableCell>
						</TableRow>
					) : (
						categoriesData?.data?.map((category) => (
							<TableRow key={category.id}>
								<TableCell>
									{getTranslation(category, selectedLanguage, "name")}
								</TableCell>
								<TableCell>
									{getTranslation(category, selectedLanguage, "description")}
								</TableCell>
								<TableCell>
									{new Date(category.createdAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<span className="sr-only">Open menu</span>
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => openModal(category)}>
												Edit
											</DropdownMenuItem>
											<DeleteDropdownMenuItem
												onConfirm={() => deleteCategory(category.id)}
												disabled={isDeletingCategory}
												description="This action cannot be undone. This will permanently delete the product category."
											/>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))
					)}
				</TableBody>
			</Table>

			<ProductCategoryModal
				open={modalState.isOpen}
				onOpenChange={closeModal}
				category={modalState.category}
				currentLanguage={selectedLanguage}
			/>
		</div>
	);
}
