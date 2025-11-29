"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { use } from "react";
import { toast } from "sonner";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { hc } from "@/lib/api-client";
import { useActiveOrganization } from "@/lib/auth-client";
import { ProductEditForm } from "../_components/product-edit-form";
import type { ProductFormValues } from "../_components/product-schema";

export default function NewProductPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = use(params);
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: activeOrganizationData } = useActiveOrganization();
	const selectedLanguage = locale || DEFAULT_LOCALE;

	const onSubmit = async (
		values: ProductFormValues,
		_deletedVariantIds: string[],
	) => {
		console.log("ProductForm onSubmit triggered with values:", values);

		try {
			const { processImages, createVariants } = await import(
				"./product-helpers"
			);

			const images = await processImages(values);
			const { variants, ...restValues } = values;

			const translationsPayload = Object.entries(values.translations || {}).map(
				([langCode, translation]) => ({
					...translation,
					languageCode: langCode,
				}),
			);

			const payload = {
				...restValues,
				organizationId: activeOrganizationData?.id || "",
				translations: translationsPayload,
				images: images.length > 0 ? images : undefined,
			};

			const response = await hc.api.store.products.$post({
				json: payload,
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Create failed with error:", errorData);
				const errorMessage =
					errorData.error.message || "Failed to save product";
				toast.error(errorMessage);
				return;
			}

			const responseData = await response.json();
			const productId = responseData.data?.id;

			if (productId) {
				await createVariants(productId, variants);
			}
			toast.success("Product created successfully");
			queryClient.invalidateQueries({ queryKey: ["products"] });
			router.push(`/${locale}/dashboard/store/products`);
		} catch (error) {
			console.error("Form submission caught an error:", error);
			toast.error("Failed to save product");
		}
	};

	return (
		<div className="p-6">
			<ProductEditForm
				onSubmit={onSubmit}
				selectedLanguage={selectedLanguage}
			/>
		</div>
	);
}
