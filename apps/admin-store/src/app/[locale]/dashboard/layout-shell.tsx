"use client";

import {
	SidebarInset,
	SidebarProvider,
} from "@workspace/ui/components/sidebar";
import { Loader2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { authClient } from "@/lib/auth-client";
import { AppSidebar } from "./layout/sidebar/app-sidebar";
import { HeaderDashboard } from "./layout/sidebar/header";

export function DashboardLayoutShell({
	children,
}: {
	children: React.ReactNode;
}) {
	const { isPending: sessionLoading } = authClient.useSession();
	const { data: listOrganizations, isPending: orgsLoading } =
		authClient.useListOrganizations();

	const router = useRouter();
	const params = useParams();
	const locale = params?.locale as string;

	// Check if user has organizations
	const hasOrganizations =
		!orgsLoading && listOrganizations && listOrganizations.length > 0;

	React.useEffect(() => {
		if (!sessionLoading && !orgsLoading && !hasOrganizations) {
			router.push(`/${locale}/onboarding`);
		}
	}, [sessionLoading, orgsLoading, hasOrganizations, router, locale]);

	// Show loading state
	if (sessionLoading || orgsLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p className="animate-pulse font-medium text-muted-foreground">
						Loading your dashboard...
					</p>
				</div>
			</div>
		);
	}

	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<HeaderDashboard />
				<div className="p-4">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
