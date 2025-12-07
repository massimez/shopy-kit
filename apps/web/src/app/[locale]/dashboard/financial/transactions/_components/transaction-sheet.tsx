"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { Separator } from "@workspace/ui/components/separator";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@workspace/ui/components/sheet";
import { ArrowDownCircle, ArrowUpCircle, Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
	useBankAccounts,
	useCreateBankTransaction,
	useEnsureCashAccount,
} from "@/app/[locale]/dashboard/financial/_hooks/use-financial";
import { useFinancialAccounting } from "@/app/[locale]/dashboard/financial/_hooks/use-financial-accounting";

const formSchema = z.object({
	bankAccountId: z.string().optional(),
	amount: z.string().min(1, "Amount is required"),
	type: z.enum(["deposit", "withdrawal"]),
	description: z.string().min(1, "Description is required"),
	date: z.string().min(1, "Date is required"),
	payeePayer: z.string().optional(),
	referenceNumber: z.string().optional(),
	offsetAccountId: z.string().uuid().optional(),
});

export function TransactionSheet() {
	const [open, setOpen] = useState(false);
	const { data: bankAccountsData, isLoading: isLoadingAccounts } =
		useBankAccounts();
	const { useAccounts } = useFinancialAccounting();
	const { data: glAccountsData, isLoading: isLoadingGL } = useAccounts();
	const createTransaction = useCreateBankTransaction();
	const ensureCashAccount = useEnsureCashAccount();

	// Track if we've already attempted to create cash account
	const cashAccountAttempted = useRef(false);

	const bankAccounts = bankAccountsData?.data || [];
	const glAccounts = glAccountsData || [];

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			bankAccountId: "",
			amount: "",
			type: "withdrawal",
			description: "",
			date: new Date().toISOString().split("T")[0],
			payeePayer: "",
			referenceNumber: "",
			offsetAccountId: undefined,
		},
	});

	const transactionType = form.watch("type");

	// Auto-select first account when accounts are loaded
	useEffect(() => {
		if (bankAccounts.length > 0 && !form.getValues("bankAccountId")) {
			form.setValue("bankAccountId", bankAccounts[0]?.id || "");
		}
	}, [bankAccounts, form]);

	// Auto-create cash account if no accounts exist when sheet opens
	// biome-ignore lint/correctness/useExhaustiveDependencies: ensureCashAccount.mutate intentionally omitted to prevent infinite loop
	useEffect(() => {
		if (
			open &&
			!isLoadingAccounts &&
			bankAccounts.length === 0 &&
			!cashAccountAttempted.current
		) {
			// Automatically try to create a cash account
			cashAccountAttempted.current = true;
			ensureCashAccount.mutate();
		}

		// Reset the flag when sheet closes
		if (!open) {
			cashAccountAttempted.current = false;
		}
	}, [open, isLoadingAccounts, bankAccounts.length]);

	async function onSubmit(values: z.infer<typeof formSchema>) {
		// Use selected account or first available account
		const accountId = values.bankAccountId || bankAccounts[0]?.id;

		if (!accountId) {
			toast.error("Please create a bank account first");
			return;
		}

		try {
			await createTransaction.mutateAsync({
				bankAccountId: accountId,
				transactionDate: new Date(values.date),
				transactionType: values.type,
				amount: Number.parseFloat(values.amount),
				description: values.description,
				payeePayer: values.payeePayer || undefined,
				referenceNumber: values.referenceNumber || undefined,
				offsetAccountId: values.offsetAccountId,
			});

			toast.success("Transaction created successfully");
			form.reset();
			setOpen(false);
		} catch (error) {
			toast.error("Failed to create transaction");
			console.error("Transaction creation error:", error);
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>
				<Button>
					<Plus className="mr-2 h-4 w-4" />
					New Transaction
				</Button>
			</SheetTrigger>
			<SheetContent className="overflow-y-auto sm:max-w-xl">
				<SheetHeader>
					<SheetTitle>Record Manual Transaction</SheetTitle>
					<SheetDescription>
						Record a bank or cash transaction that occurred outside the system
					</SheetDescription>
				</SheetHeader>
				<div className="mt-6">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{/* Transaction Type - Compact Segmented Control */}
							<FormField
								control={form.control}
								name="type"
								render={({ field }) => (
									<FormItem>
										<div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
											<button
												type="button"
												onClick={() => field.onChange("deposit")}
												className={`flex items-center justify-center gap-2 rounded-md py-2 font-medium text-sm transition-all ${
													field.value === "deposit"
														? "bg-background text-green-600 shadow-sm dark:text-green-400"
														: "text-muted-foreground hover:bg-background/50 hover:text-foreground"
												}`}
											>
												<ArrowDownCircle className="h-4 w-4" />
												Deposit
											</button>
											<button
												type="button"
												onClick={() => field.onChange("withdrawal")}
												className={`flex items-center justify-center gap-2 rounded-md py-2 font-medium text-sm transition-all ${
													field.value === "withdrawal"
														? "bg-background text-red-600 shadow-sm dark:text-red-400"
														: "text-muted-foreground hover:bg-background/50 hover:text-foreground"
												}`}
											>
												<ArrowUpCircle className="h-4 w-4" />
												Withdrawal
											</button>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							{/* Main Form Fields */}
							<div className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="amount"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													Amount*{" "}
													{transactionType === "deposit" ? (
														<span className="text-green-600 dark:text-green-400">
															(+)
														</span>
													) : (
														<span className="text-red-600 dark:text-red-400">
															(-)
														</span>
													)}
												</FormLabel>
												<FormControl>
													<div className="relative">
														<span className="absolute inset-y-0 left-3 flex items-center text-muted-foreground">
															$
														</span>
														<Input
															placeholder="0.00"
															{...field}
															type="number"
															step="0.01"
															className="pl-7 font-bold"
														/>
													</div>
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="date"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Date*</FormLabel>
												<FormControl>
													<Input type="date" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>

								<FormField
									control={form.control}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description*</FormLabel>
											<FormControl>
												<Input
													placeholder={
														transactionType === "deposit"
															? "e.g., Cash sale, Service income"
															: "e.g., Office supplies, Utilities"
													}
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<Separator />

							{/* Account Details */}
							<div className="space-y-4">
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="bankAccountId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{transactionType === "deposit" ? "To" : "From"} Bank
													Account*
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select bank account" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{isLoadingAccounts ? (
															<div className="flex items-center justify-center p-2 text-muted-foreground text-sm">
																Loading accounts...
															</div>
														) : bankAccounts.length === 0 ? (
															<div className="p-2 text-center text-muted-foreground text-sm">
																No accounts found
															</div>
														) : (
															bankAccounts.map((account) => (
																<SelectItem key={account.id} value={account.id}>
																	<span className="font-medium">
																		{account.bankName}
																	</span>{" "}
																	<span className="text-muted-foreground">
																		- {account.accountName}
																	</span>
																</SelectItem>
															))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="offsetAccountId"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{transactionType === "deposit" ? "From" : "To"}{" "}
													Category (Optional)
												</FormLabel>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<FormControl>
														<SelectTrigger>
															<SelectValue placeholder="Select category" />
														</SelectTrigger>
													</FormControl>
													<SelectContent>
														{isLoadingGL ? (
															<div className="flex items-center justify-center p-2 text-muted-foreground text-sm">
																Loading categories...
															</div>
														) : (
															glAccounts
																.filter((_) => true) // Show all accounts for flexibility
																.sort((a, b) => a.code.localeCompare(b.code))
																.map((account) => (
																	<SelectItem
																		key={account.id}
																		value={account.id}
																	>
																		<span className="font-mono text-muted-foreground text-xs">
																			{account.code}
																		</span>{" "}
																		{account.name}
																	</SelectItem>
																))
														)}
													</SelectContent>
												</Select>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<Separator />

							{/* Additional Info (Collapsible-like feel less prominent) */}
							<div>
								<h4 className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wider">
									Additional Details
								</h4>
								<div className="grid gap-4 sm:grid-cols-2">
									<FormField
										control={form.control}
										name="payeePayer"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{transactionType === "deposit"
														? "Received From"
														: "Paid To"}
												</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>

									<FormField
										control={form.control}
										name="referenceNumber"
										render={({ field }) => (
											<FormItem>
												<FormLabel>Ref Number</FormLabel>
												<FormControl>
													<Input placeholder="Optional" {...field} />
												</FormControl>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
							</div>

							<Button
								type="submit"
								className="w-full"
								disabled={createTransaction.isPending}
							>
								{createTransaction.isPending
									? "Processing..."
									: `Record ${transactionType === "deposit" ? "Deposit" : "Withdrawal"}`}
							</Button>
						</form>
					</Form>
				</div>
			</SheetContent>
		</Sheet>
	);
}
