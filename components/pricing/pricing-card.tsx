import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

interface PricingCardProps {
    plan: {
        name: string
        price: string
        description: string
        features: string[]
        isPopular?: boolean
        buttonText: string
        buttonVariant?: "default" | "outline"
        onButtonClick: () => void
        isDisabled?: boolean
    }
}

export function PricingCard({ plan }: PricingCardProps) {
    return (
        <Card className={`h-full flex flex-col ${plan.isPopular ? "relative" : ""}`}>
            {plan.isPopular && (
                <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">
                    Popular
                </span>
            )}

            <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold">{plan.name}</CardTitle>
                <span className="my-4 block text-3xl font-bold">{plan.price}</span>
                <CardDescription className="text-base">{plan.description}</CardDescription>
                <Button
                    variant={plan.buttonVariant || "default"}
                    className="mt-6 w-full cursor-pointer h-11"
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
