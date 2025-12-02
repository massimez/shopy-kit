"use client";

import { useQuery } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Copy, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function ReferralCard() {
	const { data, isLoading } = useQuery({
		queryKey: ["rewards", "referral"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.referral.$get();
			return await res.json();
		},
	});

	const copyCode = (code: string) => {
		navigator.clipboard.writeText(code);
		toast.success("Referral code copied to clipboard!");
	};

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!data?.success) {
		return (
			<div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
				<Users className="h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">
					Unable to load referral program.
				</p>
			</div>
		);
	}

	const { referralCode, stats, bonuses } = data.data;

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Your Referral Code</CardTitle>
					<CardDescription>
						Share this code with friends! They get {bonuses.referee} points, and
						you get {bonuses.referrer} points.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex space-x-2">
						<Input value={referralCode} readOnly />
						<Button
							variant="outline"
							size="icon"
							onClick={() => copyCode(referralCode)}
						>
							<Copy className="h-4 w-4" />
						</Button>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Referral Stats</CardTitle>
					<CardDescription>Track your referral success</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<div className="font-bold text-2xl">{stats.totalReferrals}</div>
							<p className="text-muted-foreground text-xs">Total Referrals</p>
						</div>
						<div>
							<div className="font-bold text-2xl">{stats.bonusesEarned}</div>
							<p className="text-muted-foreground text-xs">Points Earned</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
