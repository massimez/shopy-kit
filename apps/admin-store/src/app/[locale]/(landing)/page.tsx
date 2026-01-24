import { Hammer } from "lucide-react";

export default function HomePage() {
	return (
		<div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
			<div className="mb-8 rounded-full bg-muted p-6">
				<Hammer className="h-12 w-12 text-primary" />
			</div>
			<h1 className="mb-4 font-bold text-4xl tracking-tight sm:text-6xl">
				Under Construction
			</h1>
		</div>
	);
}
