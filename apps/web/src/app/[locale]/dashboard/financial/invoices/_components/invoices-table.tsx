"use client";

import { Badge } from "@workspace/ui/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@workspace/ui/components/table";
import { format } from "date-fns";
import { useInvoices } from "@/app/[locale]/dashboard/financial/_hooks/use-invoices";

export function InvoicesTable() {
	const { data: invoices, isLoading } = useInvoices("receivable", 50);

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Invoices</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Invoices</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Invoice #</TableHead>
							<TableHead>Date</TableHead>
							<TableHead>Customer</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Payment</TableHead>
							<TableHead className="text-right">Amount</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{invoices?.map((invoice) => (
							<TableRow key={invoice.id}>
								<TableCell className="font-medium">
									{invoice.invoiceNumber}
								</TableCell>
								<TableCell>
									{format(new Date(invoice.invoiceDate), "MMM dd, yyyy")}
								</TableCell>
								<TableCell>
									{/* Customer name would need to be joined or fetched */}
									Customer Name
								</TableCell>
								<TableCell>
									<Badge variant="outline" className="capitalize">
										{invoice.status}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge
										variant={
											invoice.status === "paid"
												? "success"
												: invoice.status === "partial"
													? "warning"
													: "secondary"
										}
										className="capitalize"
									>
										{invoice.status}
									</Badge>
								</TableCell>
								<TableCell className="text-right font-medium">
									${Number(invoice.totalAmount).toFixed(2)}
								</TableCell>
							</TableRow>
						))}
						{invoices?.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={6}
									className="h-24 text-center text-muted-foreground"
								>
									No invoices found.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
