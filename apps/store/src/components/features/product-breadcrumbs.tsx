"use client";

import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

interface ProductBreadcrumbsProps {
	items: {
		label: string;
		href?: string;
	}[];
}

export function ProductBreadcrumbs({ items }: ProductBreadcrumbsProps) {
	const t = useTranslations("Navigation");

	return (
		<nav className="flex items-center text-muted-foreground text-sm">
			<Link href="/" className="transition-colors hover:text-primary">
				{t("home")}
			</Link>
			{items.map((item) => (
				<div key={item.label} className="flex items-center">
					<ChevronRight className="mx-2 h-4 w-4" />
					{item.href ? (
						<Link
							href={item.href}
							className="transition-colors hover:text-primary"
						>
							{item.label}
						</Link>
					) : (
						<span className="font-medium text-foreground">{item.label}</span>
					)}
				</div>
			))}
		</nav>
	);
}
