"use client";

import {
	APIProvider,
	Map as GoogleMap,
	useMap,
	useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Crosshair, MapPin, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { envData } from "@/env";
import type { Address } from "../cart/checkout/types";

interface MapAddressSelectorProps {
	onSelect: (address: Address) => void;
	defaultLocation?: { lat: number; lng: number };
}

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 }; // New York

export function MapAddressSelector({
	onSelect,
	defaultLocation,
}: MapAddressSelectorProps) {
	const apiKey = envData.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

	if (!apiKey) {
		return (
			<div className="flex h-[500px] items-center justify-center rounded-xl border-2 border-dashed bg-muted/30">
				<p className="text-muted-foreground">Google Maps API key is missing.</p>
			</div>
		);
	}

	return (
		<APIProvider apiKey={apiKey}>
			<MapContent onSelect={onSelect} defaultLocation={defaultLocation} />
		</APIProvider>
	);
}

function MapContent({ onSelect, defaultLocation }: MapAddressSelectorProps) {
	const map = useMap();
	const placesLib = useMapsLibrary("places");
	const geocodingLib = useMapsLibrary("geocoding");

	const [inputValue, setInputValue] = useState("");
	const [predictionResults, setPredictionResults] = useState<
		google.maps.places.AutocompletePrediction[]
	>([]);
	const [isSearching, setIsSearching] = useState(false);

	useEffect(() => {
		if (defaultLocation) {
			// Default location logic
		} else {
			// Try to get user's current location
			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						const pos = {
							lat: position.coords.latitude,
							lng: position.coords.longitude,
						};
						// Just pan, onIdle will handle geocoding
						map?.panTo(pos);
					},
					() => {
						// Error or permission denied, stick to default
					},
				);
			}
		}
	}, [defaultLocation, map]);

	// Don't need sync effect anymore if we rely on map center

	// Autocomplete search
	useEffect(() => {
		if (!placesLib || !inputValue) {
			setPredictionResults([]);
			return;
		}

		const service = new placesLib.AutocompleteService();
		service.getPlacePredictions(
			{ input: inputValue },
			(predictions, status) => {
				if (
					status === google.maps.places.PlacesServiceStatus.OK &&
					predictions
				) {
					setPredictionResults(predictions);
				} else {
					setPredictionResults([]);
				}
			},
		);
	}, [inputValue, placesLib]);

	const handleIdle = () => {
		if (!map) return;
		const center = map.getCenter();
		if (center) {
			const pos = { lat: center.lat(), lng: center.lng() };
			// Debounce? onIdle is already somewhat debounced (fires at end of interaction)
			geocodePosition(pos);
		}
	};

	const geocodePosition = async (pos: google.maps.LatLngLiteral) => {
		if (!geocodingLib) return;

		const geocoder = new geocodingLib.Geocoder();
		try {
			const response = await geocoder.geocode({ location: pos });
			if (response.results[0]) {
				const result = response.results[0];
				const addressComponents = result.address_components;

				const getComponent = (type: string, useShortName = false) => {
					const component = addressComponents.find((c) =>
						c.types.includes(type),
					);
					return useShortName
						? component?.short_name || ""
						: component?.long_name || "";
				};

				const address: Address = {
					street:
						`${getComponent("street_number")} ${getComponent("route")}`.trim(),
					city:
						getComponent("locality") ||
						getComponent("sublocality") ||
						getComponent("administrative_area_level_2"),
					state: getComponent("administrative_area_level_1"),
					country: getComponent("country", true),
					postalCode: getComponent("postal_code"),
					lat: pos.lat,
					lng: pos.lng,
				};

				onSelect(address);
				setInputValue(result.formatted_address);
			}
		} catch (error) {
			console.error("Geocoding failed:", error);
			// toast.error("Could not find address for this location");
		}
	};

	const handlePredictionSelect = (placeId: string) => {
		if (!placesLib || !geocodingLib) return;

		const geocoder = new geocodingLib.Geocoder();
		geocoder.geocode({ placeId }, (results, status) => {
			if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
				const result = results[0];
				const location = result.geometry.location;
				const pos = { lat: location.lat(), lng: location.lng() };

				// Just pan, let onIdle handle geocoding
				map?.panTo(pos);
				map?.setZoom(17);
				setInputValue(result.formatted_address);
				setPredictionResults([]);
				setIsSearching(false);
			}
		});
	};

	return (
		<div className="space-y-4">
			<div className="relative h-[550px] w-full overflow-hidden rounded-xl">
				{/* Search Input Overlay */}
				<div className="absolute top-1 right-4 left-4 z-10">
					<div className="relative rounded-md bg-background/30">
						<Input
							value={inputValue}
							onChange={(e) => {
								setInputValue(e.target.value);
								setIsSearching(true);
							}}
							onFocus={() => setIsSearching(true)}
							onBlur={() => setTimeout(() => setIsSearching(false), 200)}
							placeholder="Search for an address..."
							className="rounded-md pl-10 font-bold backdrop-blur-xs"
						/>
						<Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 z-50 h-4 w-4 text-muted-foreground" />
					</div>

					{isSearching && predictionResults.length > 0 && (
						<div className="absolute top-full z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md">
							{predictionResults.map((prediction) => (
								<button
									key={prediction.place_id}
									className="flex w-full flex-col items-start px-4 py-2 text-left text-sm hover:bg-muted/50"
									onClick={() => handlePredictionSelect(prediction.place_id)}
								>
									<span className="font-medium">
										{prediction.structured_formatting.main_text}
									</span>
									<span className="text-muted-foreground text-xs">
										{prediction.structured_formatting.secondary_text}
									</span>
								</button>
							))}
						</div>
					)}
				</div>

				<GoogleMap
					defaultZoom={15}
					defaultCenter={DEFAULT_CENTER}
					gestureHandling={"greedy"}
					disableDefaultUI={true}
					onIdle={handleIdle}
					className="h-full w-full"
				/>

				{/* Center Pin Overlay */}
				<div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-1/2 pb-8">
					<MapPin className="h-8 w-8 fill-background text-primary drop-shadow-md" />
				</div>

				<Button
					size="icon"
					variant="secondary"
					className="absolute right-4 bottom-4 shadow-md"
					onClick={() => {
						if (!navigator.geolocation) {
							toast.error("Geolocation is not supported by your browser");
							return;
						}

						toast.promise(
							new Promise((resolve, reject) => {
								navigator.geolocation.getCurrentPosition(
									(position) => {
										const pos = {
											lat: position.coords.latitude,
											lng: position.coords.longitude,
										};
										if (map) {
											map.panTo(pos);
											map.setZoom(17);
											resolve("Location found");
										} else {
											reject("Map not ready");
										}
									},
									(error) => {
										console.error("Geolocation error:", error);
										reject(error);
									},
									{ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 },
								);
							}),
							{
								loading: "Getting your location...",
								success: "Location updated",
								error: "Could not get your location. Please check permissions.",
							},
						);
					}}
					type="button"
				>
					<Crosshair className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
