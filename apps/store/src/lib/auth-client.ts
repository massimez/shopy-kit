import { emailOTPClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { envData } from "@/env";

export const authClient = createAuthClient({
	baseURL: envData.NEXT_PUBLIC_API_BASE_URL,
	plugins: [emailOTPClient(), organizationClient()],
});

export const { useSession, signIn, signOut, signUp } = authClient;
