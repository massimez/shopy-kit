import { hcWithType } from "@workspace/api/hc";
import { envData } from "../env";

export const hc = hcWithType(envData.NEXT_PUBLIC_API_BASE_URL, {
	init: { credentials: "include" },
});
