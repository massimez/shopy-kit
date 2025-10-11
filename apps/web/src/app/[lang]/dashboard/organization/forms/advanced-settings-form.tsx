"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import { useFileUpload } from "@/hooks/use-file-upload";
import { deleteFile, uploadPublic } from "@/lib/storage";
import {
	useActiveOrganization,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "../queries";

const formSchema = z.object({
	taxRate: z
		.string()
		.regex(/^\d+(\.\d{1,2})?$/, "Tax rate must be a valid monetary value")
		.optional()
		.or(z.literal("")),
	defaultLanguage: z.string().optional(),
	activeLanguages: z.array(z.string()),
	images: z
		.array(
			z.object({
				key: z.string().optional(),
				url: z.string(),
				alt: z.string().optional(),
				type: z.string().optional(),
				itemType: z.string().optional(),
				name: z.string().optional(),
				size: z.number().optional(),
			}),
		)
		.optional(),
	socialLinks: z.any().optional(),
});

type AdvancedSettingsFormValues = z.infer<typeof formSchema>;

const LANGUAGE_OPTIONS = [
	{ value: "en", label: "English" },
	{ value: "es", label: "Spanish" },
	{ value: "fr", label: "French" },
	{ value: "ar", label: "Arabic" },
	{ value: "kab", label: "Kabyle" },
];

const MAX_IMAGES = 6;

export function AdvancedSettingsForm() {
	const t = useTranslations("common");
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: organizationInfo, isLoading } = useGetOrganizationInfo(
		organizationId || "",
	);

	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();

	// Transform organization images to file upload format
	const initialFiles =
		organizationInfo?.images?.map((img) => ({
			id: img.key ?? "",
			name: img.name ?? "",
			size: img.size ?? 0,
			type: img.type ?? "",
			url: img.url,
		})) ?? [];

	// File upload state
	const [stateImages, actions] = useFileUpload({
		multiple: true,
		accept: "image/*",
		maxFiles: MAX_IMAGES,
		initialFiles,
		onFilesAdded: handleFilesAdded,
	});

	// Handle file uploads
	async function handleFilesAdded(addedFiles: any[]) {
		if (!organizationId || !organizationInfo?.id) {
			toast.error(t("organization_info_missing"));
			return;
		}

		await Promise.allSettled(
			addedFiles.map(async (fileItem) => {
				if (!(fileItem.file instanceof File)) return;

				try {
					// Upload to storage
					const { key, publicUrl } = await uploadPublic(fileItem.file);

					// Create new image object
					const newImage = {
						key,
						url: publicUrl,
						name: fileItem.file.name,
						size: fileItem.file.size,
						type: fileItem.file.type,
					};

					// Update organization info
					await updateOrganizationInfo({
						organizationId,
						organizationInfoId: organizationInfo.id,
						images: [...(organizationInfo.images ?? []), newImage],
					});

					// Update file item
					fileItem.preview = publicUrl;
					fileItem.id = key;
				} catch (error) {
					const errorMessage =
						error instanceof Error
							? error.message
							: t("failed_to_upload_image", { fileName: fileItem.file.name });

					console.error("Upload error:", errorMessage);
					toast.error(errorMessage);
					actions.triggerError([errorMessage]);
					actions.removeFile(fileItem.id);
				}
			}),
		);
	}

	// Handle file removal
	async function handleRemove(id: string) {
		if (!organizationId || !organizationInfo?.id) {
			toast.error(t("organization_info_missing"));
			return;
		}

		try {
			// Delete from storage
			await deleteFile(id);

			// Remove from UI
			actions.removeFile(id);

			// Update organization info
			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				images: organizationInfo.images?.filter((img) => img.key !== id) ?? [],
			});

			toast.success(t("image_removed_successfully"));
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : t("failed_to_delete_image");

			console.error("Delete failed:", errorMessage);
			toast.error(errorMessage);
		}
	}

	// Form configuration
	const advancedSettingsFormConfig: FormBuilderConfig<AdvancedSettingsFormValues> =
		{
			schema: formSchema,
			defaultValues: {},
			gridLayout: true,
			items: [
				{
					name: "taxRate",
					labelKey: "tax_rate",
					itemType: "field",
					type: "text",
					gridCols: 6,
				},
				{
					name: "defaultLanguage",
					itemType: "field",
					type: "select",
					labelKey: "default_language",
					placeholderKey: "enter_default_language",
					gridCols: 6,
					options: LANGUAGE_OPTIONS,
				},
				{
					name: "activeLanguages",
					itemType: "field",
					type: "multiselect",
					labelKey: "active_languages",
					placeholderKey: "enter_active_languages",
					gridCols: 6,
					options: LANGUAGE_OPTIONS,
				},
				{
					itemType: "slot",
					slotId: "organization-images",
					component: () => (
						<div>
							<div className="block font-medium text-gray-700 text-sm dark:text-gray-300">
								{t("organization_images")}
							</div>
							<p className="mb-2 text-gray-500 text-xs dark:text-gray-400">
								{t("you_can_upload_up_to_6_images")}
							</p>
							<UploadZone state={stateImages} actions={actions} />
							<GalleryViewer
								className="mt-4"
								files={stateImages.files}
								onRemove={handleRemove}
							/>
						</div>
					),
					gridCols: 12,
				},
			],
		};

	// Initial form values
	const initialValues = {
		taxRate: organizationInfo?.taxRate ?? "",
		defaultLanguage: organizationInfo?.defaultLanguage?.toString() ?? "",
		activeLanguages: (organizationInfo?.activeLanguages ?? []) as string[],
		images: organizationInfo?.images ?? [],
	};

	// Form submission
	async function onSubmit(values: AdvancedSettingsFormValues) {
		if (!organizationId || !organizationInfo?.id) {
			toast.error(t("organization_info_missing"));
			return;
		}

		try {
			// Filter out null values and metadata fields
			const filteredData = Object.fromEntries(
				Object.entries(organizationInfo).filter(
					([key, value]) =>
						value !== null && key !== "id" && key !== "organizationId",
				),
			);

			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				...filteredData,
				...values,
			});

			toast.success(t("advanced_settings_updated_successfully"));
		} catch (error) {
			console.error("Failed to update advanced settings:", error);
			toast.error(t("failed_to_update_advanced_settings"));
		}
	}

	return (
		<FormBuilder
			config={advancedSettingsFormConfig}
			initialValues={initialValues}
			onSubmit={onSubmit}
			isSubmitting={isPending || isLoading}
		/>
	);
}
