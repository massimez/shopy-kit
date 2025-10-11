import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { hc } from "@/lib/api-client";

export function useDeleteProductCategory(selectedLanguage: string) {
	const queryClient = useQueryClient();

	const { mutate: deleteCategory, isPending: isDeletingCategory } = useMutation(
		{
			mutationFn: async (categoryId: string) => {
				const res = await hc.api.store["product-categories"][":id"].$delete({
					param: { id: categoryId },
				});

				return res.json();
			},
			onSuccess: () => {
				toast.success("Product category deleted successfully!");
				queryClient.invalidateQueries({
					queryKey: ["product-categories", selectedLanguage],
				});
			},
			onError: (error) => {
				toast.error(error.message);
			},
		},
	);

	return { deleteCategory, isDeletingCategory };
}
