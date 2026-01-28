import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { SeoSettingsForm } from "./forms/seo-settings-form";

export default function OrganizationSeoTab() {
	return (
		<Card>
			<CardHeader>
				<CardTitle>SEO Settings</CardTitle>
				<CardDescription>
					Manage search engine optimization metadata for your organization.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<SeoSettingsForm />
			</CardContent>
		</Card>
	);
}
