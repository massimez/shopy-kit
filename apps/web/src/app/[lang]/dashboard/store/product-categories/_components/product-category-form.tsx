"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { useProductCategories } from "@/app/[lang]/dashboard/store/product-categories/hooks/use-product-categories";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_LOCALE, LOCALES } from "@/constants/locales";

// ---------------- Schema ----------------
const translationSchema = z.object({
	languageCode: z.string(),
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

const productCategorySchema = z.object({
	parentId: z.string().nullable(),
	translations: z.array(translationSchema).min(1),
});

export type ProductCategoryFormValues = z.infer<typeof productCategorySchema>;

// ---------------- Helpers ----------------
const emptyTranslation = (lang: string) => ({
	languageCode: lang,
	name: "",
	slug: "",
	description: "",
	metaTitle: "",
	metaDescription: "",
});

// ---------------- Component ----------------
export function ProductCategoryForm({
	initialValues,
	onSubmit,
	currentLanguage,
}: {
	initialValues?: ProductCategoryFormValues;
	onSubmit: (values: ProductCategoryFormValues) => void;
	currentLanguage?: string;
}) {
	const [selectedLanguage, setSelectedLanguage] = useState(
		currentLanguage || DEFAULT_LOCALE,
	);

	// form
	const form = useForm<ProductCategoryFormValues>({
		resolver: zodResolver(productCategorySchema),
		defaultValues: initialValues ?? {
			parentId: null,
			translations: [emptyTranslation(currentLanguage || DEFAULT_LOCALE)],
		},
	});

	const { control, handleSubmit, setValue } = form;

	// translations field array
	const { fields, append } = useFieldArray({
		control,
		name: "translations",
	});

	// ensure current language exists in translations
	useEffect(() => {
		const exists = fields.some((f) => f.languageCode === selectedLanguage);
		if (!exists) {
			append(emptyTranslation(selectedLanguage));
		}
	}, [selectedLanguage, fields, append]);

	// fetch categories
	const { data: categories } = useProductCategories(selectedLanguage);

	// Get the actual index for the current language
	const currentLanguageIndex = fields.findIndex(
		(f) => f.languageCode === selectedLanguage,
	);

	return (
		<Form {...form}>
			<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
				{/* Parent category */}
				<FormField
					control={control}
					name="parentId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{"Parent Category"}</FormLabel>
							<Select
								onValueChange={(val) =>
									setValue("parentId", val === "none" ? null : val)
								}
								value={field.value ?? "none"}
							>
								<SelectTrigger>
									<SelectValue placeholder={"Select parent category"} />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">{"Top Level"}</SelectItem>
									{categories?.data?.map((category) => (
										<SelectItem key={category.id} value={category.id}>
											{category.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Language selector */}
				<div className="flex items-center gap-2">
					<FormLabel>{"Language"}</FormLabel>
					<Select
						onValueChange={(val) => setSelectedLanguage(val)}
						value={selectedLanguage}
					>
						<SelectTrigger className="w-40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{LOCALES.map((lang) => (
								<SelectItem key={lang.code} value={lang.code}>
									{lang.name.toUpperCase()}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				{/* Only current language fields - using the correct index */}
				{currentLanguageIndex !== -1 && (
					<div className="space-y-4 rounded-lg border p-4">
						<Controller
							control={control}
							name={`translations.${currentLanguageIndex}.name`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{"Name"}</FormLabel>
									<Input placeholder={"Enter category name"} {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<Controller
							control={control}
							name={`translations.${currentLanguageIndex}.slug`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{"Slug"}</FormLabel>
									<Input placeholder={"Enter category slug"} {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<Controller
							control={control}
							name={`translations.${currentLanguageIndex}.description`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{"Description"}</FormLabel>
									<Textarea
										placeholder={"Enter category description"}
										{...field}
									/>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Controller
							control={control}
							name={`translations.${currentLanguageIndex}.metaTitle`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{"Meta Title"}</FormLabel>
									<Input placeholder={"Enter meta title"} {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
						<Controller
							control={control}
							name={`translations.${currentLanguageIndex}.metaDescription`}
							render={({ field }) => (
								<FormItem>
									<FormLabel>{"Meta Description"}</FormLabel>
									<Textarea placeholder={"Enter meta description"} {...field} />
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				)}

				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Saving..." : "Submit"}
				</Button>
			</form>
		</Form>
	);
}
