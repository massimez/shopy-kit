"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { FormProvider, type Path, useForm } from "react-hook-form";
import { insertLocationSchema } from "starter-db/schema";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	InputFormField,
	SwitchFormField,
} from "@/components/ui/inputs/main-fom-fields";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const formSchema = insertLocationSchema
	.omit({ organizationId: true })
	.partial();
export type LocationFormValues = z.infer<typeof formSchema>;

type LocationFormProps = {
	initialValues?: LocationFormValues;
	onSubmit: (values: LocationFormValues) => Promise<void>;
	isSubmitting: boolean;
};

// Configuration objects for cleaner code
const TABS = [
	{ value: "basic", label: "Basic Info" },
	{ value: "contact", label: "Contact" },
	{ value: "address", label: "Address" },
	{ value: "settings", label: "Settings" },
] as const;

const TAB_FIELDS = {
	basic: ["name", "description", "locationType", "capacity"] as const,
	address: [
		"address.building",
		"address.office",
		"address.street",
		"address.city",
		"address.state",
		"address.zipCode",
		"address.country",
	] as const,
	contact: ["contactName", "contactEmail", "contactPhone"] as const,
	settings: ["isActive", "isDefault"] as const,
};

const LOCATION_TYPES = [
	{ value: "shop", label: "Shop" },
	{ value: "warehouse", label: "Warehouse" },
	{ value: "distribution_center", label: "Distribution Center" },
];

const COUNTRIES = [
	{ value: "dz", label: "Algeria" },
	{ value: "fr", label: "France" },
	{ value: "us", label: "United States" },
	{ value: "de", label: "Germany" },
];

const DEFAULT_VALUES: LocationFormValues = {
	name: "",
	locationType: "shop",
	isActive: true,
	isDefault: false,
};

