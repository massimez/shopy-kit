"use client";

import { Button } from "@workspace/ui/components/button";
import { LogOut, Settings, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSidebarProps extends React.HTMLAttributes<HTMLElement> {
	activeTab: string;
	onTabChange: (tab: string) => void;
	onLogout: () => void;
}

export function ProfileSidebar({
	className,
	activeTab,
	onTabChange,
	onLogout,
	...props
}: ProfileSidebarProps) {
	const items = [
		{
			id: "overview",
			title: "Overview",
			icon: User,
		},
		{
			id: "orders",
			title: "Orders",
			icon: ShoppingBag,
		},
		{
			id: "settings",
			title: "Settings",
			icon: Settings,
		},
	];

	return (
		<nav
			className={cn(
				"flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
				className,
			)}
			{...props}
		>
			{items.map((item) => (
				<Button
					key={item.id}
					variant={activeTab === item.id ? "secondary" : "ghost"}
					className={cn(
						"w-full justify-start",
						activeTab === item.id && "bg-muted hover:bg-muted",
					)}
					onClick={() => onTabChange(item.id)}
				>
					<item.icon className="mr-2 h-4 w-4" />
					{item.title}
				</Button>
			))}
			<Button
				variant="ghost"
				className="w-full justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
				onClick={onLogout}
			>
				<LogOut className="mr-2 h-4 w-4" />
				Logout
			</Button>
		</nav>
	);
}
