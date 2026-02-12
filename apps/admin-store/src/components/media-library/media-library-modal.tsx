"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@workspace/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogTitle,
	DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { FolderPlus, ImagePlus, Search } from "lucide-react";
import { useState } from "react";
import { UploadZone } from "@/components/file-upload/upload-zone";
import { useEntityImageUpload } from "@/hooks/use-entity-image-upload";
import type { FileMetadata } from "@/hooks/use-file-upload";
import { useMediaFolders } from "@/hooks/use-media-folders";
import type { MediaFile } from "@/lib/storage";
import { MediaGrid } from "./media-grid";

interface MediaLibraryModalProps {
	onSelect: (files: FileMetadata[]) => void;
	multiple?: boolean;
	children?: React.ReactNode;
}

export function MediaLibraryModal({
	onSelect,
	multiple,
	children,
}: MediaLibraryModalProps) {
	const [open, setOpen] = useState(false);
	const [selectedFiles, setSelectedFiles] = useState<MediaFile[]>([]);
	const [search, setSearch] = useState("");
	const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
	const [newFolderName, setNewFolderName] = useState("");
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);

	const queryClient = useQueryClient();
	const { createFolder, isCreating } = useMediaFolders(currentFolderId);

	// Use existing upload hook for the Upload tab
	const { stateImages, actions } = useEntityImageUpload({
		folderId: currentFolderId,
		onUpdateImages: async () => {
			// After successful upload...
			// 1. Invalidate library query so the new image appears
			await queryClient.invalidateQueries({ queryKey: ["media-library"] });
			// 2. Clear upload state
			actions.clearFiles();
		},
	});

	const handleConfirm = () => {
		const mapped: FileMetadata[] = selectedFiles.map((f) => ({
			key: f.fileKey,
			url: f.publicUrl,
			name: f.fileKey.split("/").pop() || "unknown",
			size: f.size || 0,
			type: f.contentType || "application/octet-stream",
		}));
		onSelect(mapped);
		setOpen(false);
		setSelectedFiles([]);
	};

	const handleOpenChange = (isOpen: boolean) => {
		setOpen(isOpen);
		if (!isOpen) {
			// Reset state on close
			setSelectedFiles([]);
			setSearch("");
			setCurrentFolderId(null);
		}
	};

	const handleCreateFolder = async () => {
		if (!newFolderName.trim()) return;
		await createFolder(
			{ name: newFolderName, parentId: currentFolderId },
			{
				onSuccess: () => {
					setNewFolderName("");
					setIsCreateFolderOpen(false);
				},
			},
		);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				{children || (
					<Button variant="outline" type="button">
						<ImagePlus className="mr-2 h-4 w-4" />
						Select Image
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="flex h-dvh w-screen max-w-none flex-col gap-0 p-0 sm:h-[85vh] sm:w-full sm:max-w-5xl sm:rounded-xl">
				<div className="flex items-center justify-between border-b bg-linear-to-r from-background to-muted/20 px-5 py-3.5">
					<DialogTitle className="text-base">Media Library</DialogTitle>
				</div>

				<div className="flex flex-1 flex-col overflow-hidden">
					<div className="flex-1 overflow-hidden">
						<div className="m-0 flex h-full flex-col">
							<div className="flex items-center justify-between gap-3 border-b bg-background/95 px-5 py-3 backdrop-blur supports-backdrop-filter:bg-background/60">
								<div className="relative flex-1 md:max-w-sm">
									<Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										placeholder="Search files..."
										className="h-9 border-none bg-muted/50 pl-9 text-sm shadow-none focus-visible:ring-1"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
									/>
								</div>
								<div className="flex items-center gap-2">
									<Dialog
										open={isCreateFolderOpen}
										onOpenChange={setIsCreateFolderOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant="primary"
												size="sm"
												className="h-8 gap-1.5 text-xs"
											>
												<FolderPlus className="h-3.5 w-3.5" />
												New Folder
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[425px]">
											<DialogTitle>Create New Folder</DialogTitle>
											<div className="grid gap-4 py-4">
												<Input
													id="name"
													placeholder="Folder name"
													value={newFolderName}
													onChange={(e) => setNewFolderName(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === "Enter") handleCreateFolder();
													}}
												/>
											</div>
											<DialogFooter>
												<Button
													onClick={handleCreateFolder}
													disabled={isCreating || !newFolderName.trim()}
												>
													Create
												</Button>
											</DialogFooter>
										</DialogContent>
									</Dialog>
								</div>
							</div>

							{/* Media Grid */}
							<div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-5 dark:bg-zinc-900/50">
								<UploadZone state={stateImages} actions={actions} />
								<MediaGrid
									multiple={multiple}
									onSelect={setSelectedFiles}
									initialSelection={selectedFiles}
									search={search}
									folderId={currentFolderId}
									onFolderChange={setCurrentFolderId}
								/>
							</div>
						</div>
					</div>
				</div>

				<DialogFooter className="border-t bg-white p-3.5 dark:bg-zinc-950">
					<div className="flex w-full items-center justify-between">
						<div className="text-muted-foreground text-xs">
							{selectedFiles.length} file(s) selected
						</div>
						<div className="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onClick={handleConfirm}
								disabled={selectedFiles.length === 0}
							>
								Insert
							</Button>
						</div>
					</div>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
