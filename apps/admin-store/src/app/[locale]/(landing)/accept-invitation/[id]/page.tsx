"use client";

import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { toast } from "sonner";
import { useModal } from "@/components/modals/modal-context";
import { authClient } from "@/lib/auth-client";

export default function AcceptInvitationPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = use(params);
	const router = useRouter();
	const { openModal } = useModal();
	const [status, setStatus] = useState<"idle" | "processing" | "error">(
		"processing",
	);

	const { mutate: acceptInvitation } = useMutation({
		mutationFn: async (invitationId: string) => {
			return await authClient.organization.acceptInvitation({
				invitationId,
			});
		},
		onSuccess: () => {
			toast.success("Invitation accepted successfully");
			router.push("/dashboard");
		},
		onError: (error) => {
			setStatus("error");
			toast.error(error.message || "Failed to accept invitation");
		},
	});

	useEffect(() => {
		acceptInvitation(id);
	}, [id, acceptInvitation]);

	return (
		<div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
			<div className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-md">
				{status === "processing" ? (
					<div className="flex flex-col items-center gap-4">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<p className="text-gray-600">Accepting invitation...</p>
					</div>
				) : (
					<div className="flex flex-col items-center gap-4">
						<p className="text-red-600">Failed to accept invitation.</p>
						<button
							onClick={() => openModal("signIn", null)}
							className="text-gray-500 text-sm hover:underline"
						>
							Go to Sign In
						</button>
					</div>
				)}
			</div>
		</div>
	);
}
