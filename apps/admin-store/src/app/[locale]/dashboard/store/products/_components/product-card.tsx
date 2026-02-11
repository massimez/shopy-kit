"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@workspace/ui/components/card";
import {
	Calendar,
	DollarSign,
	Edit,
	Eye,
	EyeOff,
	Layers,
	Package,
	Smartphone,
	Tag,
	Trash2,
} from "lucide-react";
import type { Product } from "./use-products";

interface ProductCardProps {
	product: Product;
	selectedLanguage: string;
	onEdit: (product: Product) => void;
	onDelete: (productId: string) => void;
}

export const ProductCard = ({
	product,
	selectedLanguage,
	onEdit,
	onDelete,
}: ProductCardProps) => {
	const translation = product.translations?.find(
		(t) => t.languageCode === selectedLanguage,
	);
	const displayName = translation?.name || product.name || "Untitled Product";
	const variants = product.variants || [];
	const mainImage = product.thumbnailImage?.url || product.images?.[0]?.url;

	const getStatusVariant = (status: string) => {
		switch (status) {
			case "published":
				return "success";
			case "active":
				return "success";
			case "draft":
				return "secondary";
			case "archived":
				return "destructive";
			default:
				return "outline";
		}
	};

	const getTypeIcon = (type?: string) => {
		switch (type) {
			case "digital":
				return <Smartphone className="size-8 text-muted-foreground/50" />;
			case "variable":
				return <Layers className="size-8 text-muted-foreground/50" />;
			default:
				return <Package className="size-8 text-muted-foreground/50" />;
		}
	};

	return (
		<Card className="group flex h-full flex-col gap-2 overflow-hidden border-border/50 bg-card py-0 transition-all hover:border-primary/50 hover:shadow-lg">
			{/* Image Section */}
			<div className="relative aspect-video w-full overflow-hidden bg-muted">
				{mainImage ? (
					// biome-ignore lint/performance/noImgElement: <>
					<img
						src={mainImage}
						alt={displayName}
						className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-muted/50">
						{getTypeIcon(product.type)}
					</div>
				)}

				{/* Status Badges Overlay */}
				<div className="absolute top-2 left-2 flex flex-col gap-1">
					<Badge
						variant={getStatusVariant(product.status)}
						className="h-5 px-1.5 text-[10px] shadow-sm backdrop-blur-md"
					>
						{product.status === "active" || product.status === "published" ? (
							<Eye className="mr-1 h-3 w-3" />
						) : (
							<EyeOff className="mr-1 h-3 w-3" />
						)}
						{product.status.charAt(0).toUpperCase() + product.status.slice(1)}
					</Badge>
					{product.isFeatured && (
						<Badge
							variant="secondary"
							className="h-5 w-fit bg-yellow-500/10 px-1.5 text-[10px] text-yellow-600 shadow-sm backdrop-blur-md dark:text-yellow-400"
						>
							⭐ Featured
						</Badge>
					)}
				</div>
			</div>

			<CardHeader className="px-3 pb-1">
				<div className="flex items-start justify-between gap-2">
					<div className="w-full space-y-1">
						<h3 className="line-clamp-1 font-semibold text-base leading-tight tracking-tight">
							{displayName}
						</h3>
					</div>
				</div>
			</CardHeader>

			<CardContent className="mt-0 flex flex-1 flex-col p-3 pt-0 text-sm">
				<div className="flex items-center justify-between gap-2 text-xs">
					{product.currency && (
						<div className="flex items-center gap-1.5 font-medium text-foreground">
							<DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
							{product.currency}
						</div>
					)}

					{product.collectionIds && product.collectionIds.length > 0 && (
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Tag className="h-3.5 w-3.5" />
							<span>{product.collectionIds.length} Col.</span>
						</div>
					)}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-muted-foreground text-xs">
					<div className="flex items-center gap-1.5">
						<Layers className="h-3.5 w-3.5" />
						<span>{variants.length} Var.</span>
					</div>

					{product.trackStock && (
						<div className="flex items-center gap-1.5">
							<Package className="h-3.5 w-3.5" />
							<span>
								{product.minQuantity} - {product.maxQuantity || "∞"}
							</span>
						</div>
					)}
				</div>

				{product.allowBackorders && (
					<div className="mt-2 flex">
						<div className="rounded-sm bg-muted px-1.5 py-0.5 font-medium text-[10px] leading-none">
							Backorder
						</div>
					</div>
				)}
			</CardContent>

			<CardFooter className="flex items-center justify-between border-t bg-muted/30 px-3 py-2 text-xs">
				<div className="flex items-center gap-1 text-muted-foreground">
					<Calendar className="h-3 w-3" />
					<span>{new Date(product.createdAt).toLocaleDateString()}</span>
				</div>

				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-muted-foreground hover:bg-background/80 hover:text-foreground"
						onClick={() => onEdit(product)}
					>
						<Edit className="h-3.5 w-3.5" />
						<span className="sr-only">Edit</span>
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
						onClick={() => onDelete(product.id)}
					>
						<Trash2 className="h-3.5 w-3.5" />
						<span className="sr-only">Delete</span>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
};
