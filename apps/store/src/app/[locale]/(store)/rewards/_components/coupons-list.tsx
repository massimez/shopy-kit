"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Copy, Loader2, Ticket } from "lucide-react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function CouponsList() {
	const { data, isLoading } = useQuery({
		queryKey: ["rewards", "coupons"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.coupons.$get();
			return await res.json();
		},
	});

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Coupon code copied to clipboard!");
	};

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!data?.success || !data.data.coupons.length) {
		return (
			<div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
				<Ticket className="h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">You don't have any coupons yet.</p>
			</div>
		);
	}

	return (
		<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{data.data.coupons.map((coupon) => (
				<Card key={coupon.id} className="relative overflow-hidden">
					<div className="absolute top-2 right-2">
						<Badge
							variant={coupon.status === "active" ? "primary" : "secondary"}
						>
							{coupon.status}
						</Badge>
					</div>
					<CardHeader>
						<CardTitle className="font-mono text-xl">{coupon.code}</CardTitle>
						<CardDescription>
							{coupon.type === "percentage_discount" &&
							coupon.discountPercentage
								? `${coupon.discountPercentage}% OFF`
								: coupon.type === "fixed_discount" && coupon.discountAmount
									? `$${coupon.discountAmount} OFF`
									: "Discount"}
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="text-muted-foreground text-sm">
							{coupon.minOrderAmount
								? `Min. order: $${coupon.minOrderAmount}`
								: "No minimum order"}
						</div>
						{coupon.expiresAt && (
							<div className="text-muted-foreground text-sm">
								Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
							</div>
						)}
						<Button
							variant="outline"
							className="mt-4 w-full"
							onClick={() => copyCode(coupon.code)}
						>
							<Copy className="mr-2 h-4 w-4" />
							Copy Code
						</Button>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
