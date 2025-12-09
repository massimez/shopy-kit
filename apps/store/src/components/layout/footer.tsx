"use client";

import { Button } from "@workspace/ui/components/button";
import { FacebookIcon } from "@workspace/ui/components/icons/brands/FacebookIcon";
import { TikTokIcon } from "@workspace/ui/components/icons/brands/TikTokIcon";
import { Input } from "@workspace/ui/components/input";
import {
	Facebook,
	Github,
	Instagram,
	InstagramIcon,
	Linkedin,
	LinkedinIcon,
	Mail,
	MapPin,
	Phone,
	Send,
	Twitter,
	XIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";

export function Footer() {
	const t = useTranslations("Footer");
	const [email, setEmail] = useState("");

	const handleNewsletterSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (email) {
			toast.success(t("newsletterSuccess"));
			setEmail("");
		}
	};

	const footerLinks = {
		shop: [
			{ href: "/category/", label: t("categories") },
			{ href: "/products?sort=newest", label: t("newArrivals") },
			{ href: "/products?sort=popular", label: t("bestSellers") },
		],
		company: [
			{ href: "/about", label: t("aboutUs") },
			{ href: "/contact", label: t("contactUs") },
		],
		support: [
			{ href: "/help", label: t("helpCenter") },
			{ href: "/shipping", label: t("shipping") },
			{ href: "/returns", label: t("returns") },
			{ href: "/faq", label: t("faq") },
		],
		legal: [
			{ href: "/privacy", label: t("privacy") },
			{ href: "/terms", label: t("terms") },
			{ href: "/cookies", label: t("cookies") },
		],
	};

	const socialLinks = [
		{
			icon: FacebookIcon,
			href: "#",
			label: "Facebook",
			color: "hover:text-blue-500",
		},
		{ icon: XIcon, href: "#", label: "Twitter", color: "hover:text-sky-700" },
		{
			icon: InstagramIcon,
			href: "#",
			label: "Instagram",
			color: "hover:text-pink-500",
		},
		{
			icon: LinkedinIcon,
			href: "#",
			label: "LinkedIn",
			color: "hover:text-blue-600",
		},
		{
			icon: TikTokIcon,
			href: "#",
			label: "Tiktok",
			color: "hover:text-blue-600",
		},
	];

	return (
		<footer className="relative mt-auto border-t bg-linear-to-b from-background to-muted/20">
			{/* Decorative gradient overlay */}
			<div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-secondary/5" />

			<div className="container relative mx-auto px-4 py-12 md:py-16">
				{/* Main Footer Content */}
				<div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8 xl:gap-12">
					{/* Brand Section */}
					<div className="lg:col-span-4">
						<Link href="/" className="mb-6 inline-block">
							<h2 className="bg-linear-to-r from-primary to-primary/60 bg-clip-text font-bold text-3xl text-transparent tracking-tight">
								STORE
							</h2>
						</Link>
						<p className="mb-8 max-w-sm text-muted-foreground leading-relaxed">
							{t("brandDescription")}
						</p>

						{/* Contact Info */}
						<div className="space-y-4">
							<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<MapPin className="h-4 w-4 shrink-0" />
								</div>
								<span className="font-medium text-sm">{t("address")}</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Phone className="h-4 w-4 shrink-0" />
								</div>
								<span className="font-medium text-sm">+1 (555) 123-4567</span>
							</div>
							<div className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground">
								<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
									<Mail className="h-4 w-4 shrink-0" />
								</div>
								<span className="font-medium text-sm">support@store.com</span>
							</div>
						</div>
						{/* Social Links */}
						<div className="mt-8 flex items-center gap-2">
							{socialLinks.map((social) => (
								<Button
									key={social.label}
									variant="outline"
									size="icon"
									className={cn(
										"hover:-translate-y-1 h-10 w-10 rounded-full border-muted-foreground/20 bg-background transition-all hover:border-primary/50 hover:shadow-md",
										social.color,
									)}
									asChild
								>
									<a
										href={social.href}
										target="_blank"
										rel="noopener noreferrer"
										aria-label={social.label}
									>
										<social.icon className="h-4 w-4" />
									</a>
								</Button>
							))}
						</div>
					</div>

					{/* Links Sections */}
					<div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:col-span-8 lg:pl-8">
						{/* Shop */}
						<div>
							<h3 className="mb-6 font-semibold text-foreground text-sm uppercase tracking-widest">
								{t("shop")}
							</h3>
							<ul className="space-y-4">
								{footerLinks.shop.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												{link.label}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Company */}
						<div>
							<h3 className="mb-6 font-semibold text-foreground text-sm uppercase tracking-widest">
								{t("company")}
							</h3>
							<ul className="space-y-4">
								{footerLinks.company.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												{link.label}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Support */}
						<div>
							<h3 className="mb-6 font-semibold text-foreground text-sm uppercase tracking-widest">
								{t("support")}
							</h3>
							<ul className="space-y-4">
								{footerLinks.support.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												{link.label}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h3 className="mb-6 font-semibold text-foreground text-sm uppercase tracking-widest">
								{t("legal")}
							</h3>
							<ul className="space-y-4">
								{footerLinks.legal.map((link) => (
									<li key={link.href}>
										<Link
											href={link.href}
											className="group flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-primary"
										>
											<span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-3" />
											<span className="transition-transform duration-300 group-hover:translate-x-1">
												{link.label}
											</span>
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>

				{/* Newsletter Section */}
				<div className="mt-12 border-t pt-8">
					<div className="mx-auto max-w-md">
						<h3 className="mb-2 text-center font-semibold text-foreground">
							{t("newsletterTitle")}
						</h3>
						<p className="mb-4 text-center text-muted-foreground text-sm">
							{t("newsletterDescription")}
						</p>
						<form onSubmit={handleNewsletterSubmit} className="flex gap-2">
							<Input
								type="email"
								placeholder={t("emailPlaceholder")}
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								className="flex-1"
							/>
							<Button type="submit" size="icon" className="shrink-0">
								<Send className="h-4 w-4" />
								<span className="sr-only">{t("subscribe")}</span>
							</Button>
						</form>
					</div>
				</div>

				{/* Bottom Section */}
				<div className="mt-12 flex flex-col items-center justify-center gap-4 border-t pt-8 md:flex-row">
					{/* Copyright */}
					<p className="text-center text-muted-foreground text-sm">
						© {new Date().getFullYear()} STORE. {t("allRightsReserved")}
					</p>
				</div>
			</div>
		</footer>
	);
}
