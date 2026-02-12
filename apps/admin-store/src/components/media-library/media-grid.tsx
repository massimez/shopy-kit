"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { ChevronLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMediaFolders } from "@/hooks/use-media-folders";
import { useMediaLibrary } from "@/hooks/use-media-library";
import { deleteFile, type MediaFile, moveFile } from "@/lib/storage";
import { FolderItem } from "./folder-item";
import { MediaItem } from "./media-item";

interface MediaGridProps {
	onSelect?: (files: MediaFile[]) => void;
	multiple?: boolean;
	initialSelection?: MediaFile[];
	search?: string;
	folderId?: string | null;
	onFolderChange?: (folderId: string | null) => void;
}

export function MediaGrid({
	onSelect,
	multiple = false,
	initialSelection = [],
	search,
	folderId,
	onFolderChange,
}: MediaGridProps) {
	const queryClient = useQueryClient();
	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
		useMediaLibrary({ limit: 24, search, folderId });

	const { folders, deleteFolder } = useMediaFolders(folderId);

	const [selectedFiles, setSelectedFiles] =
		useState<MediaFile[]>(initialSelection);
	const [fileToMove, setFileToMove] = useState<MediaFile | null>(null);
	const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
	const [isMoving, setIsMoving] = useState(false);

	// Sync internal state if initialSelection changes
	useEffect(() => {
		setSelectedFiles(initialSelection);
	}, [initialSelection]);

	const handleSelect = (file: MediaFile) => {
		let newSelection: MediaFile[];
		if (multiple) {
			const isSelected = selectedFiles.some((f) => f.id === file.id);
			if (isSelected) {
				newSelection = selectedFiles.filter((f) => f.id !== file.id);
			} else {
				newSelection = [...selectedFiles, file];
			}
		} else {
			newSelection = [file];
		}

		setSelectedFiles(newSelection);
		onSelect?.(newSelection);
	};

	const handleDelete = async (file: MediaFile) => {
		if (!confirm(`Delete ${file.fileKey.split("/").pop()}?`)) {
			return;
		}

		try {
			await deleteFile(file.fileKey);
			toast.success("File deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["media-library"] });
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete file",
			);
		}
	};

	const handleMoveClick = (file: MediaFile) => {
		setFileToMove(file);
		setTargetFolderId(file.folderId || null);
	};

	const handleMoveConfirm = async () => {
		if (!fileToMove) return;

		setIsMoving(true);
		try {
			await moveFile(fileToMove.fileKey, targetFolderId);
			toast.success("File moved successfully");
			queryClient.invalidateQueries({ queryKey: ["media-library"] });
			setFileToMove(null);
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : "Failed to move file",
			);
		} finally {
			setIsMoving(false);
		}
	};

	if (isLoading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			</div>
		);
	}

	const hasFiles = data?.pages.some((page) => page.data.length > 0);
	const hasFolders = folders.length > 0;

	return (
		<>
			<div className="space-y-3">
				{/* Back button if in subfolder */}
				{folderId && (
					<div className="flex items-center pb-1">
						<Button
							variant="ghost"
							size="sm"
							className="h-8 gap-1 pl-0 text-xs hover:bg-transparent hover:text-primary"
							onClick={() => onFolderChange?.(null)} // TODO: Handle proper back navigation to parent
						>
							<ChevronLeft className="h-3.5 w-3.5" />
							Back to Root
						</Button>
					</div>
				)}

				<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
					{/* Rendering Folders */}
					{folders.map((folder) => (
						<FolderItem
							key={folder.id}
							folder={folder}
							onSelect={() => onFolderChange?.(folder.id)}
							onDelete={(f) => {
								if (confirm(`Delete folder ${f.name}?`)) {
									deleteFolder(f.id);
								}
							}}
						/>
					))}

					{/* Rendering Files */}
					{data?.pages.map((page) =>
						page.data.map((file: MediaFile) => (
							<MediaItem
								key={file.id}
								file={file}
								selected={selectedFiles.some((f) => f.id === file.id)}
								onSelect={() => handleSelect(file)}
								onDelete={handleDelete}
								onMove={handleMoveClick}
							/>
						)),
					)}
				</div>

				{hasNextPage && (
					<div className="flex justify-center py-3">
						<Button
							variant="outline"
							size="sm"
							onClick={() => fetchNextPage()}
							disabled={isFetchingNextPage}
						>
							{isFetchingNextPage ? (
								<>
									<Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
									Loading...
								</>
							) : (
								"Load More"
							)}
						</Button>
					</div>
				)}

				{!isLoading && !hasFiles && !hasFolders && (
					<div className="flex h-48 flex-col items-center justify-center text-muted-foreground text-sm">
						<p>
							{search
								? "No files found matching your search."
								: "No files or folders found."}
						</p>
					</div>
				)}
			</div>

			{/* Move File Dialog */}
			<Dialog open={!!fileToMove} onOpenChange={() => setFileToMove(null)}>
				<DialogContent>
					<DialogTitle>Move File</DialogTitle>
					<div className="space-y-4 py-4">
						<p className="text-muted-foreground text-sm">
							Select a destination folder for{" "}
							<span className="font-medium text-foreground">
								{fileToMove?.fileKey.split("/").pop()}
							</span>
						</p>
						<div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
							{/* Root folder option */}
							<button
								type="button"
								onClick={() => setTargetFolderId(null)}
								className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted ${
									targetFolderId === null
										? "border-primary bg-primary/10"
										: "border-border"
								}`}
							>
								<div className="text-muted-foreground text-xs">Root</div>
							</button>
							{/* Available folders */}
							{folders.map((folder) => (
								<button
									key={folder.id}
									type="button"
									onClick={() => setTargetFolderId(folder.id)}
									className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted ${
										targetFolderId === folder.id
											? "border-primary bg-primary/10"
											: "border-border"
									}`}
								>
									<div className="truncate text-xs">{folder.name}</div>
								</button>
							))}
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setFileToMove(null)}
							disabled={isMoving}
						>
							Cancel
						</Button>
						<Button onClick={handleMoveConfirm} disabled={isMoving}>
							{isMoving ? "Moving..." : "Move"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
