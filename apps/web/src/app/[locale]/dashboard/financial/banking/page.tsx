"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { CreditCard, Landmark, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBankAccounts } from "../_hooks/use-financial";
import { CreateBankAccountSheet } from "./_components/create-bank-account-sheet";

export default function FinancialBankingPage() {
	const router = useRouter();
	const [isCreateOpen, setIsCreateOpen] = useState(false);
	const { data: bankAccountsData, isLoading } = useBankAccounts();
	const bankAccounts = bankAccountsData?.data || [];

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h3 className="font-medium text-lg">Banking</h3>
					<p className="text-muted-foreground text-sm">
						Manage bank accounts and reconciliation.
					</p>
				</div>
				<Button onClick={() => setIsCreateOpen(true)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Bank Account
				</Button>
			</div>
			<Separator />

			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
				{isLoading ? (
					// Loading skeletons
					Array.from({ length: 3 }).map((_, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: <>
						<Card key={i} className="animate-pulse">
							<CardHeader className="h-24 bg-muted/50" />
							<CardContent className="h-12 bg-muted/20" />
						</Card>
					))
				) : bankAccounts.length === 0 ? (
					<div className="col-span-full rounded-lg border border-dashed py-12 text-center text-muted-foreground">
						No bank accounts connected yet.
					</div>
				) : (
					bankAccounts.map((account) => (
						<Card key={account.id} className="relative overflow-hidden">
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<CardTitle className="font-medium text-sm">
									{account.accountName}
								</CardTitle>
								{["credit", "credit_card"].includes(
									account.accountType as string,
								) ? (
									<CreditCard className="h-4 w-4 text-muted-foreground" />
								) : (
									<Landmark className="h-4 w-4 text-muted-foreground" />
								)}
							</CardHeader>
							<CardContent>
								<div className="font-bold text-2xl">
									{new Intl.NumberFormat("en-US", {
										style: "currency",
										currency: account.currency || "USD",
									}).format(Number(account.currentBalance) || 0)}
								</div>
								<p className="mb-4 text-muted-foreground text-xs">
									{account.bankName} •••• {account.accountNumber.slice(-4)}
								</p>
								<Button
									variant="outline"
									size="sm"
									className="w-full"
									onClick={() => {
										// Navigate to transactions filtered by this account
										router.push(
											`/dashboard/financial/transactions?bankAccountId=${account.id}`,
										);
									}}
								>
									View Transactions
								</Button>
							</CardContent>
						</Card>
					))
				)}
			</div>

			<CreateBankAccountSheet
				open={isCreateOpen}
				onOpenChange={setIsCreateOpen}
			/>
		</div>
	);
}
