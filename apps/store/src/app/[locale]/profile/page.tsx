"use client";

import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import { Separator } from "@workspace/ui/components/separator";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProfileSidebar } from "@/components/profile/profile-sidebar";
import { useRouter } from "@/i18n/routing";
import { signOut, useSession } from "@/lib/auth-client";

export default function ProfilePage() {
	const t = useTranslations("Navigation");
	const { data: session, isPending } = useSession();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		if (!isPending && !session) {
			router.push("/");
		}
	}, [session, isPending, router]);

	const handleLogout = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Logged out successfully");
					router.push("/");
					router.refresh();
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "Failed to logout");
				},
			},
		});
	};

	if (isPending) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				Loading...
			</div>
		);
	}

	if (!session) {
		return null;
	}

	return (
		<div className="container mx-auto space-y-6 px-4 py-10 pb-16 md:block">
			<div className="space-y-0.5">
				<h2 className="font-bold text-2xl tracking-tight">{t("profile")}</h2>
				<p className="text-muted-foreground">
					Manage your account settings and preferences.
				</p>
			</div>
			<Separator className="my-6" />
			<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
				<aside className="-mx-4 lg:mx-0 lg:w-1/5">
					<ProfileSidebar
						activeTab={activeTab}
						onTabChange={setActiveTab}
						onLogout={handleLogout}
					/>
				</aside>
				<div className="w-full flex-1">
					{activeTab === "overview" && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Profile Information</CardTitle>
									<CardDescription>Your personal details.</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="grid gap-1">
										<span className="font-medium text-muted-foreground text-sm">
											Name
										</span>
										<span className="font-medium">{session.user.name}</span>
									</div>
									<div className="grid gap-1">
										<span className="font-medium text-muted-foreground text-sm">
											Email
										</span>
										<span className="font-medium">{session.user.email}</span>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
					{activeTab === "orders" && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Order History</CardTitle>
									<CardDescription>View your past orders.</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
										<p>No orders found.</p>
									</div>
								</CardContent>
							</Card>
						</div>
					)}
					{activeTab === "settings" && (
						<div className="space-y-6">
							<Card>
								<CardHeader>
									<CardTitle>Account Settings</CardTitle>
									<CardDescription>
										Manage your account preferences.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground text-sm">
										Settings placeholder.
									</p>
								</CardContent>
							</Card>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
