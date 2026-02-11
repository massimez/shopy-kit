"use client";

import { Button } from "@workspace/ui/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@workspace/ui/components/select";
import {
	Building2,
	Globe,
	Loader2,
	Map as MapIcon,
	MapPin,
	Phone,
	Store,
} from "lucide-react";
import * as React from "react";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export interface AddressStepData {
	street: string;
	city: string;
	state: string;
	zipCode: string;
	country: string;
	phone: string;
}

const countries = [
	{ value: "DZ", label: "Algeria" },
	{ value: "US", label: "United States" },
	{ value: "CA", label: "Canada" },
	{ value: "GB", label: "United Kingdom" },
	{ value: "AU", label: "Australia" },
	{ value: "FR", label: "France" },
	{ value: "DE", label: "Germany" },
	{ value: "IT", label: "Italy" },
	{ value: "ES", label: "Spain" },
	{ value: "NL", label: "Netherlands" },
	{ value: "BE", label: "Belgium" },
	{ value: "CH", label: "Switzerland" },
	{ value: "AT", label: "Austria" },
	{ value: "SE", label: "Sweden" },
	{ value: "NO", label: "Norway" },
	{ value: "DK", label: "Denmark" },
	{ value: "FI", label: "Finland" },
	{ value: "PL", label: "Poland" },
	{ value: "CZ", label: "Czech Republic" },
	{ value: "PT", label: "Portugal" },
	{ value: "GR", label: "Greece" },
	{ value: "IE", label: "Ireland" },
	{ value: "NZ", label: "New Zealand" },
	{ value: "JP", label: "Japan" },
	{ value: "KR", label: "South Korea" },
	{ value: "SG", label: "Singapore" },
	{ value: "HK", label: "Hong Kong" },
	{ value: "IN", label: "India" },
	{ value: "BR", label: "Brazil" },
	{ value: "MX", label: "Mexico" },
	{ value: "AR", label: "Argentina" },
];

export function StoreAddressForm({
	organizationId,
	onSubmit,
}: {
	organizationId: string;
	onSubmit: (data: AddressStepData) => Promise<void>;
}) {
	const [loading, setLoading] = React.useState(false);
	const [country, setCountry] = React.useState("DZ");

	const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setLoading(true);
		const formData = new FormData(event.currentTarget);

		const addressData = {
			street: formData.get("street") as string,
			city: formData.get("city") as string,
			state: formData.get("state") as string,
			zipCode: formData.get("zipCode") as string,
			country: country,
			phone: formData.get("phone") as string,
		};

		try {
			const response = await hc.api.organizations.locations.$post({
				json: {
					name: "Main Store",
					locationType: "shop",
					organizationId: organizationId,
					isDefault: true,
					isActive: true,
					address: {
						street: addressData.street,
						city: addressData.city,
						state: addressData.state,
						zipCode: addressData.zipCode,
						country: addressData.country,
					},
					contactPhone: addressData.phone,
				},
			});

			if (!response.ok) {
				await response.json();
				throw new Error("Failed to create location");
			}

			toast.success("Store location created successfully!");
			await onSubmit(addressData);
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: "Failed to create store location",
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<Card className="border-border/50 bg-background/60 shadow-xl backdrop-blur-xl">
			<CardHeader>
				<div className="flex items-center gap-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<Store className="h-5 w-5" />
					</div>
					<div>
						<CardTitle className="text-xl">
							Where is your store based?
						</CardTitle>
						<CardDescription>
							Add your primary business location
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<form id="address-form" onSubmit={handleSubmit} className="space-y-6">
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="country">Country / Region</Label>
							<Select
								name="country"
								required
								value={country}
								onValueChange={setCountry}
								disabled={loading}
							>
								<SelectTrigger id="country" className="relative pl-9">
									<Globe className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<SelectValue placeholder="Select country" />
								</SelectTrigger>
								<SelectContent>
									{countries.map((c) => (
										<SelectItem key={c.value} value={c.value}>
											{c.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="street">Street Address</Label>
							<div className="relative">
								<MapPin className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
								<Input
									id="street"
									name="street"
									placeholder="123 Store St, Suite 100"
									disabled={loading}
									required
									className="pl-9"
								/>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="city">City</Label>
								<div className="relative">
									<Building2 className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="city"
										name="city"
										placeholder="New York"
										disabled={loading}
										required
										className="pl-9"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="state">State / Province</Label>
								<div className="relative">
									<MapIcon className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="state"
										name="state"
										placeholder="NY"
										disabled={loading}
										required
										className="pl-9"
									/>
								</div>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<Label htmlFor="zipCode">ZIP / Postal Code</Label>
								<div className="relative">
									<MapPin className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="zipCode"
										name="zipCode"
										placeholder="10001"
										disabled={loading}
										required
										className="pl-9"
									/>
								</div>
							</div>
							<div className="space-y-2">
								<Label htmlFor="phone">Phone Number</Label>
								<div className="relative">
									<Phone className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
									<Input
										id="phone"
										name="phone"
										type="tel"
										placeholder="+1 (555) 000-0000"
										disabled={loading}
										required
										className="pl-9"
									/>
								</div>
							</div>
						</div>
					</div>
				</form>
			</CardContent>
			<CardFooter className="flex justify-end border-t bg-muted/50 p-6">
				<Button
					type="submit"
					form="address-form"
					disabled={loading}
					size="lg"
					className="w-full min-w-[150px] md:w-auto"
				>
					{loading ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						"Finish Setup"
					)}
				</Button>
			</CardFooter>
		</Card>
	);
}
