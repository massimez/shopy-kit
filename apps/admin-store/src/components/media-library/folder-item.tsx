"use client";

import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { Folder, MoreVertical, Trash2 } from "lucide-react";
import type { StorageFolder } from "@/lib/storage";

interface FolderItemProps {
	folder: StorageFolder;
	onSelect: (folder: StorageFolder) => void;
	onDelete?: (folder: StorageFolder) => void;
}

export function FolderItem({ folder, onSelect, onDelete }: FolderItemProps) {
	return (
		<div className="group relative aspect-square">
			<button
				type="button"
				className="flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
				onClick={() => onSelect(folder)}
			>
				{/* Icon Area - Flex 1 */}
				<div className="flex w-full flex-1 flex-col items-center justify-center bg-linear-to-br from-muted/10 to-muted/5 p-3 transition-colors group-hover:from-muted/20 group-hover:to-muted/10">
					<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-blue-50 to-blue-100/50 text-blue-500 shadow-sm transition-transform duration-300 group-hover:scale-110 dark:from-blue-900/20 dark:to-blue-900/10 dark:text-blue-400">
						<Folder className="h-6 w-6 fill-current" />
					</div>
				</div>

				{/* Footer Info - Compact design */}
				<div className="flex w-full shrink-0 flex-col gap-0.5 border-t bg-background/95 px-2 py-1.5 text-start backdrop-blur-sm">
					<span
						className="w-full truncate font-medium text-[11px] text-foreground leading-tight"
						title={folder.name}
					>
						{folder.name}
					</span>
					<span className="text-[9px] text-muted-foreground/60 uppercase tracking-wide">
						Folder
					</span>
				</div>
			</button>

			{onDelete && (
				<div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover:opacity-100">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="h-6 w-6 rounded-full bg-background/95 shadow-md backdrop-blur-sm hover:bg-background hover:shadow-lg"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreVertical className="h-3.5 w-3.5" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="text-xs">
							<DropdownMenuItem
								className="text-destructive focus:text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onDelete(folder);
								}}
							>
								<Trash2 className="mr-2 h-3.5 w-3.5" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
}
