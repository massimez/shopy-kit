"use client";

import type * as React from "react";
import { useIsMobile } from "../hooks/use-mobile";
import { cn } from "../lib/utils";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./dialog";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "./drawer";

interface ResponsiveModalProps {
	children: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
	title?: string;
	description?: string;
	trigger?: React.ReactNode;
	footer?: React.ReactNode;
	dialogClassName?: string;
	contentClassName?: string;
}

export function ResponsiveModal({
	children,
	open,
	onOpenChange,
	title,
	description,
	trigger,
	footer,
	dialogClassName,
	contentClassName,
}: ResponsiveModalProps) {
	const isDesktop = !useIsMobile();

	if (isDesktop) {
		return (
			<Dialog open={open} onOpenChange={onOpenChange}>
				{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
				<DialogContent className={dialogClassName}>
					{(title || description) && (
						<DialogHeader>
							{title && <DialogTitle>{title}</DialogTitle>}
							{description && (
								<DialogDescription>{description}</DialogDescription>
							)}
						</DialogHeader>
					)}
					<div className={cn("flex flex-col gap-4", contentClassName)}>
						{children}
					</div>
				</DialogContent>
			</Dialog>
		);
	}

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			{trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
			<DrawerContent>
				{(title || description) && (
					<DrawerHeader className="text-left">
						{title && <DrawerTitle>{title}</DrawerTitle>}
						{description && (
							<DrawerDescription>{description}</DrawerDescription>
						)}
					</DrawerHeader>
				)}
				<div className={cn("flex flex-col gap-4 px-4", contentClassName)}>
					{children}
				</div>
				{footer && <DrawerFooter className="pt-2">{footer}</DrawerFooter>}
			</DrawerContent>
		</Drawer>
	);
}
