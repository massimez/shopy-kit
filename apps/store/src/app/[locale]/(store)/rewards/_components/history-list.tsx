"use client";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";

import { ArrowDownLeft, ArrowUpRight, History, Loader2 } from "lucide-react";
import { hc } from "@/lib/api-client";

export function HistoryList() {
	const { data, isLoading } = useQuery({
		queryKey: ["rewards", "history"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.history.$get({
				query: { limit: "20", offset: "0" },
			});
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

	if (!data?.success || !data.data.transactions.length) {
		return (
			<div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
				<History className="h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">No transaction history yet.</p>
			</div>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Transaction History</CardTitle>
				<CardDescription>Your recent points activity</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{data.data.transactions.map((transaction) => (
						<div
							key={transaction.id}
							className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
						>
							<div className="flex items-center gap-4">
								<div
									className={`flex h-10 w-10 items-center justify-center rounded-full ${
										transaction.points > 0
											? "bg-green-100 text-green-600"
											: "bg-red-100 text-red-600"
									}`}
								>
									{transaction.points > 0 ? (
										<ArrowDownLeft className="h-5 w-5" />
									) : (
										<ArrowUpRight className="h-5 w-5" />
									)}
								</div>
								<div className="flex-1">
									<div className="mb-1 flex items-center gap-2">
										<p className="font-medium">{transaction.description}</p>
										<Badge
											variant={
												transaction.status === "confirmed"
													? "secondary"
													: transaction.status === "pending"
														? "outline"
														: "destructive"
											}
											className="text-xs"
										>
											{transaction.status === "confirmed"
												? "Confirmed"
												: transaction.status === "pending"
													? "Pending"
													: "Canceled"}
										</Badge>
									</div>
									<p className="text-muted-foreground text-sm">
										{(() => {
											const date = new Date(transaction.createdAt);
											return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
										})()}
									</p>
								</div>
							</div>
							<div
								className={`text-right font-bold ${
									transaction.points > 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								{transaction.points > 0 ? "+" : ""}
								{transaction.points}
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
