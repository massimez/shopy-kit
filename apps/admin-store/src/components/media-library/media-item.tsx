"use client";

import { Button } from "@workspace/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { cn } from "@workspace/ui/lib/utils";
import {
	Check,
	FileExclamationPoint,
	FolderInput,
	MoreVertical,
	Trash2,
} from "lucide-react";
import { useState } from "react";

import type { MediaFile } from "@/lib/storage";

interface MediaItemProps {
	file: MediaFile;
	selected?: boolean;
	onSelect?: () => void;
	onDelete?: (file: MediaFile) => void;
	onMove?: (file: MediaFile) => void;
}

export function MediaItem({
	file,
	selected,
	onSelect,
	onDelete,
	onMove,
}: MediaItemProps) {
	const [hasError, setHasError] = useState(false);
	const isImage = file.contentType?.startsWith("image/");
	// Derive filename from fileKey since it's not on the interface
	const fileName = file.fileKey.split("/").pop() || "unknown";
	const extension = fileName.split(".").pop()?.toUpperCase() || "FILE";

	const showImage = isImage && !hasError;
	const hasActions = onDelete || onMove;

	return (
		<div className="group relative aspect-square">
			<button
				type="button"
				className={cn(
					"flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
					selected &&
						"border-primary shadow-lg ring-2 ring-primary/20 ring-offset-1",
				)}
				onClick={onSelect}
			>
				{/* Preview Area - Flex 1 to fill available space */}
				<div className="relative w-full flex-1 overflow-hidden bg-linear-to-br from-muted/20 to-muted/5">
					{showImage ? (
						// biome-ignore lint/performance/noImgElement: <>
						<img
							src={file.publicUrl}
							alt={fileName}
							loading="lazy"
							className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
							onError={() => setHasError(true)}
						/>
					) : (
						<div className="flex h-full w-full flex-col items-center justify-center p-3">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br from-muted/60 to-muted/40 text-muted-foreground shadow-sm transition-transform duration-300 group-hover:scale-110">
								{isImage ? (
									<FileExclamationPoint className="h-6 w-6" />
								) : (
									<span className="font-bold text-[10px] uppercase tracking-wider">
										{extension}
									</span>
								)}
							</div>
						</div>
					)}

					{/* Selection Checkmark */}
					<div
						className={cn(
							"absolute top-1.5 left-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full border border-primary bg-primary text-primary-foreground opacity-0 shadow-md transition-all duration-200",
							selected && "scale-100 opacity-100",
							!selected &&
								"scale-90 group-hover:scale-100 group-hover:bg-background/90 group-hover:text-foreground group-hover:opacity-100",
						)}
					>
						<Check className="h-3 w-3" />
					</div>
				</div>

				{/* Footer Info - Compact design */}
				<div className="flex w-full shrink-0 flex-col gap-0.5 border-t bg-background/95 px-2 py-1.5 text-start backdrop-blur-sm">
					<span
						className="w-full truncate font-medium text-[11px] text-foreground leading-tight"
						title={fileName}
					>
						{fileName}
					</span>
					<div className="flex w-full items-center justify-between text-muted-foreground">
						<span className="font-semibold text-[9px] text-muted-foreground/60 uppercase tracking-wide">
							{extension}
						</span>
						<span className="text-[9px] tabular-nums opacity-60">
							{file.size ? `${(file.size / 1024).toFixed(0)}KB` : ""}
						</span>
					</div>
				</div>
			</button>

			{/* Hover Actions Menu */}
			{hasActions && (
				<div className="absolute top-1.5 right-1.5 z-20 opacity-0 transition-opacity group-hover:opacity-100">
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
							{onMove && (
								<DropdownMenuItem
									onClick={(e) => {
										e.stopPropagation();
										onMove(file);
									}}
								>
									<FolderInput className="mr-2 h-3.5 w-3.5" />
									Move to folder
								</DropdownMenuItem>
							)}
							{onDelete && (
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={(e) => {
										e.stopPropagation();
										onDelete(file);
									}}
								>
									<Trash2 className="mr-2 h-3.5 w-3.5" />
									Delete
								</DropdownMenuItem>
							)}
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			)}
		</div>
	);
}
