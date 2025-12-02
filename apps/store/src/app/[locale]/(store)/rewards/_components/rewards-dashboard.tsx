"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import { Loader2 } from "lucide-react";
import { hc } from "@/lib/api-client";
import { CouponsList } from "./coupons-list";
import { HistoryList } from "./history-list";
import { MilestonesList } from "./milestones-list";
import { PointsCard } from "./points-card";
import { ProgramStatsCard } from "./program-stats-card";
import { ReferralCard } from "./referral-card";
import { RewardsCatalog } from "./rewards-catalog";
import { TierCard } from "./tier-card";

export function RewardsDashboard() {
	const { data: balanceData, isLoading: isLoadingBalance } = useQuery({
		queryKey: ["rewards", "balance"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.balance.$get();
			return await res.json();
		},
	});

	const { data: statsData } = useQuery({
		queryKey: ["rewards", "stats"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.stats.$get();
			return await res.json();
		},
	});

	if (isLoadingBalance) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!balanceData?.success) {
		return (
			<div className="flex h-[50vh] flex-col items-center justify-center gap-4">
				<h2 className="font-bold text-2xl">Unable to load rewards</h2>
				<p className="text-muted-foreground">Please try again later.</p>
			</div>
		);
	}

	const { hasProgram, balance, tier } = balanceData.data;

	if (!hasProgram) {
		return (
			<div className="flex h-[50vh] flex-col items-center justify-center gap-4">
				<h2 className="font-bold text-2xl">No Active Rewards Program</h2>
				<p className="text-muted-foreground">
					Check back later for exciting rewards!
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="font-bold text-3xl tracking-tight">
						Rewards & Loyalty
					</h1>
					<p className="text-muted-foreground">
						Earn points, unlock tiers, and redeem exclusive rewards.
					</p>
				</div>
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<PointsCard
					balance={balance?.currentPoints || 0}
					lifetimePoints={balance?.totalEarnedPoints || 0}
				/>
				<TierCard
					currentTierName={tier?.currentTier?.name || "No Tier"}
					nextTierName={tier?.nextTier?.name}
					pointsToNextTier={tier?.pointsToNextTier}
				/>
				{statsData?.success && (
					<ProgramStatsCard
						totalPointsIssued={statsData.data.totalPointsIssued}
						activeUsers={statsData.data.activeUsers}
					/>
				)}
			</div>

			<Tabs defaultValue="rewards" className="space-y-4">
				<TabsList>
					<TabsTrigger value="rewards">Rewards</TabsTrigger>
					<TabsTrigger value="coupons">My Coupons</TabsTrigger>
					<TabsTrigger value="referrals">Referrals</TabsTrigger>
					<TabsTrigger value="milestones">Milestones</TabsTrigger>
					<TabsTrigger value="history">History</TabsTrigger>
				</TabsList>
				<TabsContent value="rewards" className="space-y-4">
					<RewardsCatalog />
				</TabsContent>
				<TabsContent value="coupons" className="space-y-4">
					<CouponsList />
				</TabsContent>
				<TabsContent value="referrals" className="space-y-4">
					<ReferralCard />
				</TabsContent>
				<TabsContent value="milestones" className="space-y-4">
					<MilestonesList />
				</TabsContent>
				<TabsContent value="history" className="space-y-4">
					<HistoryList />
				</TabsContent>
			</Tabs>
		</div>
	);
}
