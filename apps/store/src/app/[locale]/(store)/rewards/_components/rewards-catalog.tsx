"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Gift, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";
import { PayoutModal } from "./payout-modal";

export function RewardsCatalog() {
	const queryClient = useQueryClient();
	const [selectedReward, setSelectedReward] = useState<any>(null);
	const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

	const { data, isLoading } = useQuery({
		queryKey: ["rewards", "available"],
		queryFn: async () => {
			const res = await hc.api.storefront.rewards.available.$get();
			return await res.json();
		},
	});

	const redeemMutation = useMutation({
		mutationFn: async (variables: {
			rewardId: string;
			payoutDetails?: {
				type: "paypal" | "bank_transfer";
				details: Record<string, string>;
			};
		}) => {
			const res = await hc.api.storefront.rewards.redeem.$post({
				json: variables,
			});
			const data = await res.json();
			if (!res.ok) {
				throw new Error(data?.error?.message || "Failed to redeem reward");
			}
			return data;
		},
		onSuccess: () => {
			toast.success("Reward redeemed successfully!");
			queryClient.invalidateQueries({ queryKey: ["rewards"] });
			setIsPayoutModalOpen(false);
			setSelectedReward(null);
		},
		onError: (error: Error) => {
			toast.error(error.message);
		},
	});

	const handleRedeemClick = (reward: any) => {
		if (reward.type === "cash_back") {
			setSelectedReward(reward);
			setIsPayoutModalOpen(true);
		} else {
			redeemMutation.mutate({ rewardId: reward.id });
		}
	};

	const handlePayoutConfirm = (payoutDetails: {
		type: "paypal" | "bank_transfer";
		details: Record<string, string>;
	}) => {
		if (selectedReward) {
			redeemMutation.mutate({
				rewardId: selectedReward.id,
				payoutDetails,
			});
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-40 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!data?.success || !data.data.rewards.length) {
		return (
			<div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
				<Gift className="h-8 w-8 text-muted-foreground" />
				<p className="text-muted-foreground">
					No rewards available at the moment.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{data.data.rewards.map((reward) => (
					<Card key={reward.id}>
						<CardHeader>
							<CardTitle>{reward.name}</CardTitle>
							<CardDescription>{reward.description}</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="font-bold text-2xl">
								{reward.pointsCost} Points
							</div>
							{reward.type === "cash_back" && reward.cashAmount && (
								<div className="mt-1 text-muted-foreground text-sm">
									Value: ${reward.cashAmount}
								</div>
							)}
						</CardContent>
						<CardFooter>
							<Button
								className="w-full"
								onClick={() => handleRedeemClick(reward)}
								disabled={redeemMutation.isPending}
							>
								{redeemMutation.isPending &&
								redeemMutation.variables?.rewardId === reward.id ? (
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								) : reward.type === "cash_back" ? (
									"Request Payout"
								) : (
									"Redeem"
								)}
							</Button>
						</CardFooter>
					</Card>
				))}
			</div>

			{selectedReward && (
				<PayoutModal
					isOpen={isPayoutModalOpen}
					onClose={() => setIsPayoutModalOpen(false)}
					onConfirm={handlePayoutConfirm}
					isLoading={redeemMutation.isPending}
					rewardName={selectedReward.name}
					cashAmount={selectedReward.cashAmount || "0.00"}
				/>
			)}
		</>
	);
}
