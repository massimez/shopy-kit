"use client";

import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { LoaderIcon, UploadIcon } from "lucide-react";
import type { useFileUpload } from "@/hooks/use-file-upload";

type UploadZoneProps = {
	state: ReturnType<typeof useFileUpload>[0];
	actions: ReturnType<typeof useFileUpload>[1];
	isUploading?: boolean;
};

export function UploadZone({ state, actions }: UploadZoneProps) {
	const hasUploadingFiles = state.files.some((file) => file.isUploading);

	return (
		<div className="space-y-3">
			{/* Dropzone */}
			{/** biome-ignore lint/a11y/noStaticElementInteractions: <> */}
			{/** biome-ignore lint/a11y/useKeyWithClickEvents: <> */}
			<div
				onDragEnter={actions.handleDragEnter}
				onDragLeave={actions.handleDragLeave}
				onDragOver={actions.handleDragOver}
				onDrop={actions.handleDrop}
				className={`group relative flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-5 text-center transition-all duration-300 ${
					state.isDragging
						? "scale-[1.02] border-primary bg-linear-to-br from-primary/10 via-primary/5 to-transparent shadow-lg ring-2 ring-primary/20"
						: "border-muted-foreground/20 bg-linear-to-br from-muted/30 to-muted/10 hover:border-primary/40 hover:from-primary/5 hover:to-transparent hover:shadow-md"
				} ${hasUploadingFiles ? "pointer-events-none opacity-60" : ""}`}
				onClick={hasUploadingFiles ? undefined : actions.openFileDialog}
			>
				<input {...actions.getInputProps({ className: "hidden" })} />
				{hasUploadingFiles ? (
					<>
						<div className="relative">
							<div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
							<LoaderIcon className="relative h-8 w-8 animate-spin text-primary" />
						</div>
						<p className="mt-3 font-medium text-muted-foreground text-sm">
							Uploading...
						</p>
					</>
				) : (
					<>
						<div className="mb-2 rounded-full bg-linear-to-br from-primary/10 to-primary/5 p-2.5 shadow-sm ring-1 ring-primary/10 transition-transform duration-300 group-hover:scale-110 group-hover:shadow-md">
							<UploadIcon className="h-5 w-5 text-primary/80" />
						</div>
						<div className="space-y-0.5">
							<p className="font-semibold text-foreground text-sm">
								Drop files or click to upload
							</p>
							<p className="text-muted-foreground text-xs">
								SVG, PNG, JPG or GIF (max. 4MB)
							</p>
						</div>
					</>
				)}
			</div>

			{/* Errors */}
			{state.errors.length > 0 && (
				<Alert variant="destructive" className="py-2">
					<AlertDescription className="text-xs">
						<ul className="list-disc space-y-0.5 pl-4">
							{state.errors.map((err) => (
								<li key={err}>{err}</li>
							))}
						</ul>
					</AlertDescription>
				</Alert>
			)}
		</div>
	);
}
