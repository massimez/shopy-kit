"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createFolder, deleteFolder, listFolders } from "@/lib/storage";

export function useMediaFolders(parentId?: string | null) {
	const queryClient = useQueryClient();

	const foldersQuery = useQuery({
		queryKey: ["media-folders", { parentId }],
		queryFn: async () => {
			return listFolders(parentId);
		},
	});

	const createFolderMutation = useMutation({
		mutationFn: async ({
			name,
			parentId: pid,
		}: {
			name: string;
			parentId?: string | null;
		}) => {
			return createFolder(name, pid);
		},
		onSuccess: () => {
			toast.success("Folder created successfully");
			queryClient.invalidateQueries({ queryKey: ["media-folders"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to create folder",
			);
		},
	});

	const deleteFolderMutation = useMutation({
		mutationFn: async (id: string) => {
			return deleteFolder(id);
		},
		onSuccess: () => {
			toast.success("Folder deleted successfully");
			queryClient.invalidateQueries({ queryKey: ["media-folders"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to delete folder",
			);
		},
	});

	return {
		folders: foldersQuery.data ?? [],
		isLoading: foldersQuery.isLoading,
		isError: foldersQuery.isError,
		createFolder: createFolderMutation.mutate,
		isCreating: createFolderMutation.isPending,
		deleteFolder: deleteFolderMutation.mutate,
		isDeleting: deleteFolderMutation.isPending,
	};
}
