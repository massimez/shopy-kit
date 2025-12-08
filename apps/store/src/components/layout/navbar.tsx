"use client";

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "@workspace/ui/components/avatar";
import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Input } from "@workspace/ui/components/input";
import {
	LanguageSelector,
	type LocaleOption,
} from "@workspace/ui/components/language-selector";
import { ModeToggle } from "@workspace/ui/components/theme-toggle";
import {
	ChevronDown,
	Heart,
	LogOut,
	Search,
	Settings,
	Tornado,
	User,
} from "lucide-react";
import { useLocale } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { CartButton } from "@/components/features/cart/cart-button";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { signOut, useSession } from "@/lib/auth-client";
import { AuthModal } from "../auth/auth-modal";

export function Navbar() {
	const pathname = usePathname();
	const router = useRouter();
	const currentLocale = useLocale();
	const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
	const [authModalView, setAuthModalView] = useState<"signIn" | "signUp">(
		"signIn",
	);

	const locales: LocaleOption[] = [
		{ code: "en", label: "English", flag: "🇺🇸", nativeName: "English" },
		{ code: "fr", label: "Français", flag: "🇫🇷", nativeName: "Français" },
		{ code: "ar", label: "العربية", flag: "🇸🇦", nativeName: "العربية" },
	];

	const handleLocaleChange = (locale: string) => {
		router.replace(pathname, { locale });
	};

	// Get actual auth state from session
	const { data: session } = useSession();
	const isAuthenticated = !!session?.user;
	const user = {
		name: session?.user?.name || "User",
		email: session?.user?.email || "",
		avatar: session?.user?.image || "", // Optional avatar URL
	};

	const handleSignOut = async () => {
		await signOut({
			fetchOptions: {
				onSuccess: () => {
					toast.success("Logged out successfully");
					router.push("/");
					router.refresh();
				},
				onError: (ctx) => {
					toast.error(ctx.error.message || "Failed to logout");
				},
			},
		});
	};

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
			<div className="container mx-auto flex h-20 items-center gap-4 px-4">
				{/* Logo Section */}
				<Link href="/" className="me-6 flex items-center gap-2">
					<div className="flex items-center justify-center text-violet-600">
						<Tornado className="h-8 w-8 rotate-180" />
					</div>
					<span className="font-bold text-2xl text-violet-600 italic tracking-tight">
						YAMMY
					</span>
				</Link>

				{/* Search Bar */}
				<div className="hidden flex-1 items-center justify-center px-8 lg:flex">
					<div className="flex w-full max-w-2xl items-center rounded-md border border-input bg-muted/30 focus-within:ring-1 focus-within:ring-ring">
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="h-10 gap-2 rounded-r-none border-r px-4 font-normal text-muted-foreground hover:bg-transparent"
								>
									All Categories
									<ChevronDown className="h-4 w-4 opacity-50" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="start" className="w-48">
								<DropdownMenuLabel>Categories</DropdownMenuLabel>
								<DropdownMenuItem>All Categories</DropdownMenuItem>
								<DropdownMenuItem>Electronics</DropdownMenuItem>
								<DropdownMenuItem>Fashion</DropdownMenuItem>
								<DropdownMenuItem>Home & Garden</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						<div className="relative flex-1">
							<Input
								placeholder="Search"
								className="h-10 rounded-none border-0 bg-transparent px-4 shadow-none focus-visible:ring-0"
							/>
						</div>

						<Button
							variant="ghost"
							size="icon"
							className="h-10 w-12 rounded-l-none hover:bg-transparent"
						>
							<Search className="h-5 w-5 text-muted-foreground" />
						</Button>
					</div>
				</div>

				{/* Right Actions */}
				<div className="flex flex-1 items-center justify-end gap-1 sm:gap-4 lg:flex-none">
					{/* <Button variant="ghost" size="icon" className="text-foreground">
						<Bell className="size-6 stroke-[1.5]" />
					</Button> */}
					<Button variant="ghost" size="icon" className="text-foreground">
						<Heart className="size-6 stroke-[1.5]" />
					</Button>

					<div className="flex items-center">
						<CartButton classNameIcon="size-6" />
					</div>
					<LanguageSelector
						locales={locales}
						currentLocale={currentLocale}
						onLocaleChange={handleLocaleChange}
						triggerVariant="ghost"
						size="icon"
						iconClassName="size-6"
					/>
					<ModeToggle variant="ghost" iconClassName="size-6" />
					{isAuthenticated ? (
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="gap-2 pr-0 pl-2 hover:bg-transparent"
								>
									<Avatar className="size-8 border">
										<AvatarImage src={user.avatar} alt={user.name} />
										<AvatarFallback className="bg-primary text-primary-foreground text-xs">
											{user.name.charAt(0).toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<ChevronDown className="h-4 w-4 text-muted-foreground" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent className="w-56" align="end" forceMount>
								<DropdownMenuLabel className="font-normal">
									<div className="flex flex-col space-y-1">
										<p className="font-medium text-sm leading-none">
											{user.name}
										</p>
										<p className="text-muted-foreground text-xs leading-none">
											{user.email}
										</p>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={() => router.push("/profile")}>
									<User className="ms-2 h-4 w-4" />
									<span>Profile</span>
								</DropdownMenuItem>
								<DropdownMenuItem>
									<Settings className="ms-2 h-4 w-4" />
									<span>Settings</span>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem onClick={handleSignOut} variant="destructive">
									<LogOut className="mr-2 h-4 w-4" />
									<span>Sign Out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					) : (
						<Button
							variant="ghost"
							className="gap-2 pr-0 pl-2 hover:bg-transparent"
							onClick={() => {
								setAuthModalView("signIn");
								setIsAuthModalOpen(true);
							}}
						>
							<Avatar className="h-8 w-8 border">
								<AvatarFallback>
									<User className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
							<ChevronDown className="h-4 w-4 text-muted-foreground" />
						</Button>
					)}
				</div>
			</div>
			<AuthModal
				open={isAuthModalOpen}
				onOpenChange={setIsAuthModalOpen}
				defaultView={authModalView}
			/>
		</header>
	);
}
