import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
	id: string;
	name: string;
	price: number;
	quantity: number;
	image?: string;
	description?: string;
	productVariantId: string;
	locationId: string;
	variantName?: string;
	variantSku?: string;
}

export interface AppliedCoupon {
	code: string;
	discountAmount: number;
	couponId: string;
	type: string;
}

interface CartState {
	items: CartItem[];
	appliedCoupon: AppliedCoupon | null;
	addItem: (item: CartItem) => void;
	removeItem: (id: string) => void;
	updateQuantity: (id: string, quantity: number) => void;
	clearCart: () => void;
	total: () => number;
	subtotal: () => number;
	finalTotal: () => number;
	itemCount: () => number;
	applyCoupon: (coupon: AppliedCoupon) => void;
	removeCoupon: () => void;
}

export const useCartStore = create<CartState>()(
	persist(
		(set, get) => ({
			items: [],
			appliedCoupon: null,
			addItem: (item) =>
				set((state) => {
					// Use productVariantId as the unique identifier to distinguish between different variants
					const existingItem = state.items.find(
						(i) => i.productVariantId === item.productVariantId,
					);
					if (existingItem) {
						return {
							items: state.items.map((i) =>
								i.productVariantId === item.productVariantId
									? { ...i, quantity: i.quantity + item.quantity }
									: i,
							),
						};
					}
					return { items: [...state.items, item] };
				}),
			removeItem: (id) =>
				set((state) => ({
					items: state.items.filter((i) => i.id !== id),
				})),
			updateQuantity: (id, quantity) =>
				set((state) => ({
					items: state.items.map((item) =>
						item.id === id
							? { ...item, quantity: Math.max(1, quantity) }
							: item,
					),
				})),
			clearCart: () => set({ items: [], appliedCoupon: null }),
			subtotal: () =>
				get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
			total: () => {
				const subtotal = get().subtotal();
				const discount = get().appliedCoupon?.discountAmount || 0;
				return Math.max(0, subtotal - discount);
			},
			finalTotal: () => get().total(),
			itemCount: () => get().items.length,
			applyCoupon: (coupon) => set({ appliedCoupon: coupon }),
			removeCoupon: () => set({ appliedCoupon: null }),
		}),
		{
			name: "cart-storage",
		},
	),
);
