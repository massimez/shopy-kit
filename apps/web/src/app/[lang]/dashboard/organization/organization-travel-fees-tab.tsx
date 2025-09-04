"use client";

import { useTranslations } from "next-intl";
import { TravelFeesForm } from "./forms/travel-fees-form";

export default function OrganizationTravelFeesTab() {
	const t = useTranslations("common");

	return (
		<div className="space-y-6">
			<h2 className="font-semibold text-xl">{t("travel_fees_settings")}</h2>
			<p>{t("manage_organization_travel_fees_and_policy")}</p>
			<TravelFeesForm />
		</div>
	);
}
