import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { ChevronDown, ChevronRight, Package, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useOrder, useOrganization } from "@/lib/hooks/use-storefront";

interface Order {
	id: string;
	orderNumber: string;
	status: string;
	createdAt: string;
	totalAmount: string;
	currency: string;
}

interface OrderHistoryProps {
	orders?: Order[];
	isLoadingOrders: boolean;
}

export function OrderHistory({ orders, isLoadingOrders }: OrderHistoryProps) {
	const router = useRouter();
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const { data: session } = useSession();

	const { data: org } = useOrganization("yam");
	const organizationId = org?.id;
	const userId = session?.user?.id;

	const { data: orderDetails, isLoading: isLoadingOrderDetails } = useOrder(
		{
			organizationId: organizationId || "",
			orderId: expandedOrderId || "",
			userId: userId,
		},
		!!organizationId && !!expandedOrderId && !!userId,
	);

	const toggleOrderDetails = (orderId: string) => {
		setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
	};

	return (
		<div className="space-y-6">
			<Card className="border-none shadow-none">
				<CardHeader>
					<CardTitle>Order History</CardTitle>
					<CardDescription>View and track your past orders.</CardDescription>
				</CardHeader>
				<CardContent className="px-0">
					{isLoadingOrders ? (
						<div className="flex justify-center py-12">
							<div className="h-8 w-8 animate-spin rounded-full border-primary border-t-2" />
						</div>
					) : orders && orders.length > 0 ? (
						<div className="space-y-4">
							{orders.map((order: Order) => (
								<div key={order.id} className="space-y-4">
									<div className="group relative flex flex-col gap-4 rounded-lg border bg-card p-6 transition-all hover:shadow-md sm:flex-row sm:items-center sm:justify-between">
										<div className="flex items-start gap-4">
											<div className="rounded-full bg-primary/10 p-2.5 text-primary">
												<Package className="h-5 w-5" />
											</div>
											<div className="space-y-1">
												<div className="flex items-center gap-2">
													<h3 className="font-semibold text-base">
														{order.orderNumber}
													</h3>
													<Badge
														variant={
															order.status === "completed"
																? "success"
																: order.status === "pending"
																	? "warning"
																	: "outline"
														}
														className="capitalize"
													>
														{order.status}
													</Badge>
												</div>
												<p className="text-muted-foreground text-sm">
													Placed on{" "}
													{new Intl.DateTimeFormat("en-US", {
														dateStyle: "medium",
													}).format(new Date(order.createdAt))}
												</p>
											</div>
										</div>
										<div className="flex items-center justify-between gap-6 sm:justify-end">
											<div className="text-right">
												<p className="font-medium text-sm">Total Amount</p>
												<p className="font-bold text-lg">
													{new Intl.NumberFormat("en-US", {
														style: "currency",
														currency: order.currency || "USD",
													}).format(Number(order.totalAmount))}
												</p>
											</div>
											<Button
												variant="ghost"
												size="icon"
												className="opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
												onClick={() => toggleOrderDetails(order.id)}
											>
												{expandedOrderId === order.id ? (
													<ChevronDown className="h-5 w-5" />
												) : (
													<ChevronRight className="h-5 w-5" />
												)}
											</Button>
										</div>
										{/* Expanded Order Details - Below the card */}
										{expandedOrderId === order.id && (
											<div className="">
												{/* Ordered Items */}
												<div className="mb-6">
													<h4 className="mb-4 font-semibold text-foreground text-lg">
														Ordered Items
													</h4>
													{isLoadingOrderDetails ? (
														<div className="flex justify-center py-8">
															<div className="h-6 w-6 animate-spin rounded-full border-primary border-t-2" />
														</div>
													) : (
														<div className="space-y-4">
															{/* Order Items */}
															{orderDetails?.items &&
															orderDetails.items.length > 0 ? (
																orderDetails.items.map((item) => (
																	<div
																		key={item.id}
																		className="flex items-center justify-between rounded-lg border bg-background p-4"
																	>
																		<div className="flex items-center gap-3">
																			<div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted/50">
																				<Package className="h-6 w-6 text-muted-foreground" />
																			</div>
																			<div>
																				<p className="font-medium text-sm">
																					{item.productName}
																				</p>
																				<p className="text-muted-foreground text-xs">
																					SKU: {item.sku} • Qty: {item.quantity}
																				</p>
																			</div>
																		</div>
																		<div className="text-right">
																			<p className="font-medium text-sm">
																				{new Intl.NumberFormat("en-US", {
																					style: "currency",
																					currency: order.currency || "USD",
																				}).format(Number(item.unitPrice))}
																			</p>
																			<p className="text-muted-foreground text-xs">
																				each
																			</p>
																		</div>
																	</div>
																))
															) : (
																<div className="flex items-center justify-between rounded-lg border bg-background p-4">
																	<div className="flex items-center gap-3">
																		<div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted/50">
																			<ShoppingBag className="h-5 w-5 text-muted-foreground" />
																		</div>
																		<div>
																			<p className="font-medium text-sm">
																				No items found
																			</p>
																			<p className="text-muted-foreground text-xs">
																				Order items could not be loaded
																			</p>
																		</div>
																	</div>
																</div>
															)}

															{/* Shipping Address */}
															{orderDetails?.shippingAddress && (
																<div className="rounded-lg border bg-background p-4">
																	<h5 className="mb-2 font-medium text-sm">
																		Shipping Address
																	</h5>
																	<div className="text-muted-foreground text-sm">
																		<p>
																			{orderDetails.shippingAddress?.street}
																		</p>
																		<p>
																			{orderDetails.shippingAddress?.city},{" "}
																			{orderDetails.shippingAddress?.state}{" "}
																			{orderDetails.shippingAddress?.zipCode}
																		</p>
																		<p>
																			{orderDetails.shippingAddress?.country}
																		</p>
																	</div>
																</div>
															)}
														</div>
													)}
												</div>

												<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
													{/* Order Information */}
													<div>
														<h4 className="mb-4 font-semibold text-foreground text-lg">
															Order Details
														</h4>
														<div className="space-y-4">
															<div className="flex items-start justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Order Number
																</span>
																<span className="text-right font-mono text-sm">
																	{order.orderNumber}
																</span>
															</div>
															<div className="flex items-start justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Order Date
																</span>
																<span className="text-right text-sm">
																	{new Intl.DateTimeFormat("en-US", {
																		dateStyle: "full",
																		timeStyle: "short",
																	}).format(new Date(order.createdAt))}
																</span>
															</div>
															<div className="flex items-start justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Status
																</span>
																<Badge
																	variant={
																		order.status === "completed"
																			? "success"
																			: order.status === "pending"
																				? "warning"
																				: "outline"
																	}
																	className="ml-2 text-xs capitalize"
																>
																	{order.status === "completed"
																		? "Delivered"
																		: order.status === "pending"
																			? "Processing"
																			: "In Transit"}
																</Badge>
															</div>
															<div className="flex items-start justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Order ID
																</span>
																<span className="text-right font-mono text-muted-foreground text-xs">
																	{order.id}
																</span>
															</div>
														</div>
													</div>

													{/* Payment & Shipping */}
													<div>
														<h4 className="mb-4 font-semibold text-foreground text-lg">
															Payment & Shipping
														</h4>
														<div className="space-y-4">
															<div className="flex items-center justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Subtotal
																</span>
																<span className="font-medium text-sm">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: order.currency || "USD",
																	}).format(
																		Number(orderDetails?.subtotal || 0),
																	)}
																</span>
															</div>
															{Number(orderDetails?.discountAmount || 0) >
																0 && (
																<div className="flex items-center justify-between">
																	<span className="font-medium text-muted-foreground text-sm">
																		Discount
																	</span>
																	<span className="font-medium text-green-600 text-sm">
																		-
																		{new Intl.NumberFormat("en-US", {
																			style: "currency",
																			currency: order.currency || "USD",
																		}).format(
																			Number(orderDetails?.discountAmount || 0),
																		)}
																	</span>
																</div>
															)}
															<div className="flex items-center justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Shipping
																</span>
																<span className="font-medium text-sm">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: order.currency || "USD",
																	}).format(
																		Number(orderDetails?.shippingAmount || 0),
																	)}
																</span>
															</div>
															<div className="flex items-center justify-between">
																<span className="font-medium text-muted-foreground text-sm">
																	Tax
																</span>
																<span className="font-medium text-sm">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: order.currency || "USD",
																	}).format(
																		Number(orderDetails?.taxAmount || 0),
																	)}
																</span>
															</div>
															<hr className="my-2" />
															<div className="flex items-center justify-between">
																<span className="font-semibold text-sm">
																	Total
																</span>
																<span className="font-bold text-lg">
																	{new Intl.NumberFormat("en-US", {
																		style: "currency",
																		currency: order.currency || "USD",
																	}).format(
																		Number(
																			orderDetails?.totalAmount ||
																				order.totalAmount,
																		),
																	)}
																</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										)}
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<ShoppingBag className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="mb-1 font-semibold text-lg">No orders yet</h3>
							<p className="mb-4 text-muted-foreground text-sm">
								You haven't placed any orders yet.
							</p>
							<Button onClick={() => router.push("/products")}>
								Start Shopping
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
