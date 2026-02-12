import { ImageUploadField } from "@/components/form/image-upload-field";

interface CollectionImageSlotProps {
	image?: string | null;
	onImageChange: (url: string | null) => void;
}

export function CollectionImageSlot({
	image,
	onImageChange,
}: CollectionImageSlotProps) {
	return (
		<ImageUploadField
			value={image}
			onChange={(value) => onImageChange(value as string | null)}
			label="Collection Image"
			maxFiles={1}
			showLibrary
		/>
	);
}
