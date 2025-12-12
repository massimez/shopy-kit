import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { CartSidebar } from "@/components/features/cart/cart-sidebar";
import { CategorySidebarContainer } from "@/components/features/category/category-sidebar-container";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { routing } from "@/i18n/routing";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";
import "@workspace/ui/globals.css";
import { Card } from "@workspace/ui/components/card";

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
								<div className="container mx-auto flex flex-col gap-2.5">
									<Navbar />
									<div className="flex min-h-[calc(100vh-5rem)] gap-2.5">
										<Card className="hidden px-4 lg:flex">
											<CategorySidebarContainer className="scrollbar-hide -mt-1.5 sticky top-20 max-h-[calc(100vh-8rem)] w-[236px] shrink-0 flex-col overflow-y-auto" />
										</Card>
										<Card className="w-full flex-1 p-4">{children}</Card>
										<Card className="hidden px-4 xl:flex">
											<CartSidebar className="scrollbar-hide sticky top-20 flex max-h-[calc(100vh-8rem)] w-[330px] shrink-0 flex-col overflow-hidden" />
										</Card>
									</div>
									<Footer />
								</div>

								<Toaster />
							</ThemeProvider>
						</QueryProvider>
					</NuqsAdapter>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
