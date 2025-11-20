"use client";

import { OtpVerification } from "@workspace/ui/components/auth/otp-verification";
import { SignIn } from "@workspace/ui/components/auth/sign-in";
import { SignUp } from "@workspace/ui/components/auth/sign-up";
import { Dialog, DialogContent } from "@workspace/ui/components/dialog";
import { useOtpVerification } from "@workspace/ui/hooks/use-otp-verification";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "@/i18n/routing";
import { authClient, signIn, signUp } from "@/lib/auth-client";

interface AuthModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	defaultView?: "signIn" | "signUp";
}

export function AuthModal({
	open,
	onOpenChange,
	defaultView = "signIn",
}: AuthModalProps) {
	const [view, setView] = useState<"signIn" | "signUp" | "verificationOtp">(
		defaultView,
	);
	// biome-ignore lint/suspicious/noExplicitAny: <>
	const [otpProps, setOtpProps] = useState<any>(null);
	const router = useRouter();

	// biome-ignore lint/suspicious/noExplicitAny: <>
	const openModal = (type: string, props: any) => {
		if (type === "verificationOtp") {
			setOtpProps(props);
			setView("verificationOtp");
		}
		// Add other types if needed
	};

	const { handleVerification } = useOtpVerification({
		openModal,
		authClient,
		toast,
		router,
	});

	// Reset view when modal opens
	if (open && view !== defaultView) {
		// This might cause an infinite loop if not handled carefully or if defaultView changes.
		// Better to just let the parent control the initial view or use a useEffect.
		// For now, let's rely on the state.
	}

	const handleSignIn = async (email: string, password: string) => {
		await signIn.email(
			{
				email,
				password,
			},
			{
				onSuccess: () => {
					toast.success("Signed in successfully");
					onOpenChange(false);
					router.refresh();
				},
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	const handleSocialLogin = async (provider: string) => {
		await signIn.social(
			{
				provider: provider,
				callbackURL: "/",
			},
			{
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	const handleSignUp = async (data: {
		email: string;
		password: string;
		firstName: string;
		lastName: string;
	}) => {
		await signUp.email(
			{
				email: data.email,
				password: data.password,
				name: `${data.firstName} ${data.lastName}`,
			},
			{
				onSuccess: () => {
					handleVerification({
						email: data.email,
						password: data.password,
						onVerificationSuccess: () => {
							toast.success("Account created successfully");
							onOpenChange(false);
							router.refresh();
						},
					});
				},
				onError: (ctx) => {
					toast.error(ctx.error.message);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 sm:max-w-[425px]">
				{view === "signIn" ? (
					<SignIn
						onLoginClick={handleSignIn}
						onSocialLoginClick={handleSocialLogin}
						onSignUpClick={async () => setView("signUp")}
						onForgetPasswordClick={async () => {
							toast.info(
								"Forgot password flow not implemented yet in this demo",
							);
						}}
					/>
				) : view === "signUp" ? (
					<SignUp
						onClickCreateAccount={handleSignUp}
						onClickSignIn={() => setView("signIn")}
					/>
				) : (
					<OtpVerification {...otpProps} />
				)}
			</DialogContent>
		</Dialog>
	);
}
