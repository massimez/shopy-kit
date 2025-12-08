"use client";

import { Globe } from "lucide-react";
import { Button } from "./button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "./dropdown-menu";

export interface LocaleOption {
	code: string;
	label: string;
	flag?: string;
	nativeName?: string;
}

export interface LanguageSelectorProps {
	locales: LocaleOption[];
	currentLocale?: string;
	showFlagNames?: boolean;
	variant?: "default" | "compact";
	size?: "sm" | "lg" | "icon";
	onLocaleChange?: (locale: string) => void;
	className?: string;
	iconClassName?: string;
	triggerVariant?:
		| "primary"
		| "mono"
		| "destructive"
		| "secondary"
		| "outline"
		| "dashed"
		| "ghost"
		| "dim"
		| "link"
		| "foreground"
		| "inverse";
}

export function LanguageSelector({
	locales,
	currentLocale = "en",
	showFlagNames = true,
	variant = "default",
	size = "icon",
	onLocaleChange,
	className,
	triggerVariant = "outline",
	iconClassName = "h-[1.2rem] w-[1.2rem]",
}: LanguageSelectorProps) {
	const handleLocaleChange = (locale: string) => {
		onLocaleChange?.(locale);
	};

	const currentLocaleData = locales.find(
		(locale) => locale.code === currentLocale,
	);

	if (variant === "compact") {
		return (
			<Button
				variant="outline"
				size={size}
				className={className}
				onClick={() => {
					// Cycle through locales
					if (locales.length === 0) return;
					const currentIndex = locales.findIndex(
						(locale) => locale.code === currentLocale,
					);
					const nextIndex = (currentIndex + 1) % locales.length;
					handleLocaleChange(locales[nextIndex]?.code as string);
				}}
			>
				{showFlagNames && currentLocaleData?.flag && (
					<span className="mr-1">{currentLocaleData.flag}</span>
				)}
				{size !== "icon" && (
					<span>
						{currentLocaleData?.nativeName ||
							currentLocaleData?.label ||
							currentLocale?.toUpperCase()}
					</span>
				)}
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button className={className} variant={triggerVariant} size={size}>
					<Globe className={iconClassName} />
					{size !== "icon" && currentLocaleData && (
						<>
							{showFlagNames && currentLocaleData.flag && (
								<span className="mr-1">{currentLocaleData.flag}</span>
							)}
							<span className="hidden sm:inline">
								{currentLocaleData.nativeName || currentLocaleData.label}
							</span>
						</>
					)}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				{locales.map((locale) => (
					<DropdownMenuItem
						key={locale.code}
						onClick={() => handleLocaleChange(locale.code)}
						disabled={locale.code === currentLocale}
					>
						{showFlagNames && locale.flag && (
							<span className="mr-2">{locale.flag}</span>
						)}
						<span className="mr-2">{locale.nativeName || locale.label}</span>
						<span className="text-muted-foreground text-xs">
							{locale.label !== locale.nativeName && locale.nativeName
								? `(${locale.label})`
								: ""}
						</span>
						{locale.code === currentLocale && (
							<span className="ml-auto text-muted-foreground">✓</span>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
