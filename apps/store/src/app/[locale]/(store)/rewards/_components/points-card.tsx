"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

interface PointsCardProps {
	balance: number;
	lifetimePoints: number;
}

export function PointsCard({ balance, lifetimePoints }: PointsCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">Current Balance</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{balance} Points</div>
				<p className="text-muted-foreground text-xs">
					Lifetime earned: {lifetimePoints}
				</p>
			</CardContent>
		</Card>
	);
}
