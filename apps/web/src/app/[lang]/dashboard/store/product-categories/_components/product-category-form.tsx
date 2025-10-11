"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { debounce, getSlug } from "@/lib/helpers";

// Simplified schema - single translation
const translationSchema = z.object({
	languageCode: z.string(),
	name: z.string().min(1, "Name is required"),
	slug: z.string().min(1, "Slug is required"),
	description: z.string().optional(),
	metaTitle: z.string().optional(),
	metaDescription: z.string().optional(),
});

const productCategoryFormSchema = z.object({
	parentId: z.string().nullable(),
	translation: translationSchema,
});

export type ProductCategoryFormValues = z.infer<
	typeof productCategoryFormSchema
>;

// Component
export function ProductCategoryForm({
	initialValues,
	onSubmit,
	currentLanguage,
}: {
	initialValues?: ProductCategoryFormValues;
	onSubmit: (values: ProductCategoryFormValues) => void;
	currentLanguage: string;
}) {
	const form = useForm({
		resolver: zodResolver(productCategoryFormSchema),
		defaultValues: initialValues ?? {
			parentId: null,
			translation: {
				languageCode: currentLanguage,
				name: "",
				slug: "",
				description: "",
				metaTitle: "",
				metaDescription: "",
			},
		},
	});

	const { data: categories } = useProductCategories(currentLanguage);

	const handleNameChange = (value: string) => {
		const slug = getSlug(value);
		debounce(() => {
			form.setValue("translation.slug", slug);
		}, 300)();
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				{/* Parent Category */}
				<FormField
					control={form.control}
					name="parentId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Parent Category</FormLabel>
							<Select
								onValueChange={(val) =>
									field.onChange(val === "none" ? null : val)
								}
								value={field.value ?? "none"}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select parent category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Top Level</SelectItem>
									{categories?.data?.map((cat) => (
										<SelectItem key={cat.id} value={cat.id}>
											{cat.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Translation Fields */}
				<div className="space-y-4 rounded-lg border p-4">
					<FormField
						control={form.control}
						name="translation.name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Name</FormLabel>
								<Input
									placeholder="Enter category name"
									{...field}
									onChange={(e) => {
										field.onChange(e);
										handleNameChange(e.target.value);
									}}
								/>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.slug"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Slug</FormLabel>
								<Input placeholder="Enter category slug" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.description"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<Textarea placeholder="Enter category description" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.metaTitle"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Meta Title</FormLabel>
								<Input placeholder="Enter meta title" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="translation.metaDescription"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Meta Description</FormLabel>
								<Textarea placeholder="Enter meta description" {...field} />
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				<Button type="submit" disabled={form.formState.isSubmitting}>
					{form.formState.isSubmitting ? "Saving..." : "Submit"}
				</Button>
			</form>
		</Form>
	);
}
