import type { SlotComponent } from "@/components/form/form-builder/types";
import { ImageUploadField } from "@/components/form/image-upload-field";
import type { FileMetadata } from "@/hooks/use-file-upload";
import { useUpdateProduct } from "../hooks/use-update-product";
import type { ProductFormValues } from "./product-schema";

export const ProductImagesSlot: SlotComponent<ProductFormValues> = ({
	formValues,
	setValue,
}) => {
	const { mutateAsync: updateProduct } = useUpdateProduct();

	const handleSetThumbnail = (image: FileMetadata) => {
		setValue("thumbnailImage", image);
		const productId = formValues?.id;
		if (productId) {
			updateProduct({
				productId,
				data: { thumbnailImage: image },
			});
		}
	};

	const handleImagesChange = async (
		images: FileMetadata[] | string[] | string | null,
	) => {
		// Convert to FileMetadata array
		const imageArray = Array.isArray(images) ? (images as FileMetadata[]) : [];

		// Always update the form state to keep it in sync
		setValue("images", imageArray);

		// Update product if it exists
		if (formValues?.id) {
			await updateProduct({
				productId: formValues.id,
				data: { images: imageArray },
			});
		}
	};

	return (
		<ImageUploadField
			value={(formValues?.images as FileMetadata[] | undefined) ?? []}
			onChange={handleImagesChange}
			label="Product Images"
			multiple
			maxFiles={6}
			showLibrary
			showThumbnail
			onSetThumbnail={handleSetThumbnail}
			thumbnail={formValues?.thumbnailImage}
		/>
	);
};
