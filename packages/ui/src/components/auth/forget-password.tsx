import { Button } from "@workspace/ui/components/button";
import {
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import type defaultTranslations from "./translations.json";

export const ForgetPassword = ({
	sentResetCode,
	openSignIn,
	translations,
}: {
	sentResetCode: (email: string) => Promise<void>;
	openSignIn: () => void;
	translations: typeof defaultTranslations.en.forgetPassword;
}) => {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	return (
		<div className="flex flex-col gap-6">
			<DialogHeader className="space-y-2 text-center">
				<DialogTitle className="font-semibold text-2xl">
					{translations.title}
				</DialogTitle>
			</DialogHeader>

			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="email" className="font-medium text-sm">
						{translations.email_label}
					</Label>
					<Input
						id="email"
						type="email"
						placeholder={translations.email_label}
						required
						onChange={(e) => {
							setEmail(e.target.value);
						}}
						value={email}
						className="h-12"
					/>
				</div>

				<Button
					type="submit"
					className="h-12 w-full font-medium text-base"
					disabled={loading}
					onClick={async () => {
						setLoading(true);
						await sentResetCode(email);
						setLoading(false);
					}}
				>
					{loading ? (
						<Loader2 size={20} className="animate-spin" />
					) : (
						translations.submit
					)}
				</Button>
			</div>

			<DialogFooter className="flex justify-center sm:justify-center">
				<div className="text-center text-sm">
					{translations.remember_password}{" "}
					<button
						type="button"
						className="font-medium underline hover:no-underline"
						onClick={() => openSignIn()}
					>
						{translations.sign_in}
					</button>
				</div>
			</DialogFooter>
		</div>
	);
};
