"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCartStore } from "@/store/use-cart-store";
import { CartContent } from "./cart-content";

interface CartModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CartModal({ open, onOpenChange }: CartModalProps) {
	const t = useTranslations("Cart");
	const { itemCount } = useCartStore();

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent side="right" className="flex w-full flex-col sm:max-w-lg">
				<SheetHeader className="shrink-0">
					<div className="flex items-center justify-between">
						<SheetTitle className="flex items-center gap-2">
							<ShoppingBag className="size-5" />
							{t("title")}
							{itemCount() > 0 && (
								<span className="text-muted-foreground">({itemCount()})</span>
							)}
						</SheetTitle>
					</div>
				</SheetHeader>

				<div className="flex-1 overflow-hidden pt-4">
					<CartContent onCartClose={() => onOpenChange(false)} />
				</div>
			</SheetContent>
		</Sheet>
	);
}
