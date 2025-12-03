"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
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
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const payoutSchema = z
	.object({
		type: z.enum(["paypal", "bank_transfer"]),
		email: z.string().email().optional(),
		accountNumber: z.string().min(1).optional(),
		routingNumber: z.string().min(1).optional(),
	})
	.refine(
		(data) => {
			if (data.type === "paypal" && !data.email) return false;
			if (
				data.type === "bank_transfer" &&
				(!data.accountNumber || !data.routingNumber)
			)
				return false;
			return true;
		},
		{
			message: "Please fill in all required fields",
			path: ["type"], // Error will show on type field if generic, or we can make it specific
		},
	);

type PayoutFormValues = z.infer<typeof payoutSchema>;

interface PayoutModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: (data: {
		type: "paypal" | "bank_transfer";
		details: Record<string, string>;
	}) => void;
	isLoading: boolean;
	rewardName: string;
	cashAmount: string;
}

export function PayoutModal({
	isOpen,
	onClose,
	onConfirm,
	isLoading,
	rewardName,
	cashAmount,
}: PayoutModalProps) {
	const form = useForm<PayoutFormValues>({
		resolver: zodResolver(payoutSchema),
		defaultValues: {
			type: "paypal",
		},
	});

	const payoutType = form.watch("type");

	const onSubmit = (data: PayoutFormValues) => {
		const details: Record<string, string> = {};
		if (data.type === "paypal" && data.email) {
			details.email = data.email;
		} else if (
			data.type === "bank_transfer" &&
			data.accountNumber &&
			data.routingNumber
		) {
			details.accountNumber = data.accountNumber;
			details.routingNumber = data.routingNumber;
		}

		onConfirm({
			type: data.type,
			details,
		});
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Request Payout</DialogTitle>
					<DialogDescription>
						Redeem {rewardName} for ${cashAmount} cash back.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="type"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Payout Method</FormLabel>
									<Select
										onValueChange={field.onChange}
										defaultValue={field.value}
									>
										<FormControl>
											<SelectTrigger>
												<SelectValue placeholder="Select a payout method" />
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											<SelectItem value="paypal">PayPal</SelectItem>
											<SelectItem value="bank_transfer">
												Bank Transfer
											</SelectItem>
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{payoutType === "paypal" && (
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>PayPal Email</FormLabel>
										<FormControl>
											<Input placeholder="email@example.com" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						)}

						{payoutType === "bank_transfer" && (
							<>
								<FormField
									control={form.control}
									name="routingNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Routing Number</FormLabel>
											<FormControl>
												<Input placeholder="123456789" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="accountNumber"
									render={({ field }) => (
										<FormItem>
											<FormLabel>Account Number</FormLabel>
											<FormControl>
												<Input placeholder="987654321" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</>
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose}>
								Cancel
							</Button>
							<Button type="submit" disabled={isLoading}>
								{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
								Request Payout
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
