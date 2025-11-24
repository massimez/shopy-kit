"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	Alert,
	AlertDescription,
	AlertTitle,
} from "@workspace/ui/components/alert";
import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Checkbox } from "@workspace/ui/components/checkbox";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import { Separator } from "@workspace/ui/components/separator";
import { AlertCircle, Check, CreditCard, Shield, Truck, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { type Path, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "@/i18n/routing";
import { useSession } from "@/lib/auth-client";
import { StorefrontError, storefrontClient } from "@/lib/storefront";
import { useCartStore } from "@/store/use-cart-store";

type CheckoutStep = "shipping" | "payment" | "review";

interface CheckoutFormProps {
	organizationId: string;
	locationId: string;
	currency?: string;
}

// Validation schema - for step validation, we only validate filled fields
// Full validation happens on submit
const checkoutSchema = z.object({
	shippingAddress: z.object({
		street: z.string(),
		city: z.string(),
		state: z.string(),
		country: z.string(),
		postalCode: z.string(),
	}),
	billingAddress: z.object({
		street: z.string().optional(),
		city: z.string().optional(),
		state: z.string().optional(),
		country: z.string().optional(),
		postalCode: z.string().optional(),
	}),
	customerInfo: z.object({
		fullName: z.string(),
		email: z.string().email("Invalid email address"),
		phone: z.string(),
	}),
	useDifferentBilling: z.boolean().default(false),
});

// Step-specific validation schemas for partial validation
const shippingAddressSchema = z.object({
	street: z.string().min(1, "Street address is required"),
	city: z.string().min(1, "City is required"),
	state: z.string().min(1, "State/Province is required"),
	country: z.string().min(1, "Country is required"),
	postalCode: z.string().min(1, "Postal code is required"),
});

const customerInfoSchema = z.object({
	fullName: z.string().min(1, "Full name is required"),
	email: z.string().email("Invalid email address"),
	phone: z.string().min(1, "Phone number is required"),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export function CheckoutForm({
	organizationId,
	locationId,
	currency = "USD",
}: CheckoutFormProps) {
	const { items, total, clearCart } = useCartStore();
	const { data: session } = useSession();
	const router = useRouter();
	const [currentStep, setCurrentStep] = useState<CheckoutStep>("shipping");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [apiErrors, setApiErrors] = useState<Record<string, string>>({});

	const form = useForm<CheckoutFormValues>({
		resolver: zodResolver(checkoutSchema),
		defaultValues: {
			shippingAddress: {
				street: "",
				city: "",
				state: "",
				country: "",
				postalCode: "",
			},
			billingAddress: {
				street: "",
				city: "",
				state: "",
				country: "",
				postalCode: "",
			},
			customerInfo: {
				fullName: session?.user?.name || "",
				email: session?.user?.email || "",
				phone: "",
			},
			useDifferentBilling: false,
		},
	});

	const steps = [
		{ id: "shipping", title: "Shipping", icon: Truck },
		{ id: "payment", title: "Payment", icon: CreditCard },
		{ id: "review", title: "Review", icon: Check },
	];

	const nextStep = async () => {
		// Validate current step fields using step-specific schemas
		if (currentStep === "shipping") {
			const shippingAddressValues = form.getValues("shippingAddress");
			const validationResult = shippingAddressSchema.safeParse(
				shippingAddressValues,
			);

			if (validationResult.success) {
				setCurrentStep("payment");
			} else {
				// Set field errors for display
				validationResult.error.issues.forEach((issue) => {
					const fieldPath = `shippingAddress.${String(issue.path[0])}`;
					form.setError(fieldPath as Path<CheckoutFormValues>, {
						type: "manual",
						message: issue.message,
					});
				});
			}
		} else if (currentStep === "payment") {
			const customerInfoValues = form.getValues("customerInfo");
			const validationResult = customerInfoSchema.safeParse(customerInfoValues);

			if (validationResult.success) {
				setCurrentStep("review");
			} else {
				// Set field errors for display
				validationResult.error.issues.forEach((issue) => {
					const fieldPath = `customerInfo.${String(issue.path[0])}`;
					form.setError(fieldPath as Path<CheckoutFormValues>, {
						type: "manual",
						message: issue.message,
					});
				});
			}
		}
	};

	const prevStep = () => {
		if (currentStep === "payment") setCurrentStep("shipping");
		else if (currentStep === "review") setCurrentStep("payment");
	};

	const onSubmit = async (data: CheckoutFormValues) => {
		// Only create order when on the review step
		if (currentStep !== "review") {
			return;
		}

		console.log("Proceeding with order creation");
		setIsSubmitting(true);
		setApiErrors({});

		try {
			// Validate that we have items
			if (items.length === 0) {
				toast.error("Your cart is empty");
				return;
			}

			// Full validation happens here
			const shippingValidation = shippingAddressSchema.safeParse(
				data.shippingAddress,
			);
			const customerValidation = customerInfoSchema.safeParse(
				data.customerInfo,
			);

			if (!shippingValidation.success || !customerValidation.success) {
				const allErrors = [];
				if (!shippingValidation.success) {
					allErrors.push(...shippingValidation.error.issues);
				}
				if (!customerValidation.success) {
					allErrors.push(...customerValidation.error.issues);
				}

				setCurrentStep("shipping");
				toast.error("Please complete all required fields");
				return;
			}

			const payload = {
				organizationId,
				locationId,
				currency,
				shippingAddress: data.shippingAddress,
				customerEmail: data.customerInfo.email,
				customerPhone: data.customerInfo.phone,
				customerFullName: data.customerInfo.fullName,
				userId: session?.user?.id || undefined,
				items: items.map((item) => ({
					productVariantId: item.productVariantId,
					quantity: item.quantity,
					locationId: item.locationId,
				})),
			};

			console.log(
				"Creating order with payload:",
				JSON.stringify(payload, null, 2),
			);

			// Create order
			const order = await storefrontClient.createOrder(payload);

			// Clear cart on success
			clearCart();

			toast.success(
				`Order placed successfully! Order number: ${order.orderNumber}`,
			);

			// Redirect to order confirmation or orders page
			router.push("/profile");
		} catch (error) {
			console.error("Error creating order:", error);
			if (error instanceof StorefrontError && error.issues) {
				// Log detailed validation issues for debugging
				console.error(
					"Validation issues:",
					JSON.stringify(error.issues, null, 2),
				);

				// Check for stock errors first
				const hasStockError = error.issues.some(
					(issue) => issue.code === "INSUFFICIENT_STOCK",
				);

				if (hasStockError) {
					// Display stock error message directly
					const stockIssue = error.issues.find(
						(issue) => issue.code === "INSUFFICIENT_STOCK",
					);
					toast.error(stockIssue?.message || error.message);
					return;
				}

				// Handle API validation errors
				const newErrors: Record<string, string> = {};
				error.issues.forEach((issue) => {
					const key = issue.path.join(".");
					newErrors[key] = issue.message;
				});
				setApiErrors(newErrors);

				// Show detailed error message
				const errorCount = Object.keys(newErrors).length;
				toast.error(
					`Please fix ${errorCount} validation error${errorCount > 1 ? "s" : ""} in the form`,
					{
						description:
							Object.entries(newErrors)
								.slice(0, 3)
								.map(([field, msg]) => `${field}: ${msg}`)
								.join("\n") +
							(errorCount > 3 ? `\n...and ${errorCount - 3} more` : ""),
						duration: 5000,
					},
				);

				// Navigate to the step with errors if needed
				const hasShippingErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("shippingAddress"),
				);
				const hasBillingErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("billingAddress"),
				);
				const hasCustomerErrors = Object.keys(newErrors).some((k) =>
					k.startsWith("customer"),
				);

				if (hasShippingErrors || hasBillingErrors) {
					setCurrentStep("shipping");
				} else if (hasCustomerErrors) {
					setCurrentStep("payment");
				}
			} else {
				toast.error(
					error instanceof Error ? error.message : "Failed to create order",
				);
			}
		} finally {
			setIsSubmitting(false);
		}
	};

	const renderProgressBar = () => (
		<div className="mb-8">
			<div className="mb-4 flex items-center justify-between">
				{steps.map((step, index) => {
					const StepIcon = step.icon;
					const isActive = step.id === currentStep;
					const isCompleted =
						steps.findIndex((s) => s.id === currentStep) > index;

					return (
						<div key={step.id} className="flex flex-1 flex-col items-center">
							<div
								className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
									isCompleted
										? "border-green-500 bg-green-500 text-white"
										: isActive
											? "border-primary bg-primary text-primary-foreground"
											: "border-muted-foreground text-muted-foreground"
								}`}
							>
								<StepIcon className="h-5 w-5" />
							</div>
							<span
								className={`mt-2 font-medium text-sm ${
									isActive
										? "text-primary"
										: isCompleted
											? "text-green-600"
											: "text-muted-foreground"
								}`}
							>
								{step.title}
							</span>
						</div>
					);
				})}
			</div>
			<div className="flex">
				{steps.map((step) => {
					const isActive = step.id === currentStep;
					const isCompleted =
						steps.findIndex((s) => s.id === currentStep) >
						steps.findIndex((s) => s.id === step.id);
					return (
						<div
							key={`progress-${step.id}`}
							className={`h-1 flex-1 ${
								isCompleted
									? "bg-green-500"
									: isActive
										? "bg-primary"
										: "bg-muted"
							}`}
						/>
					);
				})}
			</div>
		</div>
	);

	const renderShippingStep = () => (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Truck className="h-5 w-5" />
						Shipping Address
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<FormField
						control={form.control}
						name="shippingAddress.street"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Street Address *</FormLabel>
								<FormControl>
									<Input placeholder="123 Main Street" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="shippingAddress.city"
							render={({ field }) => (
								<FormItem>
									<FormLabel>City *</FormLabel>
									<FormControl>
										<Input placeholder="New York" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shippingAddress.state"
							render={({ field }) => (
								<FormItem>
									<FormLabel>State/Province *</FormLabel>
									<FormControl>
										<Input placeholder="NY" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<FormField
							control={form.control}
							name="shippingAddress.country"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Country *</FormLabel>
									<FormControl>
										<Input placeholder="United States" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="shippingAddress.postalCode"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Postal Code *</FormLabel>
									<FormControl>
										<Input placeholder="10001" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<FormField
						control={form.control}
						name="useDifferentBilling"
						render={({ field }) => (
							<FormItem className="flex items-center space-x-2 pt-4">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
								<FormLabel className="font-normal text-sm">
									Use different billing address
								</FormLabel>
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</div>
	);

	const renderPaymentStep = () => (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<CreditCard className="h-5 w-5" />
						Payment Method
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="rounded-lg border bg-blue-50 p-6 dark:bg-blue-950/20">
						<div className="flex items-center gap-3">
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white">
								<span className="font-bold text-lg">$</span>
							</div>
							<div>
								<h3 className="font-semibold">Cash on Delivery</h3>
								<p className="text-muted-foreground text-sm">
									Pay when your order arrives at your doorstep
								</p>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Contact Information</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<FormField
						control={form.control}
						name="customerInfo.fullName"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Full Name *</FormLabel>
								<FormControl>
									<Input placeholder="John Doe" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="customerInfo.email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email Address *</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="john@example.com"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="customerInfo.phone"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Phone Number *</FormLabel>
								<FormControl>
									<Input type="tel" placeholder="(555) 123-4567" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</CardContent>
			</Card>
		</div>
	);

	const renderReviewStep = () => {
		const values = form.getValues();
		return (
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Order Review</CardTitle>
					</CardHeader>
					<CardContent className="space-y-6">
						{/* Shipping Address Summary */}
						<div>
							<h3 className="mb-2 font-semibold">Shipping Address</h3>
							<div className="rounded bg-muted p-3 text-muted-foreground text-sm">
								<p>{values.customerInfo.fullName}</p>
								<p>{values.shippingAddress.street}</p>
								<p>
									{values.shippingAddress.city}, {values.shippingAddress.state}{" "}
									{values.shippingAddress.postalCode}
								</p>
								<p>{values.shippingAddress.country}</p>
								<p className="mt-2">{values.customerInfo.email}</p>
								{values.customerInfo.phone && (
									<p>{values.customerInfo.phone}</p>
								)}
							</div>
						</div>

						{/* Payment Summary */}
						<div>
							<h3 className="mb-2 font-semibold">Payment Method</h3>
							<div className="flex items-center gap-2 rounded bg-blue-50 p-3 text-sm dark:bg-blue-950/20">
								<div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
									<span className="font-bold text-xs">$</span>
								</div>
								<span className="font-medium">Cash on Delivery</span>
							</div>
						</div>

						{/* Order Summary */}
						<div className="border-t pt-4">
							<div className="flex items-center justify-between font-bold text-lg">
								<span>Total</span>
								<span>${total().toFixed(2)}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Trust badges and security notice */}
				<div className="rounded-lg bg-muted p-4">
					<div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
						<div className="flex items-center gap-1">
							<Shield className="h-4 w-4 text-green-500" />
							<span>Secure SSL Encryption</span>
						</div>
						<div className="flex items-center gap-1">
							<Check className="h-4 w-4 text-green-500" />
							<span>30-Day Returns</span>
						</div>
						<div className="flex items-center gap-1">
							<Truck className="h-4 w-4 text-blue-500" />
							<span>Free Shipping</span>
						</div>
					</div>
				</div>
			</div>
		);
	};

	const renderNavigationButtons = () => {
		const shouldShowContinue = currentStep !== "review";
		return (
			<div className="flex gap-4 pt-6">
				{currentStep !== "shipping" && (
					<Button
						type="button"
						variant="outline"
						onClick={prevStep}
						className="flex-1"
					>
						Back
					</Button>
				)}
				{shouldShowContinue ? (
					<Button
						type="button"
						onClick={(e) => {
							e.preventDefault();
							nextStep();
						}}
						className="flex-1"
					>
						Continue to{" "}
						{steps[steps.findIndex((s) => s.id === currentStep) + 1]?.title}
					</Button>
				) : (
					<Button
						type="submit"
						className="flex-1"
						disabled={isSubmitting || items.length === 0}
					>
						{isSubmitting
							? "Processing Order..."
							: `Place Order - $${total().toFixed(2)}`}
					</Button>
				)}
			</div>
		);
	};

	const renderSidebar = () => (
		<div className="space-y-4 lg:w-80">
			<Card>
				<CardHeader>
					<CardTitle>Order Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{items.map((item) => (
							<div key={item.id} className="flex gap-3">
								{item.image && (
									<Image
										src={item.image}
										alt={item.name}
										width={48}
										height={48}
										className="h-12 w-12 rounded object-cover"
									/>
								)}
								<div className="flex-1">
									<p className="font-medium text-sm">{item.name}</p>
									{(item.variantName || item.variantSku) && (
										<p className="text-muted-foreground text-xs">
											{item.variantName && <span>{item.variantName}</span>}
											{item.variantName && item.variantSku && <span> • </span>}
											{item.variantSku && <span>SKU: {item.variantSku}</span>}
										</p>
									)}
									<p className="text-muted-foreground text-xs">
										Qty: {item.quantity}
									</p>
								</div>
								<p className="font-medium text-sm">
									${(item.price * item.quantity).toFixed(2)}
								</p>
							</div>
						))}
					</div>
					<Separator className="my-4" />
					<div className="space-y-2">
						<div className="flex justify-between text-sm">
							<span>Subtotal</span>
							<span>${total().toFixed(2)}</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Shipping</span>
							<span className="text-green-600">Free</span>
						</div>
						<div className="flex justify-between text-sm">
							<span>Tax</span>
							<span>$0.00</span>
						</div>
						<Separator />
						<div className="flex justify-between font-bold">
							<span>Total</span>
							<span>${total().toFixed(2)}</span>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Trust signals */}
			<div className="space-y-3">
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Shield className="h-4 w-4 text-green-500" />
					<span>Secure Checkout • SSL Protected</span>
				</div>
				<div className="flex items-center gap-2 text-muted-foreground text-sm">
					<Check className="h-4 w-4 text-green-500" />
					<span>30-Day Money Back Guarantee</span>
				</div>
			</div>
		</div>
	);

	return (
		<div className="mx-auto max-w-6xl">
			<div className="grid gap-8 lg:grid-cols-[1fr_320px]">
				{/* Main checkout form */}
				<div>
					{renderProgressBar()}

					{/* API Error Summary */}
					{Object.keys(apiErrors).length > 0 && (
						<Alert variant="destructive" className="mb-6">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-2">
									<AlertCircle className="mt-0.5 h-4 w-4" />
									<div className="flex-1">
										<AlertTitle>Validation Errors</AlertTitle>
										<AlertDescription className="mt-2 space-y-1">
											{Object.entries(apiErrors).map(([field, message]) => (
												<div key={field} className="text-sm">
													<strong>{field}:</strong> {message}
												</div>
											))}
										</AlertDescription>
									</div>
								</div>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setApiErrors({})}
									className="h-6 w-6 p-0 hover:bg-transparent"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</Alert>
					)}

					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
							{currentStep === "shipping" && renderShippingStep()}
							{currentStep === "payment" && renderPaymentStep()}
							{currentStep === "review" && renderReviewStep()}

							{renderNavigationButtons()}
						</form>
					</Form>
				</div>

				{/* Sidebar */}
				{renderSidebar()}
			</div>
		</div>
	);
}
