// Example 1: Organization Form using FormBuilder
"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { z } from "zod";
import {
	useActiveOrganization,
	useCreateOrganizationInfo,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "@/app/[lang]/dashboard/organization/queries";
import {
	FormBuilder,
	type FormBuilderConfig,
} from "@/components/form/form-builder";
import { authClient } from "@/lib/auth-client";
import { getErrorMessage } from "@/lib/error-utils";

const organizationSchema = z.object({
	organizationName: z.string().max(100).optional().or(z.literal("")),
	contactName: z.string().max(100).optional().or(z.literal("")),
	contactEmail: z.email().max(100).optional().or(z.literal("")),
	contactPhone: z.string().max(20).optional().or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

export function OrganizationForm() {
	const t = useTranslations("common");
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
		fields: [
			{
				name: "organizationName",
				type: "text",
				labelKey: "organization_name",
				placeholderKey: "your_organization_name",
				gridCols: 6,
				required: true,
			},
			{
				name: "contactName",
				type: "text",
				labelKey: "contact_name",
				placeholderKey: "enter_contact_name",
				gridCols: 6,
			},
			{
				name: "contactEmail",
				type: "email",
				labelKey: "contact_email",
				placeholderKey: "enter_contact_email",
				gridCols: 6,
			},
			{
				name: "contactPhone",
				type: "tel",
				labelKey: "contact_phone",
				placeholderKey: "enter_contact_phone",
				gridCols: 6,
			},
		],
	};

	const initialValues = {
		organizationName: activeOrganization?.name ?? "",
		contactName: activeInfoOrg?.contactName || undefined,
		contactEmail: activeInfoOrg?.contactEmail || undefined,
		contactPhone: activeInfoOrg?.contactPhone || undefined,
	};

	const handleSubmit = async (values: OrganizationFormValues) => {
		try {
			if (activeOrganization?.name !== values.organizationName) {
				await authClient.organization.update({
					organizationId: activeOrganizationId,
					data: {
						slug: activeOrganization?.slug,
						logo: activeOrganization?.logo || undefined,
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
			toast.success(t("organization_info_updated_successfully"));
		} catch (error: unknown) {
			toast.error(
				getErrorMessage(error) || t("failed_to_update_organization_info"),
			);
			console.error("Failed to update organization info:", error);
		}
	};

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
