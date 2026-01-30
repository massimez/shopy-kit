"use client";

import { Button } from "@workspace/ui/components/button";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { CartModal } from "./cart-modal";

export function MobileCartBar() {
	const [isOpen, setIsOpen] = useState(false);
	const isMounted = useMounted();
	const { itemCount } = useCartStore();

	const cartCount = isMounted ? itemCount() : 0;

	return (
		<>
			<div className="fixed end-4 bottom-6 z-50 lg:hidden">
				<Button
					className="flex h-15 w-15 items-center justify-center rounded-full shadow-xl"
					size="icon"
					onClick={() => setIsOpen(true)}
				>
					<div className="relative">
						<ShoppingBag className="size-6" />
						{cartCount > 0 && (
							<span className="-top-3 -right-3 absolute flex h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-red-600 font-bold text-white text-xs">
								{cartCount > 99 ? "99+" : cartCount}
							</span>
						)}
					</div>
				</Button>
			</div>

			<CartModal open={isOpen} onOpenChange={setIsOpen} />
		</>
	);
}