export function LocationForm({
	initialValues,
	onSubmit,
	isSubmitting,
}: LocationFormProps) {
	const t = useTranslations("common");
	const [activeTab, setActiveTab] = useState("basic");

	const form = useForm<LocationFormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: initialValues || DEFAULT_VALUES,
		mode: "onChange",
	});

	// Helper functions
	const getCurrentTabIndex = () =>
		TABS.findIndex((tab) => tab.value === activeTab);
	const isFirstTab = getCurrentTabIndex() === 0;
	const isLastTab = getCurrentTabIndex() === TABS.length - 1;

	const validateCurrentTab = async (): Promise<boolean> => {
		const currentTabFields = TAB_FIELDS[activeTab as keyof typeof TAB_FIELDS];
		return await form.trigger(currentTabFields as any);
	};

	const focusFirstError = () => {
		const currentTabFields = TAB_FIELDS[activeTab as keyof typeof TAB_FIELDS];
		const errors = form.formState.errors;
		const firstErrorField = currentTabFields.find((field) =>
			field.split(".").reduce((obj: any, key) => obj?.[key], errors),
		);
		if (firstErrorField) {
			const element = document.querySelector(
				`[name="${firstErrorField}"]`,
			) as HTMLElement;
			element?.focus();
		}
	};

	const getTabErrorStatus = (tabValue: string) => {
		const tabFields = TAB_FIELDS[tabValue as keyof typeof TAB_FIELDS];
		const errors = form.formState.errors;
		return tabFields.some((field) =>
			field.split(".").reduce((obj: any, key) => obj?.[key], errors),
		);
	};

	// Navigation handlers
	const goToNextTab = async () => {
		if (isLastTab) return;
		if (await validateCurrentTab()) {
			// biome-ignore lint/style/noNonNullAssertion: <>
			setActiveTab(TABS[getCurrentTabIndex() + 1]!.value);
		} else {
			focusFirstError();
		}
	};

	const goToPrevTab = () => {
		if (!isFirstTab) {
			// biome-ignore lint/style/noNonNullAssertion: <>
			setActiveTab(TABS[getCurrentTabIndex() - 1]!.value);
		}
	};

	const handleTabChange = async (newTab: string) => {
		if (newTab === activeTab) return;

		const newTabIndex = TABS.findIndex((tab) => tab.value === newTab);
		const isMovingForward = newTabIndex > getCurrentTabIndex();

		if (isMovingForward && !(await validateCurrentTab())) {
			focusFirstError();
			return;
		}
		setActiveTab(newTab);
	};

	const handleSubmit = async (values: LocationFormValues) => {
		try {
			await onSubmit(values);
		} catch (error) {
			// Navigate to first tab with errors
			for (const tab of TABS) {
				if (getTabErrorStatus(tab.value)) {
					setActiveTab(tab.value);
					break;
				}
			}
		}
	};

	// Render helpers
	const renderSelectField = (
		name: Path<LocationFormValues>,
		label: string,
		placeholder: string,
		options: Array<{ value: string; label: string }>,
	) => (
		<FormField
			control={form.control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<Select
						onValueChange={field.onChange}
						defaultValue={field.value as string}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((option) => (
								<SelectItem key={option.value} value={option.value}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);

	const renderTabContent = (
		tabValue: string,
		title: string,
		description: string | undefined,
		children: React.ReactNode,
	) => (
		<TabsContent value={tabValue} className="mt-0 flex-1 overflow-hidden">
			<div className="h-full overflow-y-auto px-1">
				<div className="space-y-8 pb-6">
					<div>
						<h3 className="sticky top-0 mb-2 border-b bg-background pb-3 font-semibold text-xl">
							{title}
						</h3>
						{description && (
							<p className="mb-6 text-muted-foreground text-sm">
								{description}
							</p>
						)}
					</div>
					<div className="space-y-6">{children}</div>
				</div>
			</div>
		</TabsContent>
	);

	return (
		<div className="flex h-[600px] flex-col md:h-[700px]">
			<FormProvider {...form}>
				<Tabs
					value={activeTab}
					onValueChange={handleTabChange}
					className="flex flex-1 flex-col"
				>
					{/* Tab Headers */}
					<div className="sticky top-0 z-10 mb-6 shrink-0 border-b bg-background pb-4">
						<TabsList className="grid w-full grid-cols-5">
							{TABS.map((tab) => {
								const hasErrors = getTabErrorStatus(tab.value);
								return (
									<TabsTrigger
										key={tab.value}
										value={tab.value}
										className={`relative text-sm ${hasErrors ? "data-[state=inactive]:text-destructive" : ""}`}
									>
										{tab.label}
										{hasErrors && (
											<span className="-top-1 -right-1 absolute h-2 w-2 rounded-full bg-destructive" />
										)}
									</TabsTrigger>
								);
							})}
						</TabsList>
					</div>

					{/* Basic Information Tab */}
					{renderTabContent(
						"basic",
						"Basic Information",
						undefined,
						<>
							<InputFormField
								control={form.control}
								name="name"
								labelKey="name"
								placeholderKey="location_name_placeholder"
								descriptionKey="location_name_description"
							/>
							<InputFormField
								control={form.control}
								name="description"
								labelKey="description"
								placeholderKey="location_description_placeholder"
								component={Textarea}
							/>
							{renderSelectField(
								"locationType",
								"Location Type",
								"Select location type",
								LOCATION_TYPES,
							)}
							<InputFormField
								control={form.control}
								name="capacity"
								labelKey="capacity"
								placeholderKey="capacity_placeholder"
								type="number"
								descriptionKey="location_capacity_description"
							/>
						</>,
					)}

					{/* Address Information Tab */}
					{renderTabContent(
						"address",
						"Address Information",
						"Provide the complete address for this location.",
						<>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<InputFormField
									control={form.control}
									name="address.office"
									labelKey="office"
									placeholderKey="office_placeholder"
								/>
								<InputFormField
									control={form.control}
									name="address.building"
									labelKey="building"
									placeholderKey="building_placeholder"
								/>
							</div>
							<InputFormField
								control={form.control}
								name="address.street"
								labelKey="street_address"
								placeholderKey="street_address_placeholder"
							/>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<InputFormField
									control={form.control}
									name="address.city"
									labelKey="city"
									placeholderKey="city_placeholder"
								/>
								<InputFormField
									control={form.control}
									name="address.state"
									labelKey="state"
									placeholderKey="state_placeholder"
								/>
							</div>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<InputFormField
									control={form.control}
									name="address.zipCode"
									labelKey="zip_code"
									placeholderKey="zip_code_placeholder"
								/>
								{renderSelectField(
									"address.country",
									"Country",
									"Select a country",
									COUNTRIES,
								)}
							</div>
						</>,
					)}

					{/* Contact Information Tab */}
					{renderTabContent(
						"contact",
						"Contact Information",
						"Add contact details for this location.",
						<>
							<InputFormField
								control={form.control}
								name="contactName"
								labelKey="contact_name"
								placeholderKey="contact_name_placeholder"
							/>
							<InputFormField
								control={form.control}
								name="contactEmail"
								labelKey="contact_email"
								placeholderKey="contact_email_placeholder"
							/>
							<InputFormField
								control={form.control}
								name="contactPhone"
								labelKey="contact_phone"
								placeholderKey="contact_phone_placeholder"
							/>
						</>,
					)}

					{/* Settings Tab */}
					{renderTabContent(
						"settings",
						"Location Settings",
						undefined,
						<>
							<SwitchFormField
								control={form.control}
								name="isActive"
								labelKey="is_active"
								descriptionKey="location_active_description"
							/>
							<SwitchFormField
								control={form.control}
								name="isDefault"
								labelKey="is_default"
								descriptionKey="location_default_description"
							/>
						</>,
					)}
				</Tabs>

				{/* Navigation Footer */}
				<div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between border-t bg-background pt-6">
					<div className="flex gap-2">
						{!isFirstTab && (
							<Button
								type="button"
								variant="outline"
								onClick={goToPrevTab}
								className="min-w-[100px]"
							>
								← Previous
							</Button>
						)}
					</div>
					<div className="flex gap-3">
						{!isLastTab ? (
							<Button
								type="button"
								onClick={goToNextTab}
								className="min-w-[100px]"
							>
								Next →
							</Button>
						) : (
							<Button
								type="submit"
								disabled={isSubmitting}
								className="min-w-[120px]"
								onClick={form.handleSubmit(handleSubmit)}
							>
								{isSubmitting
									? t("submitting")
									: initialValues
										? t("save_changes")
										: "Create location"}
							</Button>
						)}
					</div>
				</div>
			</FormProvider>
		</div>
	);
}
