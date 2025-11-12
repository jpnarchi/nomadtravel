import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface PricingCardProps {
    plan: {
        name: string
        monthlyPrice: string
        annualPrice: string
        description: string
        features: string[]
        isPopular?: boolean
        buttonText: string
        buttonVariant?: "default" | "outline" | "gradient"
        onButtonClick: () => void
        isDisabled?: boolean
    }
    billingType: 'monthly' | 'annual'
}

export function PricingCard({ plan, billingType }: PricingCardProps) {
    const currentPrice = billingType === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
    const billingText = billingType === 'monthly' ? '/ billed monthly' : '/ month, billed annually';

    return (
        <Card className={`h-full flex flex-col ${plan.isPopular ? "relative border-2 border-[#E5332D]" : ""}`}>
            {plan.isPopular && (
                <span className="bg-gradient-to-r from-[#E5332D] via-[#db3f42] to-[#BD060A] bg-[length:200%_100%]  absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full px-3 py-1 text-xs font-medium text-white ring-offset-1 ring-offset-gray-950/5">
                    Most Popular
                </span>
            )}

            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <span className="my-4 block text-6xl font-bold">{currentPrice}</span>
                <CardDescription className="text-sm -mt-4">{billingText}</CardDescription>
                
                <Button
                    variant={plan.buttonVariant || "default"}
                    className="mt-6 w-full cursor-pointer h-11 rounded-4xl text-2sm"
                    onClick={plan.onButtonClick}
                    disabled={plan.isDisabled}
                >
                    {plan.buttonText}
                </Button>
            </CardHeader>

            <CardContent className="flex-1 space-y-6">
                <hr className="border-dashed" />
                <ul className="space-y-4 text-sm">
                    {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                            <Check className="size-4 mt-0.5 flex-shrink-0" />
                            <span className="leading-relaxed">{feature}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    )
}
