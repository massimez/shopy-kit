"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { LOCALES } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import { ProductForm, type ProductFormValues } from "./product-form";
import type { Product } from "./use-products";

interface ProductModalProps {
	product?: Product;
	onOpenChange: (isOpen: boolean) => void;
	open: boolean;
	selectedLanguage: string;
}

export const ProductModal = ({
	product,
	open,
	onOpenChange,
	selectedLanguage,
}: ProductModalProps) => {
	const t = useTranslations("common");
	const queryClient = useQueryClient();
	const { data: activeOrganizationData } = useActiveOrganization();
	const isEdit = !!product;

	const languageName = LOCALES.find(
		(locale) => locale.code === selectedLanguage,
	)?.name;

	// Transform product data to match form schema
	const getInitialValues = (): Partial<ProductFormValues> | undefined => {
		if (!product) return undefined;

		// Convert translations array to record format
		const translationsRecord: Record<string, any> = {};

		if (product.translations && Array.isArray(product.translations)) {
			product.translations.forEach((translation: any) => {
				translationsRecord[translation.languageCode] = {
					name: translation.name || "",
					slug: translation.slug || "",
					shortDescription: translation.shortDescription,
					description: translation.description,
					brandName: translation.brandName,
					images: translation.images,
					seoTitle: translation.seoTitle,
					seoDescription: translation.seoDescription,
					tags: translation.tags,
				};
			});
		}

		return {
			...product,
			translations: translationsRecord,
			categoryId: product.categoryId || undefined,
		};
	};

	const onSubmit = async (values: ProductFormValues) => {
		console.log("ProductForm onSubmit triggered with values:", values);
		if (!activeOrganizationData?.id) {
			toast.error(t("organization_id_missing"));
			return;
		}
		console.log("Attempting to submit product with values:", values);
		try {
			const translationsPayload = Object.entries(values.translations || {}).map(
				([lang, translation]) => ({
					...translation,
					languageCode: lang,
				}),
			);

			if (isEdit) {
				console.log("Sending PUT request for product ID:", product.id);
				const response = await hc.api.store.products[":id"].$put({
					param: { id: product.id },
					json: {
						...values,
						organizationId: activeOrganizationData.id,
						translations: translationsPayload,
					},
				});

				// Check if response is ok
				if (!response.ok) {
					const errorData = await response.json();
					console.error("Update failed with error:", errorData);
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message || t("failed_to_save_product");
					toast.error(errorMessage);
					return;
				}

				console.log("Product updated successfully.");
				toast.success(t("product_updated_successfully"));
			} else {
				console.log("Sending POST request for new product.");
				const response = await hc.api.store.products.$post({
					json: {
						...values,
						organizationId: activeOrganizationData.id,
						translations: translationsPayload,
					},
				});

				// Check if response is ok
				if (!response.ok) {
					const errorData = await response.json();
					console.error("Create failed with error:", errorData);
					const errorMessage =
						typeof errorData.error === "string"
							? errorData.error
							: errorData.error?.message || t("failed_to_save_product");
					toast.error(errorMessage);
					return;
				}

				console.log("Product created successfully.");
				toast.success(t("product_created_successfully"));
			}
			onOpenChange(false);
			queryClient.invalidateQueries({ queryKey: ["products"] });
		} catch (error) {
			console.error("Form submission caught an error:", error);
			toast.error(t("failed_to_save_product"));
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? t("edit_product") : t("create_product")}
						{languageName && (
							<span className="ml-2 font-normal text-muted-foreground text-sm">
								({languageName})
							</span>
						)}
					</DialogTitle>
				</DialogHeader>
				<ProductForm
					onSubmit={onSubmit}
					initialValues={getInitialValues()}
					selectedLanguage={selectedLanguage}
				/>
			</DialogContent>
		</Dialog>
	);
};
