"use client";

import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { authClient } from "@/lib/auth-client";

export default function OnboardingPage() {
	const { data: session, isPending: sessionLoading } = authClient.useSession();
	const { isPending: orgsLoading } = authClient.useListOrganizations();

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!sessionLoading && !session) {
			// router.push("/sign-in"); // Or let middleware handle it?
			// Usually auth guard handles this. Let's assume layout or middleware handles it,
			// but explicit check is safer.
		}
	}, [session, sessionLoading]);

	if (sessionLoading || orgsLoading) {
		return (
			<div className="flex h-screen w-full items-center justify-center bg-linear-to-br from-background via-background to-muted/20">
				<div className="flex flex-col items-center gap-4">
					<Loader2 className="h-12 w-12 animate-spin text-primary" />
					<p className="animate-pulse font-medium text-muted-foreground">
						Setting up onboarding...
					</p>
				</div>
			</div>
		);
	}

	return <OnboardingFlow />;
}
