"use client";

import { Button } from "@workspace/ui/components/button";
import { useMounted } from "@workspace/ui/hooks/use-mounted";
import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { useCartStore } from "@/store/use-cart-store";
import { AuthModal } from "../../auth/auth-modal";
import { CartModal } from "./cart-modal";

export function MobileCartBar() {
	const [isOpen, setIsOpen] = useState(false);
	const isMounted = useMounted();
	const { itemCount } = useCartStore();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalView, setAuthModalView] = useState<"signIn" | "signUp">(
		"signIn",
	);
	const [cartView, setCartView] = useState<"cart" | "checkout">("cart");
	const [isBumping, setIsBumping] = useState(false);

	const cartCount = isMounted ? itemCount() : 0;

	// Animate when cart count changes
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useMemo(() => {
		if (cartCount > 0) {
			setIsBumping(true);
			const timer = setTimeout(() => setIsBumping(false), 500);
			return () => clearTimeout(timer);
		}
	}, [cartCount]);

	const handleLoginClick = () => {
		setAuthModalView("signIn");
		setIsAuthModalOpen(true);
	};

	const handleLoginSuccess = () => {
		setCartView("checkout");
		setIsOpen(true);
	};

	return (
		<>
			<div className="fixed right-4 bottom-6 z-50 lg:hidden">
				<Button
					className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 ${
						isBumping ? "scale-125 bg-primary/90" : "bg-primary"
					}`}
					size="icon"
					onClick={() => {
						setCartView("cart");
						setIsOpen(true);
					}}
				>
					<div className="relative">
						<ShoppingBag className="size-7 text-primary-foreground" />
						{cartCount > 0 && (
							<span className="zoom-in absolute -top-2 -right-2 flex h-5 w-5 animate-in items-center justify-center rounded-full border-2 border-background bg-red-600 font-bold text-[10px] text-white">
								{cartCount > 99 ? "99+" : cartCount}
							</span>
						)}
					</div>
				</Button>
			</div>

			<CartModal
				key={cartView}
				open={isOpen}
				onOpenChange={setIsOpen}
				onLoginClick={handleLoginClick}
				defaultView={cartView}
			/>

			<AuthModal
				open={isAuthModalOpen}
				onOpenChange={setIsAuthModalOpen}
				defaultView={authModalView}
				onLoginSuccess={handleLoginSuccess}
			/>
		</>
	);
}
