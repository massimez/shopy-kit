import { useDefaultLocation } from "./use-storefront";

/**
 * Hook to get the default location ID for adding items to cart
 * Returns the location ID or null if not available
 */
export function useDefaultLocationId() {
	const { data: defaultLocation, isLoading } = useDefaultLocation();

	return {
		locationId: defaultLocation?.id || null,
		defaultLocation,
		isLoading,
	};
}
