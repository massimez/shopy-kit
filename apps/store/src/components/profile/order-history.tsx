"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	CheckCircle2,
	ChevronDown,
	Clock,
	Download,
	Package,
	RefreshCw,
	Search,
	ShoppingBag,
	Truck,
	XCircle,
} from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { useOrder, useOrganization } from "@/lib/hooks/use-storefront";
import { useCartStore } from "@/store/use-cart-store";

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

interface OrderItem {
	id: string;
	productName: string;
	sku: string;
	quantity: number;
	unitPrice: string;
	imageUrl?: string;
	productVariantId: string;
	locationId?: string;
}

const statusConfig = {
	pending: {
		label: "Processing",
		variant: "warning" as const,
		icon: Clock,
		color: "text-yellow-600",
		bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
	},
	completed: {
		label: "Delivered",
		variant: "success" as const,
		icon: CheckCircle2,
		color: "text-green-600",
		bgColor: "bg-green-50 dark:bg-green-950/20",
	},
	shipped: {
		label: "In Transit",
		variant: "outline" as const,
		icon: Truck,
		color: "text-blue-600",
		bgColor: "bg-blue-50 dark:bg-blue-950/20",
	},
	cancelled: {
		label: "Cancelled",
		variant: "destructive" as const,
		icon: XCircle,
		color: "text-red-600",
		bgColor: "bg-red-50 dark:bg-red-950/20",
	},
};

