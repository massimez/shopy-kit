import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import type { ProductFormValues } from "../_components/product-schema";

export async function processImages(values: ProductFormValues) {
	if (!values.images || values.images.length === 0) {
		console.log("No images in values");
		return values.images || [];
	}

	console.log("Processing images for upload...");
	console.log("All images:", values.images);

	const imageFilesToUpload = values.images.filter((img) => {
		const isTemp = img.key?.startsWith("temp-");
		const noUrl = img.url === "";
		return isTemp && noUrl;
	});

	console.log("Filtered images to upload:", imageFilesToUpload);

	if (imageFilesToUpload.length === 0) {
		console.log("No images need uploading");
		return values.images;
	}

	const { uploadPublic } = await import("@/lib/storage");

	// Upload each temp image individually and collect results
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const uploadResults: any[] = [];

	for (const img of imageFilesToUpload) {
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
	const images = values.images.map((img) => {
		if (img.key?.startsWith("temp-") && img.url === "") {
			const result = uploadResults[uploadIndex++];
			console.log(`Replacing temp image ${img.name} with:`, result);
			return result;
		}
		return img;
	});

	console.log("Final images array:", images);
	return images;
}

export async function createVariants(
	productId: string,
	variants: ProductFormValues["variants"],
) {
	if (!variants || !Array.isArray(variants) || variants.length === 0) {
		return;
	}

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
					for (const langCode of languageCodes) {
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
					}
				}

				const cleanVariant = {
					...variant,
					price: Number(variant.price),
					cost: Number(variant.cost || 0),
					compareAtPrice: Number(variant.compareAtPrice || 0),
					reorderPoint: Number(variant.reorderPoint || 0),
					reorderQuantity: Number(variant.reorderQuantity || 0),
					weightKg: variant.weightKg ? Number(variant.weightKg) : undefined,
					translations:
						variantTranslations.length > 0 ? variantTranslations : undefined,
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
