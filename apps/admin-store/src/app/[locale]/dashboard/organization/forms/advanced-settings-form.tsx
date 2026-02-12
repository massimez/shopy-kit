"use client";

import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import type { SlotComponent } from "@/components/form/form-builder/types";
import { ImageUploadField } from "@/components/form/image-upload-field";
import type { FileMetadata } from "@/hooks/use-file-upload";
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
	currency: z.string().optional(),
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

const CURRENCY_OPTIONS = [
	{ value: "DZD", label: "DZD (DA)" },
	{ value: "USD", label: "USD ($)" },
	{ value: "EUR", label: "EUR (€)" },
	{ value: "GBP", label: "GBP (£)" },
	{ value: "JPY", label: "JPY (¥)" },
	{ value: "AUD", label: "AUD (A$)" },
	{ value: "CAD", label: "CAD (C$)" },
];

// Slot component for organization images that integrates with form state
const OrganizationImagesSlot: SlotComponent<
	AdvancedSettingsFormValues
> = () => {
	const { setValue } = useFormContext<AdvancedSettingsFormValues>();
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const { data: organizationInfo } = useGetOrganizationInfo(
		organizationId || "",
	);
	const { mutateAsync: updateOrganizationInfo } = useUpdateOrganizationInfo();

	const handleUpdateOrganizationImages = async (
		images: FileMetadata[] | string[] | string | null,
	) => {
		if (!organizationId || !organizationInfo?.id) {
			return;
		}

		// Convert to FileMetadata array
		const imageArray = Array.isArray(images) ? (images as FileMetadata[]) : [];

		await updateOrganizationInfo({
			organizationId,
			organizationInfoId: organizationInfo.id,
			images: imageArray,
		});
		setValue("images", imageArray); // Sync with form state
	};

	return (
		<ImageUploadField
			value={(organizationInfo?.images as FileMetadata[]) ?? []}
			onChange={handleUpdateOrganizationImages}
			label="Organization Images"
			description="You can upload up to 6 images"
			multiple
			maxFiles={6}
			showLibrary
		/>
	);
};

export function AdvancedSettingsForm() {
	// const t = useTranslations("common"); // removed
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;

	const { data: organizationInfo, isLoading } = useGetOrganizationInfo(
		organizationId || "",
	);

	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();

	// Remove the old separate useEntityImageUpload instance

	// Form configuration
	const advancedSettingsFormConfig: FormBuilderConfig<AdvancedSettingsFormValues> =
		{
			schema: formSchema,
			defaultValues: {},
			gridLayout: true,
			items: [
				{
					name: "taxRate",
					labelKey: "Tax Rate",
					itemType: "field",
					type: "text",
					gridCols: 6,
				},
				{
					name: "defaultLanguage",
					itemType: "field",
					type: "select",
					labelKey: "Default Language",
					placeholderKey: "Select default language",
					gridCols: 6,
					options: LANGUAGE_OPTIONS,
				},
				{
					name: "currency",
					itemType: "field",
					type: "select",
					labelKey: "Currency",
					placeholderKey: "Select currency",
					gridCols: 6,
					options: CURRENCY_OPTIONS,
				},
				{
					name: "activeLanguages",
					itemType: "field",
					type: "multiselect",
					labelKey: "Active Languages",
					placeholderKey: "Select active languages",
					gridCols: 6,
					options: LANGUAGE_OPTIONS,
				},
				{
					itemType: "slot",
					slotId: "organization-images",
					component: OrganizationImagesSlot,
					gridCols: 12,
				},
			],
		};

	// Initial form values
	const initialValues = {
		taxRate: organizationInfo?.taxRate ?? "",
		defaultLanguage: organizationInfo?.defaultLanguage?.toString() ?? "",
		currency: organizationInfo?.currency ?? "USD",
		activeLanguages: (organizationInfo?.activeLanguages ?? []) as string[],
		images: organizationInfo?.images ?? [],
	};

	// Form submission
	async function onSubmit(values: AdvancedSettingsFormValues) {
		if (!organizationId || !organizationInfo?.id) {
			toast.error("Organization info missing");
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

			toast.success("Advanced settings updated successfully");
		} catch (error) {
			console.error("Failed to update advanced settings:", error);
			toast.error("Failed to update advanced settings");
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
