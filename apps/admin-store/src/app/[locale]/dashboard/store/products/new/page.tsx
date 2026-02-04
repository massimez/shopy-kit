"use client";

import { use } from "react";
import { toast } from "sonner";
import { DEFAULT_LOCALE } from "@/constants/locales";
import { useActiveOrganization } from "@/lib/auth-client";
import { processVariantsWithSku } from "@/lib/helpers";
import { ProductEditForm } from "../_components/product-edit-form";
import type { ProductFormValues } from "../_components/product-schema";
import { useCreateProduct } from "../hooks/use-create-product";

export default function NewProductPage({
	params,
}: {
	params: Promise<{ locale: string }>;
}) {
	const { locale } = use(params);
	const { data: activeOrganizationData } = useActiveOrganization();
	const selectedLanguage = locale || DEFAULT_LOCALE;
	const { mutateAsync: createProduct, isPending } = useCreateProduct(locale);

	const onSubmit = async (
		values: ProductFormValues,
		_deletedVariantIds: string[],
	) => {
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		// Get product name for SKU generation
		const productName =
			values.translations?.[selectedLanguage]?.name ||
			values.translations?.en?.name ||
			Object.values(values.translations || {})[0]?.name ||
			"";

		// Generate SKUs for variants that don't have one
		const processedVariants = processVariantsWithSku(
			values.variants,
			productName,
			selectedLanguage,
		);

		try {
			await createProduct({
				...values,
				variants: processedVariants,
				organizationId: activeOrganizationData.id,
			} as ProductFormValues);
		} catch (error) {
			console.error("Form submission caught an error:", error);
		}
	};

	return (
		<div className="p-0 md:p-6">
			<ProductEditForm
				onSubmit={onSubmit}
				selectedLanguage={selectedLanguage}
				isSubmitting={isPending}
			/>
		</div>
	);
}
