"use client";

import { Button } from "@workspace/ui/components/button";
import { ImagePlus } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import { MediaLibraryModal } from "@/components/media-library/media-library-modal";
import { useEntityImageUpload } from "@/hooks/use-entity-image-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";

export interface ImageUploadFieldProps {
	/** Current value - can be a single URL, array of URLs, or FileMetadata array */
	value?: string | string[] | FileMetadata[] | null;
	/** Callback when value changes */
	onChange: (value: string | string[] | FileMetadata[] | null) => void;
	/** Allow multiple images */
	multiple?: boolean;
	/** Maximum number of files (only applies when multiple=true) */
	maxFiles?: number;
	/** Field label */
	label?: string;
	/** Field description/help text */
	description?: string;
	/** Folder ID for organizing uploads */
	folderId?: string | null;
	/** Show media library button */
	showLibrary?: boolean;
	/** Show thumbnail selection (only for multiple images) */
	showThumbnail?: boolean;
	/** Callback when thumbnail is set */
	onSetThumbnail?: (image: FileMetadata) => void;
	/** Current thumbnail */
	thumbnail?: FileMetadata;
	/** Custom class name */
	className?: string;
}

/**
 * Reusable image upload field component
 *
 * Handles both single and multiple image uploads with support for:
 * - Drag & drop upload
 * - Media library selection
 * - Thumbnail selection (for multiple images)
 * - Automatic value conversion between string/array/FileMetadata formats
 */
export function ImageUploadField({
	value,
	onChange,
	multiple = false,
	maxFiles = multiple ? 6 : 1,
	label,
	description,
	folderId,
	showLibrary = true,
	showThumbnail = false,
	onSetThumbnail,
	thumbnail,
	className,
}: ImageUploadFieldProps) {
	// Convert value to FileMetadata array for internal use
	const initialImages = useMemo((): FileMetadata[] => {
		if (!value) return [];

		// Handle FileMetadata array
		if (Array.isArray(value) && value.length > 0) {
			const first = value[0];
			if (first && typeof first === "object" && "url" in first) {
				return value as FileMetadata[];
			}
			// Handle string array
			return (value as string[]).map((url, index) => ({
				key: url,
				url,
				name: `Image ${index + 1}`,
				size: 0,
				type: "image/jpeg",
			}));
		}

		// Handle single string
		if (typeof value === "string") {
			return [
				{
					key: value,
					url: value,
					name: "Image",
					size: 0,
					type: "image/jpeg",
				},
			];
		}

		return [];
	}, [value]);

	// Handle image updates
	const handleUpdateImages = useCallback(
		async (images: FileMetadata[]) => {
			if (!multiple) {
				// Single image mode - return first image URL or null
				const firstImage = images[0];
				onChange(firstImage?.url ?? null);
			} else {
				// Multiple images mode - return array
				if (images.length === 0) {
					onChange(null);
				} else {
					// Return FileMetadata array for maximum flexibility
					onChange(images);
				}
			}
		},
		[multiple, onChange],
	);

	const { stateImages, actions, handleRemove, isUploading } =
		useEntityImageUpload({
			initialImages,
			onUpdateImages: handleUpdateImages,
			folderId,
		});

	// Sync external value changes with internal state
	// This ensures the component displays existing images when the value prop changes
	useEffect(() => {
		// Only update if the external value differs from the current state
		const currentUrls = stateImages.files
			.map((f) => {
				const file = f.file;
				return typeof file === "object" && "url" in file ? file.url : f.preview;
			})
			.filter(Boolean);

		const externalUrls = initialImages.map((img) => img.url);

		// Check if arrays are different
		const isDifferent =
			currentUrls.length !== externalUrls.length ||
			currentUrls.some((url, idx) => url !== externalUrls[idx]);

		if (isDifferent && initialImages.length >= 0) {
			actions.setFiles(initialImages);
		}
	}, [initialImages, stateImages.files, actions]);

	// Check if we can upload more files
	const canUpload = multiple
		? stateImages.files.length < maxFiles
		: stateImages.files.length === 0;

	return (
		<div className={className}>
			{/* Label */}
			{label && (
				<div className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
					{label}
				</div>
			)}

			{/* Description */}
			{description && (
				<p className="mb-2 text-gray-500 text-xs dark:text-gray-400">
					{description}
				</p>
			)}

			{/* Upload Zone - only show if we can upload more */}
			{canUpload && (
				<div className="space-y-3">
					<UploadZone
						state={stateImages}
						actions={actions}
						isUploading={isUploading}
					/>

					{/* Media Library Button */}
					{showLibrary && (
						<div className="flex items-center justify-center">
							<span className="mr-2 text-muted-foreground text-xs">OR</span>
							<MediaLibraryModal
								onSelect={handleUpdateImages}
								multiple={multiple}
							>
								<Button
									variant="outline"
									type="button"
									size="sm"
									className="h-8 text-xs"
								>
									<ImagePlus className="mr-1.5 h-3.5 w-3.5" />
									Select from Library
								</Button>
							</MediaLibraryModal>
						</div>
					)}
				</div>
			)}

			{/* Gallery Viewer */}
			{stateImages.files.length > 0 && (
				<GalleryViewer
					className={canUpload ? "mt-3" : ""}
					files={stateImages.files}
					onRemove={handleRemove}
					onSetThumbnail={showThumbnail ? onSetThumbnail : undefined}
					thumbnail={showThumbnail ? thumbnail : undefined}
				/>
			)}
		</div>
	);
}
