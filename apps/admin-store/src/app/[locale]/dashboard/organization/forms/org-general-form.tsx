// Example 1: Organization Form using FormBuilder
"use client";

import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	useActiveOrganization,
	useCreateOrganizationInfo,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "@/app/[locale]/dashboard/organization/queries";
import { GalleryViewer } from "@/components/file-upload/gallery-viewer";
import { UploadZone } from "@/components/file-upload/upload-zone";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import type { SlotComponent } from "@/components/form/form-builder/types";
import { useEntityImageUpload } from "@/hooks/use-entity-image-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";
import { authClient } from "@/lib/auth-client";

const organizationSchema = z.object({
	organizationName: z.string().max(100).optional().or(z.literal("")),
	logo: z.string().optional().nullable(),
	contactName: z.string().max(100).optional().or(z.literal("")),
	contactEmail: z.email().max(100).optional().or(z.literal("")),
	contactPhone: z.string().max(20).optional().or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

// Slot component for organization logo
const OrganizationLogoSlot: SlotComponent<OrganizationFormValues> = () => {
	const { setValue, watch } = useFormContext<OrganizationFormValues>();
	const logo = watch("logo");

	const handleUpdateLogo = async (images: FileMetadata[]) => {
		if (images.length > 0) {
			const newLogo = images[0]?.url;
			if (newLogo) {
				setValue("logo", newLogo, { shouldDirty: true });
			}
		} else {
			setValue("logo", null, { shouldDirty: true });
		}
	};

	// We wrap the single logo string in a FileMetadata array for the hook
	const initialImages: FileMetadata[] = logo
		? [
				{
					url: logo,
					name: "Logo",
					key: logo,
					type: "image/png", // Dummy type
					size: 0, // Dummy size
				},
			]
		: [];

	const { stateImages, actions, handleRemove } = useEntityImageUpload({
		initialImages: initialImages,
		onUpdateImages: handleUpdateLogo,
	});

	// Restrict to 1 image
	const canUpload = stateImages.files.length === 0;

	return (
		<div>
			<div className="mb-2 block font-medium text-gray-700 text-sm dark:text-gray-300">
				Organization Logo
			</div>
			{canUpload && <UploadZone state={stateImages} actions={actions} />}
			<GalleryViewer
				className="mt-4"
				files={stateImages.files}
				onRemove={async (id) => {
					await handleRemove(id);
					handleUpdateLogo([]);
				}}
			/>
		</div>
	);
};

export function OrganizationForm() {
	// const t = useTranslations("common"); // removed
	const { activeOrganization } = useActiveOrganization();
	const activeOrganizationId = activeOrganization?.id ?? "";
	const { data: activeInfoOrg } = useGetOrganizationInfo(activeOrganizationId);
	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();
	const { mutateAsync: createOrganizationInfo } = useCreateOrganizationInfo();

	const organizationFormConfig: FormBuilderConfig<OrganizationFormValues> = {
		schema: organizationSchema,
		defaultValues: {},
		gridLayout: true,
		items: [
			{
				itemType: "slot",
				slotId: "organization-logo",
				component: OrganizationLogoSlot,
				gridCols: 12,
			},
			{
				name: "organizationName",
				type: "text",
				labelKey: "Organization Name",
				placeholderKey: "Your organization name",
				gridCols: 6,
				required: true,
				itemType: "field",
			},
			{
				name: "contactName",
				type: "text",
				labelKey: "Contact Name",
				placeholderKey: "Enter contact name",
				gridCols: 6,
				itemType: "field",
			},
			{
				name: "contactEmail",
				type: "email",
				labelKey: "Contact Email",
				placeholderKey: "Enter contact email",
				gridCols: 6,
				itemType: "field",
			},
			{
				name: "contactPhone",
				type: "tel",
				labelKey: "Contact Phone",
				placeholderKey: "Enter contact phone",
				gridCols: 6,
				itemType: "field",
			},
		],
	};

	const initialValues = {
		organizationName: activeOrganization?.name ?? "",
		logo: activeOrganization?.logo ?? null,
		contactName: activeInfoOrg?.contactName || undefined,
		contactEmail: activeInfoOrg?.contactEmail || undefined,
		contactPhone: activeInfoOrg?.contactPhone || undefined,
	};

	const handleSubmit = async (values: OrganizationFormValues) => {
		try {
			// Update auth organization (name and logo)
			if (
				activeOrganization?.name !== values.organizationName ||
				activeOrganization?.logo !== values.logo
			) {
				await authClient.organization.update({
					organizationId: activeOrganizationId,
					data: {
						slug: activeOrganization?.slug,
						logo: values.logo || undefined,
						name: values.organizationName,
					},
				});
				// await refetchOrgInfo();
			}

			if (activeInfoOrg?.id) {
				await updateOrganizationInfo({
					organizationId: activeOrganizationId,
					organizationInfoId: activeInfoOrg.id,
					contactName: values.contactName,
					contactEmail: values.contactEmail,
					contactPhone: values.contactPhone,
				});
			} else if (
				values.contactName ||
				values.contactEmail ||
				values.contactPhone
			) {
				await createOrganizationInfo({
					organizationId: activeOrganizationId,
					contactName: values.contactName,
					contactEmail: values.contactEmail,
					contactPhone: values.contactPhone,
				});
			}
			toast.success("Organization info updated successfully");
		} catch (error: unknown) {
			toast.error("Failed to update organization info");
			console.error("Failed to update organization info:", error);
		}
	};

	const isMounted = useMounted();

	// Wait for active organization to prevent hydration mismatch
	if (!isMounted || !activeOrganization) {
		return (
			<div className="flex h-40 items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	return (
		<FormBuilder
			key={`${activeOrganizationId}${activeInfoOrg?.id ?? ""}`}
			config={organizationFormConfig}
			initialValues={initialValues}
			onSubmit={handleSubmit}
			isSubmitting={isPending}
			className=""
		/>
	);
}
