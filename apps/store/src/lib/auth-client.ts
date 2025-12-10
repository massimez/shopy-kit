import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
	plugins: [emailOTPClient(), organizationClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
