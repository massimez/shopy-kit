import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@workspace/ui/components/card";
import {
	CreditCard,
	Headphones,
	Lock,
	RotateCcw,
	Shield,
	Star,
	Truck,
} from "lucide-react";
import { useTranslations } from "next-intl";

const advantages = [
	{
		icon: Shield,
		titleKey: "productGuaranteeTitle",
		descriptionKey: "productGuaranteeDescription",
	},
	{
		icon: Truck,
		titleKey: "freeDeliveryTitle",
		descriptionKey: "freeDeliveryDescription",
	},
	{
		icon: RotateCcw,
		titleKey: "easyRefundsTitle",
		descriptionKey: "easyRefundsDescription",
	},
	{
		icon: Lock,
		titleKey: "securePaymentsTitle",
		descriptionKey: "securePaymentsDescription",
	},
	{
		icon: CreditCard,
		titleKey: "paymentOnDeliveryTitle",
		descriptionKey: "paymentOnDeliveryDescription",
	},
	{
		icon: Star,
		titleKey: "bonusPointsTitle",
		descriptionKey: "bonusPointsDescription",
	},
	{
		icon: Headphones,
		titleKey: "support24Title",
		descriptionKey: "support24Description",
	},
];

export function WhyShopWithUs() {
	const t = useTranslations("Advantages");

	return (
		<section className="bg-background py-16">
			<div className="container mx-auto px-4">
				<h2 className="mb-12 text-center font-bold text-4xl">{t("title")}</h2>
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{advantages.map((advantage) => {
						const Icon = advantage.icon;
						return (
							<Card
								key={advantage.titleKey}
								className="text-center transition-shadow duration-300 hover:shadow-lg"
							>
								<CardHeader>
									<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
										<Icon size={32} />
									</div>
									<CardTitle className="text-xl">
										{t(advantage.titleKey)}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-muted-foreground">
										{t(advantage.descriptionKey)}
									</p>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</div>
		</section>
	);
}
