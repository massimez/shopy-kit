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
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@workspace/ui/components/tabs";
import {
	ArrowLeft,
	Award,
	DollarSign,
	Gift,
	Settings,
	ShoppingBag,
	Target,
	TrendingUp,
	Trophy,
	Users,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PageDashboardHeader } from "@/app/[locale]/(landing)/_components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { StatIcon } from "../../../_components/reward-icons";
import { ProgramForm } from "../../_components/program-form";
import { MilestonesManager } from "./milestones-manager";
import { ReferralsManager } from "./referrals-manager";
import { RewardsManager } from "./rewards-manager";
import { TiersManager } from "./tiers-manager";

export const ProgramDetailsClient = () => {
	const params = useParams();
	const id = params.id as string;

	const { data: response, isLoading: isProgramLoading } = useQuery({
		queryKey: ["bonus-program", id],
		queryFn: async () => {
			const res = await hc.api.store["bonus-programs"][":id"].$get({
				param: { id },
			});
			return await res.json();
		},
	});

	const { data: statsResponse, isLoading: isStatsLoading } = useQuery({
		queryKey: ["bonus-program-stats", id],
		queryFn: async () => {
			const res = await hc.api.store["bonus-programs"][":id"]["stats"].$get({
				param: { id },
			});
			return await res.json();
		},
		enabled: !!response?.success,
	});

	const program = response?.data;
	const stats = statsResponse?.data;

	if (isProgramLoading || isStatsLoading) {
		return (
			<div className="space-y-6 p-4">
				<div className="flex items-center gap-4">
					<Skeleton className="h-10 w-10 rounded-md" />
					<div className="space-y-2">
						<Skeleton className="h-8 w-64" />
						<Skeleton className="h-4 w-48" />
					</div>
				</div>
				<Skeleton className="h-[400px] w-full rounded-xl" />
			</div>
		);
	}

	if (!program) {
		return (
			<div className="flex h-[50vh] flex-col items-center justify-center p-4">
				<h2 className="mb-2 font-bold text-2xl">Program not found</h2>
				<p className="mb-4 text-muted-foreground">
					The bonus program you are looking for does not exist.
				</p>
				<Link href="/dashboard/rewards/programs">
					<Button variant="outline">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Back to Programs
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-4">
			<div className="mb-4">
				<Link href="/dashboard/rewards/programs">
					<Button
						variant="ghost"
						size="sm"
						className="gap-2 pl-0 text-muted-foreground"
					>
						<ArrowLeft className="h-4 w-4" />
						Back to Programs
					</Button>
				</Link>
			</div>

			<div className="flex items-start justify-between">
				<div>
					<PageDashboardHeader
						title={program.name}
						description={program.description || "Manage program details"}
					/>
				</div>
				<Badge
					variant={program.isActive ? "primary" : "secondary"}
					className={
						program.isActive
							? "bg-green-100 text-green-700 hover:bg-green-100"
							: ""
					}
				>
					{program.isActive ? "Active" : "Inactive"}
				</Badge>
			</div>

			<Tabs defaultValue="overview" className="space-y-4">
				<TabsList>
					<TabsTrigger value="overview" className="gap-2">
						<TrendingUp className="h-4 w-4" />
						Overview
					</TabsTrigger>
					<TabsTrigger value="tiers" className="gap-2">
						<Trophy className="h-4 w-4" />
						Tiers
					</TabsTrigger>
					<TabsTrigger value="rewards" className="gap-2">
						<Gift className="h-4 w-4" />
						Rewards
					</TabsTrigger>
					<TabsTrigger value="milestones" className="gap-2">
						<Target className="h-4 w-4" />
						Milestones
					</TabsTrigger>
					<TabsTrigger value="referrals" className="gap-2">
						<Users className="h-4 w-4" />
						Referrals
					</TabsTrigger>
					<TabsTrigger value="settings" className="gap-2">
						<Settings className="h-4 w-4" />
						Settings
					</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Total Points Issued
								</CardTitle>
								<StatIcon icon={Award} variant="success" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{stats?.totalPointsIssued?.toLocaleString() || 0}
								</div>
								<p className="text-muted-foreground text-xs">
									Lifetime points earned by users
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Points Redeemed
								</CardTitle>
								<StatIcon icon={Gift} variant="warning" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{stats?.totalPointsRedeemed?.toLocaleString() || 0}
								</div>
								<p className="text-muted-foreground text-xs">
									Total points used for rewards
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Active Users
								</CardTitle>
								<StatIcon icon={Users} variant="info" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{stats?.activeUsers?.toLocaleString() || 0}
								</div>
								<p className="text-muted-foreground text-xs">
									Users active in the last 30 days
								</p>
							</CardContent>
						</Card>

						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									Total Users
								</CardTitle>
								<StatIcon icon={Users} variant="default" />
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{stats?.totalUsers?.toLocaleString() || 0}
								</div>
								<p className="text-muted-foreground text-xs">
									Total enrolled users
								</p>
							</CardContent>
						</Card>
					</div>

					<div className="grid gap-4 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Award className="h-5 w-5 text-primary" />
									Program Configuration
								</CardTitle>
								<CardDescription>
									Core settings for your loyalty program
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<Award className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Points per Dollar</span>
									</div>
									<span className="font-semibold">
										{program.pointsPerDollar}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<ShoppingBag className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Min Order Amount</span>
									</div>
									<span className="font-semibold">
										${program.minOrderAmount}
									</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<DollarSign className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Signup Bonus</span>
									</div>
									<span className="font-semibold">
										{program.signupBonus} points
									</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<TrendingUp className="h-5 w-5 text-primary" />
									Quick Stats
								</CardTitle>
								<CardDescription>
									Program performance at a glance
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<Trophy className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Total Tiers</span>
									</div>
									<span className="font-semibold">--</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<Gift className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Total Rewards</span>
									</div>
									<span className="font-semibold">--</span>
								</div>
								<div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
									<div className="flex items-center gap-2">
										<Target className="h-4 w-4 text-muted-foreground" />
										<span className="text-sm">Total Milestones</span>
									</div>
									<span className="font-semibold">--</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</TabsContent>

				<TabsContent value="tiers">
					<TiersManager programId={program.id} />
				</TabsContent>

				<TabsContent value="rewards">
					<RewardsManager programId={program.id} />
				</TabsContent>

				<TabsContent value="milestones">
					<MilestonesManager programId={program.id} />
				</TabsContent>

				<TabsContent value="referrals">
					<ReferralsManager programId={program.id} />
				</TabsContent>

				<TabsContent value="settings">
					<div className="max-w-2xl">
						<ProgramForm initialData={program} isEditing />
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
};
