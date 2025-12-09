"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

interface CategoryHeaderProps {
	title: string;
	subcategories: {
		id: string;
		name: string;
		slug: string;
	}[];
	className?: string;
}

export function CategoryHeader({
	title,
	subcategories,
	className,
}: CategoryHeaderProps) {
	return (
		<div className={cn("", className)}>
			<h1 className="pb-6 font-bold text-3xl md:text-4xl">{title}</h1>

			{subcategories.length > 0 && (
				<div className="mb-9 flex flex-wrap gap-2">
					{subcategories.map((sub) => (
						<Link key={sub.id} href={`/category/${sub.slug}`}>
							<Badge
								variant="outline"
								className="cursor-pointer rounded-xl px-4 py-4 text-sm transition-colors hover:bg-secondary/80"
							>
								{sub.name}
							</Badge>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
