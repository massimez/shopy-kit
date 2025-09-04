import { getTranslations } from "next-intl/server";
import { OrganizationForm } from "./forms/org-general-form";

export default async function OrganizationGeneralTab() {
	const t = await getTranslations("common");

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-xl">{t("general_settings")}</h2>
			<p>{t("manage_organization_details")}</p>
			<OrganizationForm />
		</div>
	);
}
