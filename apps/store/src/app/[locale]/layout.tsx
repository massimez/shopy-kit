import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@workspace/ui/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		template: "%s | Finitop",
		default: "Finitop - Premium E-commerce Experience",
	},
	description:
		"Discover the best products at Finitop. Your one-stop shop for premium items.",
	keywords: ["ecommerce", "shop", "premium", "store"],
};

export default async function LocaleLayout({
	children,
	params,
}: {
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}) {
	const { locale } = await params;
	if (!routing.locales.includes(locale as "en" | "fr" | "ar")) {
		notFound();
	}

	const messages = await getMessages();

	return (
		<html
			lang={locale}
			dir={locale === "ar" ? "rtl" : "ltr"}
			suppressHydrationWarning
		>
			<body>
				<NextIntlClientProvider messages={messages}>
					<NuqsAdapter>
						<QueryProvider>
							<ThemeProvider
								attribute="class"
								defaultTheme="system"
								enableSystem
								disableTransitionOnChange
							>
								{children}

								<Toaster />
							</ThemeProvider>
						</QueryProvider>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