export function OrderHistory({ orders, isLoadingOrders }: OrderHistoryProps) {
	const router = useRouter();
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState<string>("all");
	const [sortBy, setSortBy] = useState<string>("newest");
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

	const { addItem } = useCartStore();

	const handleReorder = (order: Order) => {
		if (!orderDetails?.items || orderDetails.items.length === 0) {
			toast.error("Unable to reorder", {
				description: "No items found in this order",
			});
			return;
		}

		try {
			let addedCount = 0;

			orderDetails.items.forEach((item: OrderItem) => {
				// Add each item to the cart
				addItem({
					id: item.id,
					name: item.productName,
					price: Number(item.unitPrice),
					quantity: item.quantity,
					image: item.imageUrl,
					productVariantId: item.productVariantId,
					locationId: item.locationId || organizationId || "",
					variantName: undefined,
					variantSku: item.sku,
				});
				addedCount++;
			});

			toast.success("Items added to cart", {
				description: `${addedCount} item${addedCount > 1 ? "s" : ""} from order ${order.orderNumber} added to your cart`,
			});
		} catch {
			toast.error("Failed to reorder", {
				description: "Something went wrong. Please try again.",
			});
		}
	};

	const toggleOrderDetails = (orderId: string) => {
		setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
	};

	// Filter and sort orders
	const filteredOrders = useMemo(() => {
		if (!orders) return [];

		const filtered = orders.filter((order) => {
			const matchesSearch =
				order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
				order.id.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || order.status === statusFilter;
			return matchesSearch && matchesStatus;
		});

		// Sort orders
		filtered.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return (
						new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
					);
				case "oldest":
					return (
						new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
					);
				case "amount-high":
					return Number(b.totalAmount) - Number(a.totalAmount);
				case "amount-low":
					return Number(a.totalAmount) - Number(b.totalAmount);
				default:
					return 0;
			}
		});

		return filtered;
	}, [orders, searchQuery, statusFilter, sortBy]);

	const getStatusConfig = (status: string) => {
		return (
			statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
		);
	};

	return (
		<div className="space-y-6">
			<Card className="border-none shadow-none">
				<CardHeader className="space-y-4">
					<div>
						<CardTitle className="text-2xl">Order History</CardTitle>
						<CardDescription className="mt-1.5">
							View and track your past orders
						</CardDescription>
					</div>

					{/* Filters and Search */}
					{orders && orders.length > 0 && (
						<div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
							<div className="relative flex-1">
								<Search className="-translate-y-1/2 absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									placeholder="Search by order number or ID..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-9"
								/>
							</div>
							<div className="flex gap-2">
								<Select value={statusFilter} onValueChange={setStatusFilter}>
									<SelectTrigger className="w-[140px]">
										<SelectValue placeholder="Status" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All Status</SelectItem>
										<SelectItem value="pending">Processing</SelectItem>
										<SelectItem value="shipped">In Transit</SelectItem>
										<SelectItem value="completed">Delivered</SelectItem>
										<SelectItem value="cancelled">Cancelled</SelectItem>
									</SelectContent>
								</Select>
								<Select value={sortBy} onValueChange={setSortBy}>
									<SelectTrigger className="w-[140px]">
										<SelectValue placeholder="Sort by" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="newest">Newest First</SelectItem>
										<SelectItem value="oldest">Oldest First</SelectItem>
										<SelectItem value="amount-high">
											Amount: High to Low
										</SelectItem>
										<SelectItem value="amount-low">
											Amount: Low to High
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
					)}
				</CardHeader>

				<CardContent className="px-0 sm:px-6">
					{isLoadingOrders ? (
						<div className="flex flex-col items-center justify-center py-16">
							<div className="relative h-12 w-12">
								<div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
							</div>
							<p className="mt-4 text-muted-foreground text-sm">
								Loading your orders...
							</p>
						</div>
					) : filteredOrders.length > 0 ? (
						<div className="space-y-4">
							{filteredOrders.map((order: Order) => {
								const config = getStatusConfig(order.status);
								const StatusIcon = config.icon;
								const isExpanded = expandedOrderId === order.id;

								return (
									<Card
										key={order.id}
										className="group overflow-hidden transition-all duration-300 hover:shadow-lg"
									>
										<div className="p-6">
											<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
												{/* Left Section - Clickable */}
												<button
													type="button"
													className="flex flex-1 cursor-pointer items-start gap-4 text-left"
													onClick={() => toggleOrderDetails(order.id)}
													aria-expanded={isExpanded}
													aria-label={`Toggle order ${order.orderNumber} details`}
												>
													<div
														className={`rounded-xl p-3 transition-transform group-hover:scale-110 ${config.bgColor}`}
													>
														<StatusIcon className={`h-6 w-6 ${config.color}`} />
													</div>
													<div className="space-y-2">
														<div className="flex flex-wrap items-center gap-2">
															<h3 className="font-semibold text-base">
																{order.orderNumber}
															</h3>
															<Badge
																variant={config.variant}
																className="capitalize"
															>
																{config.label}
															</Badge>
														</div>
														<div className="flex flex-col gap-1 text-muted-foreground text-sm">
															<p>
																{new Intl.DateTimeFormat("en-US", {
																	dateStyle: "medium",
																	timeStyle: "short",
																}).format(new Date(order.createdAt))}
															</p>
														</div>
													</div>
												</button>

												{/* Right Section */}
												<div className="flex items-center gap-4 sm:flex-row-reverse">
													<Button
														variant="ghost"
														size="icon"
														className="shrink-0 transition-transform"
														onClick={() => toggleOrderDetails(order.id)}
														aria-label={
															isExpanded ? "Collapse order" : "Expand order"
														}
													>
														<ChevronDown
															className={`h-5 w-5 transition-transform duration-300 ${
																isExpanded ? "rotate-180" : ""
															}`}
														/>
													</Button>
													<div className="text-right">
														<p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
															Total
														</p>
														<p className="font-bold text-xl">
															{new Intl.NumberFormat("en-US", {
																style: "currency",
																currency: order.currency || "USD",
															}).format(Number(order.totalAmount))}
														</p>
													</div>
												</div>
											</div>
										</div>

										{/* Expanded Order Details */}
										{isExpanded && (
											<div className="slide-in-from-top-2 animate-in border-t bg-muted/30 p-6 duration-300">
												{isLoadingOrderDetails ? (
													<div className="flex justify-center py-12">
														<div className="relative h-10 w-10">
															<div className="absolute inset-0 animate-spin rounded-full border-[3px] border-primary/20 border-t-primary" />
														</div>
													</div>
												) : (
													<div className="space-y-6">
														{/* Quick Actions */}
														<div className="flex flex-wrap gap-2">
															<Button
																variant="outline"
																size="sm"
																className="gap-2"
																onClick={(e) => {
																	e.stopPropagation();
																	handleReorder(order);
																}}
															>
																<RefreshCw className="h-4 w-4" />
																Reorder
															</Button>
															<Button
																variant="outline"
																size="sm"
																className="gap-2"
																onClick={(e) => {
																	e.stopPropagation();
																	// TODO: Implement download invoice
																}}
															>
																<Download className="h-4 w-4" />
																Invoice
															</Button>
															{/* <Button
																variant="outline"
																size="sm"
																className="gap-2"
																onClick={(e) => {
																	e.stopPropagation();
																	// TODO: Implement tracking
																}}
															>
																<Truck className="h-4 w-4" />
																Track Order
															</Button> */}
														</div>

														{/* Order Items */}
														<div>
															<h4 className="mb-4 font-semibold text-base">
																Order Items
															</h4>
															<div className="space-y-3">
																{orderDetails?.items &&
																orderDetails.items.length > 0 ? (
																	orderDetails.items.map((item: OrderItem) => (
																		<div
																			key={item.id}
																			className="group/item flex items-center gap-4 rounded-lg border bg-background p-4 transition-all hover:shadow-md"
																		>
																			<div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted">
																				{item.imageUrl ? (
																					<Image
																						src={item.imageUrl}
																						alt={item.productName}
																						fill
																						className="object-cover transition-transform group-hover/item:scale-110"
																					/>
																				) : (
																					<div className="flex h-full w-full items-center justify-center">
																						<Package className="h-8 w-8 text-muted-foreground" />
																					</div>
																				)}
																			</div>
																			<div className="flex-1 space-y-1">
																				<p className="font-medium text-sm leading-tight">
																					{item.productName}
																				</p>
																				<div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
																					<span>SKU: {item.sku}</span>
																					<span>•</span>
																					<span>Qty: {item.quantity}</span>
																				</div>
																			</div>
																			<div className="text-right">
																				<p className="font-semibold text-sm">
																					{new Intl.NumberFormat("en-US", {
																						style: "currency",
																						currency: order.currency || "USD",
																					}).format(Number(item.unitPrice))}
																				</p>
																				<p className="text-muted-foreground text-xs">
																					per item
																				</p>
																			</div>
																		</div>
																	))
																) : (
																	<div className="flex items-center gap-3 rounded-lg border bg-background p-4">
																		<div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted">
																			<ShoppingBag className="h-6 w-6 text-muted-foreground" />
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
																)}
															</div>
														</div>

														{/* Order Summary Grid */}
														<div className="grid gap-6 lg:grid-cols-2">
															{/* Order Details */}
															<Card>
																<CardHeader>
																	<CardTitle className="text-base">
																		Order Details
																	</CardTitle>
																</CardHeader>
																<CardContent className="space-y-3">
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Order Number
																		</span>
																		<span className="font-medium font-mono">
																			{order.orderNumber}
																		</span>
																	</div>
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Order Date
																		</span>
																		<span className="font-medium">
																			{new Intl.DateTimeFormat("en-US", {
																				dateStyle: "medium",
																			}).format(new Date(order.createdAt))}
																		</span>
																	</div>
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Status
																		</span>
																		<Badge
																			variant={config.variant}
																			className="capitalize"
																		>
																			{config.label}
																		</Badge>
																	</div>
																</CardContent>
															</Card>

															{/* Payment Summary */}
															<Card>
																<CardHeader>
																	<CardTitle className="text-base">
																		Payment Summary
																	</CardTitle>
																</CardHeader>
																<CardContent className="space-y-3">
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Subtotal
																		</span>
																		<span className="font-medium">
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
																		<div className="flex justify-between text-sm">
																			<span className="text-muted-foreground">
																				Discount
																			</span>
																			<span className="font-medium text-green-600">
																				-
																				{new Intl.NumberFormat("en-US", {
																					style: "currency",
																					currency: order.currency || "USD",
																				}).format(
																					Number(
																						orderDetails?.discountAmount || 0,
																					),
																				)}
																			</span>
																		</div>
																	)}
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Shipping
																		</span>
																		<span className="font-medium">
																			{new Intl.NumberFormat("en-US", {
																				style: "currency",
																				currency: order.currency || "USD",
																			}).format(
																				Number(
																					orderDetails?.shippingAmount || 0,
																				),
																			)}
																		</span>
																	</div>
																	<div className="flex justify-between text-sm">
																		<span className="text-muted-foreground">
																			Tax
																		</span>
																		<span className="font-medium">
																			{new Intl.NumberFormat("en-US", {
																				style: "currency",
																				currency: order.currency || "USD",
																			}).format(
																				Number(orderDetails?.taxAmount || 0),
																			)}
																		</span>
																	</div>
																	<div className="border-t pt-3">
																		<div className="flex justify-between">
																			<span className="font-semibold">
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
																</CardContent>
															</Card>
														</div>

														{/* Shipping Address */}
														{orderDetails?.shippingAddress && (
															<Card>
																<CardHeader>
																	<CardTitle className="text-base">
																		Shipping Address
																	</CardTitle>
																</CardHeader>
																<CardContent>
																	<div className="space-y-1 text-sm">
																		<p className="font-medium">
																			{orderDetails.shippingAddress.street}
																		</p>
																		<p className="text-muted-foreground">
																			{orderDetails.shippingAddress.city},{" "}
																			{orderDetails.shippingAddress.state}{" "}
																			{orderDetails.shippingAddress.zipCode}
																		</p>
																		<p className="text-muted-foreground">
																			{orderDetails.shippingAddress.country}
																		</p>
																	</div>
																</CardContent>
															</Card>
														)}
													</div>
												)}
											</div>
										)}
									</Card>
								);
							})}
						</div>
					) : orders && orders.length > 0 ? (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="mb-4 rounded-full bg-muted p-4">
								<Search className="h-8 w-8 text-muted-foreground" />
							</div>
							<h3 className="mb-1 font-semibold text-lg">No orders found</h3>
							<p className="mb-4 max-w-sm text-muted-foreground text-sm">
								No orders match your current filters. Try adjusting your search
								or filters.
							</p>
							<Button
								variant="outline"
								onClick={() => {
									setSearchQuery("");
									setStatusFilter("all");
								}}
							>
								Clear Filters
							</Button>
						</div>
					) : (
						<div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
							<div className="relative mb-6">
								<div className="rounded-full bg-linear-to-br from-primary/20 to-primary/5 p-6">
									<ShoppingBag className="h-12 w-12 text-primary" />
								</div>
								<div className="-right-2 -top-2 absolute rounded-full bg-background p-2 shadow-lg">
									<Package className="h-6 w-6 text-muted-foreground" />
								</div>
							</div>
							<h3 className="mb-2 font-semibold text-xl">No orders yet</h3>
							<p className="mb-6 max-w-sm text-muted-foreground">
								Start your shopping journey and your orders will appear here.
							</p>
							<Button
								size="lg"
								onClick={() => router.push("/products")}
								className="gap-2"
							>
								<ShoppingBag className="h-4 w-4" />
								Start Shopping
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
