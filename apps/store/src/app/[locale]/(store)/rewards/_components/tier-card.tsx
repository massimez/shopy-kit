"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

interface TierCardProps {
	currentTierName: string;
	nextTierName?: string;
	pointsToNextTier?: number;
}

export function TierCard({
	currentTierName,
	nextTierName,
	pointsToNextTier,
}: TierCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">Current Tier</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">{currentTierName}</div>
				{nextTierName && pointsToNextTier !== undefined && (
					<p className="text-muted-foreground text-xs">
						{pointsToNextTier} points to {nextTierName}
					</p>
				)}
			</CardContent>
		</Card>
	);
}
