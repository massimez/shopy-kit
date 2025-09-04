"use client";

import { useTranslations } from "next-intl";
import { AdvancedSettingsForm } from "./forms/advanced-settings-form";

export default function OrganizationAdvancedTab() {
	const t = useTranslations("common");

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-xl">{t("advanced_settings")}</h2>
			<p>{t("manage_organization_advanced_settings")}</p>
			<AdvancedSettingsForm />
		</div>
	);
}
