"use client";

import { FileIcon, ImageIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { useFileUpload } from "@/hooks/use-file-upload";
import { cn } from "@/lib/utils";

type GalleryViewerProps = {
	files: ReturnType<typeof useFileUpload>[0]["files"];
	className?: string;
	onRemove?: (id: string) => void;
};

export function GalleryViewer({
	files,
	onRemove,
	className,
}: GalleryViewerProps) {
	if (files.length === 0) return null;

	return (
		<div
			className={cn(
				"grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4",
				className,
			)}
		>
			{files.map((file) => (
				<Card
					key={file.id}
					className="group relative overflow-hidden rounded-2xl"
				>
					<CardContent className="p-0">
						{file.preview && file.file.type.startsWith("image/") ? (
							// biome-ignore lint/performance/noImgElement: <>
							<img
								src={file.preview}
								alt={file.file.name}
								className="h-32 w-full object-contain"
							/>
						) : file.preview ? (
							<div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
								<FileIcon className="mb-2 h-8 w-8" />
								<span className="truncate text-xs">{file.file.name}</span>
							</div>
						) : (
							<div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
								<ImageIcon className="mb-2 h-8 w-8" />
								<span className="truncate text-xs">{file.file.name}</span>
							</div>
						)}
					</CardContent>

					{onRemove && (
						<Button
							variant="destructive"
							size="icon"
							type="button"
							className="absolute top-2 right-2 transition group-hover:opacity-100 md:opacity-0"
							onClick={() => onRemove(file.id)}
						>
							<XIcon className="h-4 w-4" />
						</Button>
					)}
				</Card>
			))}
		</div>
	);
}
