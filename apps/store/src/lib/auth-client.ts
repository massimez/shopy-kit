import {
	emailOTPClient,
	inferAdditionalFields,
	organizationClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { envData } from "@/env";

export const authClient = createAuthClient({
	baseURL: envData.NEXT_PUBLIC_API_BASE_URL,
	plugins: [
		emailOTPClient(),
		organizationClient(),
		inferAdditionalFields({
			user: {
				firstName: {
					type: "string",
					required: false,
				},
				lastName: {
					type: "string",
					required: false,
				},
				birthdate: {
					type: "date",
					required: false,
				},
			},
		}),
	],
});

export const { useSession, signIn, signOut, signUp } = authClient;
