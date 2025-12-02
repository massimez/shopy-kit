"use client";

import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

interface ProgramStatsCardProps {
	totalPointsIssued: number;
	activeUsers: number;
}

export function ProgramStatsCard({
	totalPointsIssued,
	activeUsers,
}: ProgramStatsCardProps) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="font-medium text-sm">
					Program Statistics
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="font-bold text-2xl">
					{totalPointsIssued.toLocaleString()} Points
				</div>
				<p className="text-muted-foreground text-xs">
					Issued to {activeUsers.toLocaleString()} active users
				</p>
			</CardContent>
		</Card>
	);
}
