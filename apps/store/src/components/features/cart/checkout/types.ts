export type CheckoutStep = "shipping" | "payment" | "review";

export interface CheckoutFormProps {
	locationId: string;
	currency?: string;
	onClose?: () => void;
	onBack?: () => void;
}

export interface Address {
	street?: string;
	city: string;
	state: string;
	country?: string;
	postalCode?: string;
	lat?: number;
	lng?: number;
}

export interface CustomerInfo {
	fullName: string;
	email: string;
	phone: string;
}

export interface CheckoutFormData {
	shippingAddress: Address;
	billingAddress: Partial<Address>;
	customerInfo: CustomerInfo;
	useDifferentBilling: boolean;
}

export interface StepConfig {
	id: CheckoutStep;
	title: string;
	icon: React.ComponentType<{ className?: string }>;
}
