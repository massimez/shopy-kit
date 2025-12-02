"use client";

import { useQuery } from "@tanstack/react-query";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Progress } from "@workspace/ui/components/progress";
import { CheckCircle2, Loader2, Trophy } from "lucide-react";
import { hc } from "@/lib/api-client";

export function MilestonesList() {
	const { data, isLoading } = useQuery({
		queryKey: ["rewards", "milestones"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.milestones.$get();
			return await res.json();
		},
	});

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!data?.success || !data.data.milestones.length) {
		return (
			<div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
				<Trophy className="h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">No milestones available yet.</p>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			{data.data.milestones.map((milestone) => {
				const progress = Math.min(
					100,
					(milestone.currentValue / milestone.targetValue) * 100,
				);
				const isCompleted = progress >= 100;

				return (
					<Card key={milestone.id}>
						<CardHeader className="pb-2">
							<div className="flex items-center justify-between">
								<CardTitle className="text-base">{milestone.name}</CardTitle>
								{isCompleted && (
									<CheckCircle2 className="h-5 w-5 text-green-500" />
								)}
							</div>
							<CardDescription>{milestone.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Progress</span>
									<span>
										{milestone.currentValue} / {milestone.targetValue}
									</span>
								</div>
								<Progress value={progress} className="h-2" />
								<div className="text-muted-foreground text-xs">
									Reward: {milestone.rewardPoints} points
								</div>
							</div>
						</CardContent>
					</Card>
				);
			})}
		</div>
	);
}
