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
		if (!activeOrganizationData?.id) {
			toast.error("Organization ID missing");
			return;
		}

		try {
			const translationsPayload = Object.entries(values.translations || {}).map(
				([langCode, translation]) => ({
					...translation,
					languageCode: langCode,
				}),
			);

			// For new product, upload images first if any are present
			console.log("Creating new product with images:", values.images);
			// biome-ignore lint/suspicious/noExplicitAny: <>
			let images: any[] = [];

			if (values.images && values.images.length > 0) {
				console.log("Processing images for upload...");
				console.log("All images:", values.images);

				const imageFilesToUpload = values.images.filter((img) => {
					const isTemp = img.key?.startsWith("temp-");
					const noUrl = img.url === "";

					return isTemp && noUrl;
				});
				console.log("Filtered images to upload:", imageFilesToUpload);

				if (imageFilesToUpload.length > 0) {
					const { uploadPublic } = await import("@/lib/storage");

					// Upload each temp image individually and collect results
					// biome-ignore lint/suspicious/noExplicitAny: <>
					const uploadResults: any[] = [];

					for (let i = 0; i < imageFilesToUpload.length; i++) {
						const img = imageFilesToUpload[i];
						if (!img) continue;

						// biome-ignore lint/suspicious/noExplicitAny: <>
						const file = (img as any).file;

						console.log(`Processing ${img.name}:`, {
							key: img.key,
							hasFile: file instanceof File,
							fileInstance: file,
							fileSize: file?.size,
							fileType: file?.type,
						});

						if (!(file instanceof File)) {
							console.warn(
								`Cannot upload image ${img.name}: file reference not available`,
							);
							uploadResults.push(img); // Keep the original temp image
							continue;
						}

						try {
							console.log(`Uploading ${img.name}...`);
							const { key, publicUrl } = await uploadPublic(file);
							console.log(`Upload successful for ${img.name}:`, {
								key,
								publicUrl,
							});

							uploadResults.push({
								key,
								url: publicUrl,
								name: img.name,
								size: img.size,
								type: img.type,
							});
						} catch (error) {
							console.error(`Failed to upload ${img.name}:`, error);
							const errorMessage =
								error instanceof Error ? error.message : "Unknown error";
							toast.error(`Failed to upload ${img.name}: ${errorMessage}`);
							uploadResults.push(img); // Return original on failure
						}
					}

					// Replace temporary images with uploaded ones in the original array
					let uploadIndex = 0;
					images = values.images.map((img) => {
						if (img.key?.startsWith("temp-") && img.url === "") {
							const result = uploadResults[uploadIndex++];
							console.log(`Replacing temp image ${img.name} with:`, result);
							return result;
						}
						return img;
					});

					console.log("Final images array:", images);
				} else {
					console.log("No images need uploading");
					images = values.images;
				}
			} else {
				console.log("No images in values");
				images = values.images || [];
			}

			const { variants, ...restValues } = values;

			const payload = {
				...restValues,
				organizationId: activeOrganizationData.id,
				translations: translationsPayload,
			};

			if (images.length > 0) {
				payload.images = images;
			}

			console.log("Sending POST request for new product.");
			const response = await hc.api.store.products.$post({
				json: payload,
			});

			// Check if response is ok
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

			if (
				productId &&
				variants &&
				Array.isArray(variants) &&
				variants.length > 0
			) {
				console.log("Creating variants for new product...");
				try {
					await Promise.all(
						// biome-ignore lint/suspicious/noExplicitAny: <>
						variants.map(async (variant: any) => {
							// Build translations array from displayName and optionValues
							const variantTranslations = variant.translations || [];

							// Only update attributes (optionValues) in translations, preserve user-edited names
							if (variant.optionValues) {
								// Get all unique language codes from existing translations or use a default
								const languageCodes =
									variantTranslations.length > 0
										? // biome-ignore lint/suspicious/noExplicitAny: <>
											variantTranslations.map((t: any) => t.languageCode)
										: ["en"]; // fallback to English

								// Update or create translation for each language
								languageCodes.forEach((langCode: string) => {
									const existingTranslation = variantTranslations.find(
										// biome-ignore lint/suspicious/noExplicitAny: <>
										(t: any) => t.languageCode === langCode,
									);

									if (existingTranslation) {
										// Only update attributes, keep the user-edited name
										existingTranslation.attributes = variant.optionValues;
									} else {
										// For new translations, use displayName as default
										variantTranslations.push({
											languageCode: langCode,
											name: variant.displayName || "",
											attributes: variant.optionValues,
										});
									}
								});
							}

							const cleanVariant = {
								...variant,
								price: Number(variant.price),
								cost: Number(variant.cost || 0),
								compareAtPrice: Number(variant.compareAtPrice || 0),
								reorderPoint: Number(variant.reorderPoint || 0),
								reorderQuantity: Number(variant.reorderQuantity || 0),
								weightKg: variant.weightKg
									? Number(variant.weightKg)
									: undefined,
								translations:
									variantTranslations.length > 0
										? variantTranslations
										: undefined,
							};

							// Remove frontend-only fields
							delete cleanVariant.displayName;
							delete cleanVariant.optionValues;

							await hc.api.store["product-variants"].$post({
								json: { ...cleanVariant, productId },
							});
						}),
					);
					console.log("Variants created successfully.");
				} catch (variantError) {
					console.error("Failed to create variants:", variantError);
					toast.error("Product created but failed to create variants");
				}
			}

			console.log("Product created successfully.");
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
