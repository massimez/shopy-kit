"use client";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import {
	ProductCategoryForm,
	type ProductCategoryFormValues,
} from "./product-category-form";

interface ProductCategory {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	parentId?: string | null;
	translations?:
		| {
				languageCode: string;
				name: string;
				slug: string;
				description?: string;
				metaTitle?: string;
				metaDescription?: string;
		  }[]
		| null;
	createdAt: string;
	updatedAt: string | null;
}

interface ProductCategoryModalProps {
	category?: ProductCategory;
	onOpenChange: (isOpen: boolean) => void;
	open: boolean;
	currentLanguage: string;
}

export const ProductCategoryModal = ({
	category,
	open,
	onOpenChange,
	currentLanguage,
}: ProductCategoryModalProps) => {
	const queryClient = useQueryClient();
	const { data: activeOrganizationData } = useActiveOrganization();

	const isEdit = !!category;

	// Find the translation for the current language
	const currentTranslation = category?.translations?.find(
		(t) => t.languageCode === currentLanguage,
	);

	const initialValues: ProductCategoryFormValues = category
		? {
				parentId: category.parentId ?? null,
				translation: currentTranslation ?? {
					languageCode: currentLanguage,
					name: "",
					slug: "",
					description: "",
					metaTitle: "",
					metaDescription: "",
				},
			}
		: {
				parentId: null,
				translation: {
					languageCode: currentLanguage,
					name: "",
					slug: "",
					description: "",
					metaTitle: "",
					metaDescription: "",
				},
			};

	const onSubmit = async (values: ProductCategoryFormValues) => {
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		try {
			if (isEdit) {
				// Get existing translations
				const existingTranslations = category.translations || [];

				// Find index of current language translation
				const existingIndex = existingTranslations.findIndex(
					(t) => t.languageCode === currentLanguage,
				);

				// Update or add the translation
				let updatedTranslations: NonNullable<ProductCategory["translations"]>;
				if (existingIndex !== -1) {
					// Update existing translation
					updatedTranslations = [...existingTranslations];
					updatedTranslations[existingIndex] = values.translation;
				} else {
					// Add new translation
					updatedTranslations = [...existingTranslations, values.translation];
				}

				await hc.api.store["product-categories"][":id"].$put({
					param: { id: category.id },
					json: {
						parentId: values.parentId,
						translations: updatedTranslations,
					},
				});
				toast.success("Category updated successfully!");
			} else {
				// Creating new category
				await hc.api.store["product-categories"].$post({
					json: {
						parentId: values.parentId,
						name: values.translation.name,
						slug: values.translation.slug,
						organizationId: activeOrganizationData.id,
						translations: [values.translation],
					},
				});
				toast.success("Category created successfully!");
			}

			queryClient.invalidateQueries({ queryKey: ["product-categories"] });
			onOpenChange(false);
		} catch (error) {
			toast.error("An error occurred");
			console.error(error);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit
							? `Edit Category (${currentLanguage.toUpperCase()})`
							: `Add Category (${currentLanguage.toUpperCase()})`}
					</DialogTitle>
				</DialogHeader>
				<ProductCategoryForm
					onSubmit={onSubmit}
					initialValues={initialValues}
					currentLanguage={currentLanguage}
				/>
			</DialogContent>
		</Dialog>
	);
};
