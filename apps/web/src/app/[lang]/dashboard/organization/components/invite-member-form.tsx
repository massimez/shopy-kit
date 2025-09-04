"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";

const formSchema = z.object({
	email: z.email({
		message: "Please enter a valid email address.",
	}),
	role: z.enum(["admin", "member"], {
		message: "Please select a valid role.",
	}),
});

export function InviteMemberForm() {
	const t = useTranslations("common");
	const activeOrg = authClient.useActiveOrganization();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			role: "member",
		},
	});

	function onSubmit(values: z.infer<typeof formSchema>) {
		authClient.organization.inviteMember({
			email: values.email,
			organizationId: activeOrg.data?.id,
			role: values.role,
		});
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="flex flex-wrap gap-2"
			>
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem className="flex">
							<FormLabel className="sr-only">{t("email")}</FormLabel>
							<FormControl>
								<Input placeholder={t("email_address")} {...field} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="role"
					render={({ field }) => (
						<FormItem className="flex">
							<FormLabel className="sr-only">{t("role")}</FormLabel>
							<Select onValueChange={field.onChange} defaultValue={field.value}>
								<FormControl>
									<SelectTrigger>
										<SelectValue placeholder={"select_a_role"} />
									</SelectTrigger>
								</FormControl>
								<SelectContent>
									<SelectItem value="member">{t("member")}</SelectItem>
									<SelectItem value="admin">{t("admin")}</SelectItem>
								</SelectContent>
							</Select>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button type="submit">invite</Button>
			</form>
		</Form>
	);
}
