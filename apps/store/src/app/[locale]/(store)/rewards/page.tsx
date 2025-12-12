import type { Metadata } from "next";
import { Suspense } from "react";
import { RewardsDashboard } from "./_components/rewards-dashboard";

export const metadata: Metadata = {
	title: "Rewards & Loyalty | Shop",
	description:
		"Earn points, unlock tiers, and redeem exclusive rewards. Join our loyalty program and enjoy special perks for being a valued customer.",
};

function RewardsLoading() {
	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="h-32 w-32 animate-spin rounded-full border-violet-500 border-t-2 border-b-2" />
		</div>
	);
}

export default function RewardsPage() {
	return (
		<div className="mx-auto px-4 py-10">
			<Suspense fallback={<RewardsLoading />}>
				<RewardsDashboard />
			</Suspense>
		</div>
	);
}
