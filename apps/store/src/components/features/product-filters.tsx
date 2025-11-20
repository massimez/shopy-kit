"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const filters = {
	categories: [
		{
			name: "Electronics",
			subcategories: ["Headphones", "Smartwatches", "Speakers", "Laptops"],
		},
		{
			name: "Sports",
			subcategories: ["Running", "Yoga", "Gym", "Accessories"],
		},
		{
			name: "Home",
			subcategories: ["Kitchen", "Decor", "Lighting", "Furniture"],
		},
		{
			name: "Clothing",
			subcategories: ["Men", "Women", "Kids", "Accessories"],
		},
	],
	colors: ["Black", "White", "Blue", "Red", "Green", "Yellow"],
	materials: ["Cotton", "Polyester", "Leather", "Wool", "Metal", "Wood"],
	brands: ["Nike", "Adidas", "Sony", "Apple", "Samsung", "Generic"],
	sizes: ["XS", "S", "M", "L", "XL", "XXL"],
};

interface FilterSectionProps {
	title: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
}

function FilterSection({
	title,
	children,
	defaultOpen = false,
}: FilterSectionProps) {
	const [isOpen, setIsOpen] = useState(defaultOpen);

	return (
		<div className="border-border border-b py-4 last:border-0">
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className="flex w-full items-center justify-between py-2 text-left font-medium transition-colors hover:text-primary"
			>
				<span className="font-semibold text-base">{title}</span>
				{isOpen ? (
					<ChevronUp className="size-4 text-muted-foreground" />
				) : (
					<ChevronDown className="size-4 text-muted-foreground" />
				)}
			</button>
			{isOpen && (
				<div className="slide-in-from-top-2 fade-in animate-in pt-4 duration-200">
					{children}
				</div>
			)}
		</div>
	);
}

export function ProductFilters() {
	const [categories, setCategories] = useQueryState(
		"category",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [colors, setColors] = useQueryState(
		"color",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [materials, setMaterials] = useQueryState(
		"material",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [brands, setBrands] = useQueryState(
		"brand",
		parseAsArrayOf(parseAsString).withDefault([]),
	);
	const [sizes, setSizes] = useQueryState(
		"size",
		parseAsArrayOf(parseAsString).withDefault([]),
	);

	const toggleFilter = (
		currentValues: string[],
		setValues: (values: string[] | null) => void,
		valueToToggle: string,
	) => {
		if (currentValues.includes(valueToToggle)) {
			const newValues = currentValues.filter((v) => v !== valueToToggle);
			setValues(newValues.length > 0 ? newValues : null);
		} else {
			setValues([...currentValues, valueToToggle]);
		}
	};

	return (
		<div className="space-y-1">
			<FilterSection title="Categories" defaultOpen={true}>
				<div className="space-y-3">
					{filters.categories.map((item) => (
						<div key={item.name} className="space-y-2">
							{/* Parent Category */}
							<div className="flex items-center space-x-3">
								<input
									type="checkbox"
									id={`category-${item.name}`}
									className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
									checked={categories.includes(item.name)}
									onChange={() =>
										toggleFilter(categories, setCategories, item.name)
									}
								/>
								<label
									htmlFor={`category-${item.name}`}
									className="flex flex-1 cursor-pointer items-center justify-between font-medium text-sm leading-none transition-colors hover:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
								>
									<span>{item.name}</span>
									{item.subcategories.length > 0 && (
										<ChevronDown
											className={cn(
												"size-4 text-muted-foreground transition-transform",
												categories.includes(item.name) && "rotate-180",
											)}
										/>
									)}
								</label>
							</div>

							{/* Subcategories - Show when parent is selected */}
							{categories.includes(item.name) &&
								item.subcategories.length > 0 && (
									<div className="ml-7 space-y-2 border-border border-l-2 pl-3">
										{item.subcategories.map((sub) => (
											<div key={sub} className="flex items-center space-x-3">
												<input
													type="checkbox"
													id={`subcategory-${sub}`}
													className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
													checked={categories.includes(sub)}
													onChange={() =>
														toggleFilter(categories, setCategories, sub)
													}
												/>
												<label
													htmlFor={`subcategory-${sub}`}
													className="cursor-pointer text-sm leading-none transition-colors hover:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
												>
													{sub}
												</label>
											</div>
										))}
									</div>
								)}
						</div>
					))}
				</div>
			</FilterSection>

			<FilterSection title="Colors" defaultOpen={true}>
				<div className="flex flex-wrap gap-2">
					{filters.colors.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => toggleFilter(colors, setColors, item)}
							className={cn(
								"size-8 rounded-full border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
								colors.includes(item)
									? "border-primary ring-2 ring-primary ring-offset-2"
									: "border-transparent",
							)}
							style={{ backgroundColor: item.toLowerCase() }}
							title={item}
							aria-label={`Select color ${item}`}
						/>
					))}
				</div>
			</FilterSection>

			<FilterSection title="Material" defaultOpen={false}>
				<div className="space-y-3">
					{filters.materials.map((item) => (
						<div key={item} className="flex items-center space-x-3">
							<input
								type="checkbox"
								id={`material-${item}`}
								className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
								checked={materials.includes(item)}
								onChange={() => toggleFilter(materials, setMaterials, item)}
							/>
							<label
								htmlFor={`material-${item}`}
								className="cursor-pointer font-medium text-sm leading-none transition-colors hover:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{item}
							</label>
						</div>
					))}
				</div>
			</FilterSection>

			<FilterSection title="Brand" defaultOpen={false}>
				<div className="space-y-3">
					{filters.brands.map((item) => (
						<div key={item} className="flex items-center space-x-3">
							<input
								type="checkbox"
								id={`brand-${item}`}
								className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
								checked={brands.includes(item)}
								onChange={() => toggleFilter(brands, setBrands, item)}
							/>
							<label
								htmlFor={`brand-${item}`}
								className="cursor-pointer font-medium text-sm leading-none transition-colors hover:text-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{item}
							</label>
						</div>
					))}
				</div>
			</FilterSection>

			<FilterSection title="Size" defaultOpen={false}>
				<div className="grid grid-cols-3 gap-2">
					{filters.sizes.map((item) => (
						<button
							key={item}
							type="button"
							onClick={() => toggleFilter(sizes, setSizes, item)}
							className={cn(
								"flex items-center justify-center rounded-md border px-3 py-2 font-medium text-sm transition-colors hover:border-primary hover:text-primary",
								sizes.includes(item)
									? "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
									: "border-input bg-background",
							)}
						>
							{item}
						</button>
					))}
				</div>
			</FilterSection>
		</div>
	);
}
