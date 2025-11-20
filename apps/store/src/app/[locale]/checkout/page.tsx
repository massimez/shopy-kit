"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useCartStore } from "@/store/use-cart-store";

export default function CheckoutPage() {
	const t = useTranslations("Navigation");
	const { items, total, clearCart } = useCartStore();
	const { data: session, isPending } = useSession();
	const router = useRouter();

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/login"); // Should redirect to login if not authenticated
		}
	}, [session, isPending, router]);

	if (isPending) {
		return <div>Loading...</div>;
	}

	if (!session) {
		return null; // Will redirect
	}

	return (
		<div className="container py-10">
			<h1 className="mb-8 font-bold text-4xl">{t("checkout")}</h1>
			<div className="grid grid-cols-1 gap-8 md:grid-cols-3">
				<div className="md:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle>Order Summary</CardTitle>
						</CardHeader>
						<CardContent>
							{items.length === 0 ? (
								<p>Your cart is empty.</p>
							) : (
								<div className="space-y-4">
									{items.map((item) => (
										<div
											key={item.id}
											className="flex items-center justify-between border-b pb-4"
										>
											<div>
												<p className="font-medium">{item.name}</p>
												<p className="text-muted-foreground text-sm">
													Qty: {item.quantity}
												</p>
											</div>
											<p>${(item.price * item.quantity).toFixed(2)}</p>
										</div>
									))}
								</div>
							)}
						</CardContent>
					</Card>
				</div>
				<div>
					<Card>
						<CardHeader>
							<CardTitle>Total</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-6 font-bold text-3xl">${total().toFixed(2)}</p>
							<Button className="w-full" onClick={() => clearCart()}>
								Place Order
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
