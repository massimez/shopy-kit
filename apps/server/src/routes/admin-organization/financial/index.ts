import { createRouter } from "@/lib/create-hono-app";
import { payoutRoute } from "./payout/route";

export const financialRoute = createRouter().route("/", payoutRoute);
