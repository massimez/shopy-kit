"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Form,
	FormControl,
	FormDescription,
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
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@workspace/ui/components/sheet";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useCreateBankAccount } from "../../_hooks/use-financial";
import { useFinancialAccounting } from "../../_hooks/use-financial-accounting";

const formSchema = z.object({
	accountName: z.string().min(1, "Account name is required"),
	bankName: z.string().min(1, "Bank name is required"),
	accountNumber: z.string().min(1, "Account number is required"),
	currency: z.string().default("USD"),
	accountType: z.enum(["checking", "savings", "credit_card"]),
	glAccountId: z.string().min(1, "GL Account is required"),
	openingBalance: z.coerce.number().default(0),
});

interface CreateBankAccountSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function CreateBankAccountSheet({
	open,
	onOpenChange,
}: CreateBankAccountSheetProps) {
	const createBankAccount = useCreateBankAccount();
	const { useAccounts } = useFinancialAccounting();
	const { data: glAccountsData, isLoading: isLoadingGL } = useAccounts();
	const glAccounts = glAccountsData || [];

	const form = useForm<z.infer<typeof formSchema>>({
		// biome-ignore lint/suspicious/noExplicitAny: pragmatic fix for hookform resolver mismatch
		resolver: zodResolver(formSchema) as any,
		defaultValues: {
			accountName: "",
			bankName: "",
			accountNumber: "",
			currency: "USD",
			accountType: "checking",
			glAccountId: "",
			openingBalance: 0,
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		try {
			await createBankAccount.mutateAsync(values);
			toast.success("Bank account created successfully");
			onOpenChange(false);
			form.reset();
		} catch (error) {
			toast.error("Failed to create bank account");
			console.error(error);
		}
	}

	// Filter relevant GL accounts (Assets for checking/savings, Liabilities for credit cards)
	const filteredGLAccounts = glAccounts.filter((acc) =>
		["asset", "liability"].includes(acc.accountType),
	);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="sm:max-w-[500px]">
				<SheetHeader>
					<SheetTitle>Add Bank Account</SheetTitle>
					<SheetDescription>
						Connect a new bank account or credit card to track your financials.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="mt-6 space-y-6"
					>
						<FormField
							control={form.control}
							name="accountName"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Operating Checklist" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="bankName"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Bank Name</FormLabel>
										<FormControl>
											<Input placeholder="e.g. Chase" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name="accountType"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Type</FormLabel>
										<Select
											onValueChange={field.onChange}
											defaultValue={field.value}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Select type" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value="checking">Checking</SelectItem>
												<SelectItem value="savings">Savings</SelectItem>
												<SelectItem value="credit_card">Credit Card</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<FormField
							control={form.control}
							name="accountNumber"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Account Number (Last 4)</FormLabel>
									<FormControl>
										<Input placeholder="e.g. 1234" {...field} />
									</FormControl>
									<FormDescription>
										For internal identification only.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="glAccountId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Link to GL Account</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select GL Account" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{isLoadingGL ? (
												<div className="p-2 text-center text-muted-foreground text-sm">
													Loading accounts...
												</div>
											) : (
												filteredGLAccounts.map((account) => (
													<SelectItem key={account.id} value={account.id}>
														{account.code} - {account.name} (
														{account.accountType})
													</SelectItem>
												))
											)}
										</SelectContent>
									</Select>
									<FormDescription>
										Select the General Ledger account that represents this bank
										account.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="openingBalance"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Opening Balance</FormLabel>
									<FormControl>
										<Input type="number" placeholder="0.00" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button
							type="submit"
							className="w-full"
							disabled={createBankAccount.isPending}
						>
							{createBankAccount.isPending ? "Creating..." : "Create Account"}
						</Button>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
