"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@workspace/ui/components/pagination";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import { useState } from "react";
import { PageDashboardHeader } from "@/components/sections/page-dashboard-header";
import { hc } from "@/lib/api-client";
import { EditOrderDialog } from "./_components/edit-order-dialog";
import { OrderList } from "./_components/order-list";
import type { ORDER_STATUS, Order } from "./_components/types";
import { useOrders } from "./hooks/use-orders";

const ORDER_STATUSES: ORDER_STATUS[] = [
	"draft",
	"pending",
	"confirmed",
	"processing",
	"shipped",
	"delivered",
	"completed",
	"cancelled",
	"failed",
	"returned",
	"paid",
	"refunded",
];

const OrdersPage = () => {
	const queryClient = useQueryClient();
	const [editingOrder, setEditingOrder] = useState<Order | null>(null);
	const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
	const [statusFilter, setStatusFilter] = useState<string | undefined>(
		undefined,
	);
	const [page, setPage] = useState(1);
	const limit = 10;
	const offset = (page - 1) * limit;

	const {
		data: ordersQueryResult,
		isLoading,
		error,
	} = useOrders({
		status: statusFilter,
		limit: limit.toString(),
		offset: offset.toString(),
	});

	const handleDeleteOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].$delete({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to delete order:", error);
		}
	};

	const handleCompleteOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].complete.$patch({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to complete order:", error);
		}
	};

	const handleCancelOrder = async (orderId: string) => {
		try {
			await hc.api.store.orders[":id"].cancel.$patch({
				param: { id: orderId },
			});
			queryClient.invalidateQueries({ queryKey: ["orders"] });
		} catch (error) {
			console.error("Failed to cancel order:", error);
		}
	};

	const handleEditOrder = (order: Order) => {
		setEditingOrder(order);
		setIsEditDialogOpen(true);
	};

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div>Error: {error.message}</div>;
	if (!ordersQueryResult || "error" in ordersQueryResult)
		return <div>Error loading orders</div>;

	const orders = (ordersQueryResult.data || []).map((order) => ({
		...order,
		userId: order.userId ?? undefined,
	}));
	const total = ordersQueryResult?.total || 0;
	const totalPages = Math.ceil(total / limit);

	return (
		<div className="p-4">
			<div className="mb-4 space-y-4">
				<PageDashboardHeader title="Orders" />
				<div className="flex items-center gap-4">
					<Select
						value={statusFilter || "all"}
						onValueChange={(value) => {
							setStatusFilter(value === "all" ? undefined : value);
							setPage(1); // Reset to first page when filter changes
						}}
					>
						<SelectTrigger className="w-48">
							<SelectValue placeholder="Filter by status" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">All statuses</SelectItem>
							{ORDER_STATUSES.map((status) => (
								<SelectItem key={status} value={status}>
									{status.charAt(0).toUpperCase() + status.slice(1)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
			</div>
			<OrderList
				// biome-ignore lint/suspicious/noExplicitAny: <>
				orders={orders as any}
				total={ordersQueryResult?.total || 0}
				onEditOrder={handleEditOrder}
				onDeleteOrder={handleDeleteOrder}
				onCompleteOrder={handleCompleteOrder}
				onCancelOrder={handleCancelOrder}
			/>
			{totalPages > 1 && (
				<Pagination className="mt-4">
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setPage((p) => Math.max(1, p - 1));
								}}
								aria-disabled={page === 1}
								className={
									page === 1 ? "pointer-events-none opacity-50" : undefined
								}
							/>
						</PaginationItem>
						{Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
							<PaginationItem key={p}>
								<PaginationLink
									href="#"
									isActive={page === p}
									onClick={(e) => {
										e.preventDefault();
										setPage(p);
									}}
								>
									{p}
								</PaginationLink>
							</PaginationItem>
						))}
						<PaginationItem>
							<PaginationNext
								href="#"
								onClick={(e) => {
									e.preventDefault();
									setPage((p) => Math.min(totalPages, p + 1));
								}}
								aria-disabled={page === totalPages}
								className={
									page === totalPages
										? "pointer-events-none opacity-50"
										: undefined
								}
							/>
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			)}
			<EditOrderDialog
				order={editingOrder}
				open={isEditDialogOpen}
				onOpenChange={setIsEditDialogOpen}
			/>
		</div>
	);
};

export default OrdersPage;
