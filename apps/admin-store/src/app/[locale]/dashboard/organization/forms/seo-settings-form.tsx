"use client";

import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	useActiveOrganization,
	useGetOrganizationInfo,
	useUpdateOrganizationInfo,
} from "../queries";

type SeoField = {
	title: string;
	description: string;
	keywords: string;
};

export function SeoSettingsForm() {
	const { activeOrganization } = useActiveOrganization();
	const organizationId = activeOrganization?.id;
	const { data: organizationInfo, isLoading } = useGetOrganizationInfo(
		organizationId || "",
	);
	const { mutateAsync: updateOrganizationInfo, isPending } =
		useUpdateOrganizationInfo();

	const [selectedLanguage, setSelectedLanguage] = useState<string>("en");
	// Ensure we have a default language selected once data is loaded
	useEffect(() => {
		if (organizationInfo?.defaultLanguage) {
			setSelectedLanguage(organizationInfo.defaultLanguage);
		} else if (organizationInfo?.activeLanguages?.[0]) {
			setSelectedLanguage(organizationInfo.activeLanguages[0]);
		}
	}, [organizationInfo]);

	// Local state to track edits before saving?
	// Or just use react-hook-form with a nested object structure `seoMetadata.${lang}.title`.
	// But we want to show only ONE language's fields at a time.

	// We can use a FormBuilder config that updates when selectedLanguage changes!

	const activeLanguages = (organizationInfo?.activeLanguages as string[]) || [
		"en",
	];

	// We'll use a standard form layout instead of FormBuilder for maximum control over the "View Mode"
	const [formData, setFormData] = useState<Record<string, SeoField>>({});

	useEffect(() => {
		if (organizationInfo?.seoMetadata) {
			// unexpected type safety hack if needed, but assuming it matches
			setFormData(
				organizationInfo.seoMetadata as unknown as Record<string, SeoField>,
			);
		}
	}, [organizationInfo]);

	const handleFieldChange = (field: keyof SeoField, value: string) => {
		setFormData((prev) => ({
			...prev,
			[selectedLanguage]: {
				...(prev[selectedLanguage] || {
					title: "",
					description: "",
					keywords: "",
				}),
				[field]: value,
			},
		}));
	};

	const currentData = formData[selectedLanguage] || {
		title: "",
		description: "",
		keywords: "",
	};

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!organizationId || !organizationInfo?.id) {
			toast.error("Organization info missing");
			return;
		}

		try {
			// Filter out null values and metadata fields to avoid overwriting unrelated stuff if we were passing full object
			// But here we are just calling update with specific fields

			await updateOrganizationInfo({
				organizationId,
				organizationInfoId: organizationInfo.id,
				seoMetadata: formData,
			});

			toast.success("SEO settings updated successfully");
		} catch (error) {
			console.error("Failed to update SEO settings:", error);
			toast.error("Failed to update SEO settings");
		}
	}

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<form onSubmit={onSubmit} className="space-y-6">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label>Select Language to Edit</Label>
					<Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
						<SelectTrigger className="w-[200px]">
							<SelectValue placeholder="Select language" />
						</SelectTrigger>
						<SelectContent>
							{activeLanguages.map((lang) => (
								<SelectItem key={lang} value={lang}>
									{lang.toUpperCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="grid gap-4 rounded-md border p-4">
					<div className="space-y-2">
						<Label htmlFor="meta-title">
							Meta Title ({selectedLanguage.toUpperCase()})
						</Label>
						<input
							id="meta-title"
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							value={currentData.title || ""}
							onChange={(e) => handleFieldChange("title", e.target.value)}
							placeholder="Enter meta title"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="meta-description">
							Meta Description ({selectedLanguage.toUpperCase()})
						</Label>
						<textarea
							id="meta-description"
							className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							value={currentData.description || ""}
							onChange={(e) => handleFieldChange("description", e.target.value)}
							placeholder="Enter meta description"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="meta-keywords">
							Keywords ({selectedLanguage.toUpperCase()})
						</Label>
						<input
							id="meta-keywords"
							className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
							value={currentData.keywords || ""}
							onChange={(e) => handleFieldChange("keywords", e.target.value)}
							placeholder="keyword1, keyword2, keyword3"
						/>
						<p className="text-muted-foreground text-xs">
							Comma separated values
						</p>
					</div>
				</div>
			</div>

			<div className="flex justify-end">
				<button
					type="submit"
					disabled={isPending}
					className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
				>
					{isPending ? "Saving..." : "Save Changes"}
				</button>
			</div>
		</form>
	);
}
