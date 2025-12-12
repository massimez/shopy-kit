"use client";

import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { cn } from "@workspace/ui/lib/utils";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/use-cart-store";
import { CartContent } from "./cart-content";

interface CartSidebarProps {
	className?: string;
}

export function CartSidebar({ className }: CartSidebarProps) {
	const t = useTranslations("Cart");
	const { itemCount } = useCartStore();
	const isMounted = useMounted();
	const count = isMounted ? itemCount() : 0;

	return (
		<aside className={cn(className)}>
			<div className="mb-4 flex items-center gap-2">
				<ShoppingBag className="size-5" />
				<h2 className="font-semibold text-lg">{t("title")}</h2>
				{count > 0 && <span className="text-muted-foreground">({count})</span>}
			</div>

			<div className="flex-1 overflow-hidden">
				<CartContent />
			</div>
		</aside>
	);
}
