import { Button } from '@/components/ui/button'
import { useAction, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { PricingCard } from './pricing-card'

export function PricingContainer() {
    const { isSignedIn } = useAuth();
    const user = useQuery(api.users.getUserInfo);
    const upgrade = useAction(api.stripe.pay);
    const billingPortal = useAction(api.stripe.billingPortal);
    const router = useRouter();

    const handleUpgrade = async (plan: "pro" | "premium") => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        const url = await upgrade({ plan });
        if (url) {
            router.push(url);
        }
    }

    const handleBillingPortal = async () => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        const url = await billingPortal();
        if (url) {
            router.push(url);
        }
    }

    return (
        <section className="py-16"
            style={{
                backgroundImage: "url('/img/background2.svg')",
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
            >
            <div className="mx-auto max-w-[140rem] px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Pricing</h1>
                    <p>Choose the plan that best fits your needs</p>
                </div>

                {user?.subscriptionId && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            variant="outline"
                            className="mt-4 w-fit cursor-pointer"
                            onClick={handleBillingPortal}

                        >
                            Manage subscription
                        </Button>
                    </div>
                )}

                <div className="mx-auto max-w-[80rem] mt-8 grid gap-6 md:mt-12 md:grid-cols-4">
                    <PricingCard
                        plan={{
                            name: "Free",
                            price: "$0 USD",
                            description: "For a quick presentation",
                            features: [
                                '2 presentations',
                                '4 versions of your presentations',
                                'Unlimited templates',
                                'User community'
                            ],
                            buttonText: user?.plan === "free" ? "Current plan" : "Get started",
                            buttonVariant: "outline",
                            onButtonClick: () => { },
                            isDisabled: user?.plan === "free" || user?.plan === "pro" || user?.plan === "premium"
                        }}
                    />

                    <PricingCard
                        plan={{
                            name: "Pro",
                            price: "$7 USD",
                            description: "For passionate creators",
                            features: [
                                'Everything in the free plan',
                                'Weekly call with businesses', 
                                'Participate in weekly voting',
                                '10 presentations per month',
                                '30 versions per presentation',
                                'Unlimited templates',
                                'Priority support',
                                'Export to Power Point and Google Slides'
                            ],
                            
                            buttonText: user?.plan === "pro" ? "Current plan" : "Get started",
                            onButtonClick: () => handleUpgrade('pro'),
                            buttonVariant: "outline",
                            isDisabled: user?.plan === "pro"
                        }}
                    />

                    <PricingCard
                        plan={{
                            name: "Premium",
                            description: "For presentations lovers",
                            price: "20 USD",
                            
                            features: [
                                'Everything in the pro plan',
                                '35 presentations per month',
                                'Unlimited versions per presentations',
                                'Export to Power Point and Google Slides'
                            ],
                            buttonText: user?.plan === "premium" ? "Current plan" : "Get started",
                            isPopular: true,
                            buttonVariant:"gradient",
                            onButtonClick: () => handleUpgrade('premium'),
                            isDisabled: user?.plan === "premium"
                        }}
                    />
                    <PricingCard
                        plan={{
                            name: "Premium",
                            price: "49 USD",
                            description: "For agencies",
                            features: [
                                'Everything in the premium plan',
                                'Unlimited presentations',
                                'Personalized templates',
                                'Unlimited versions of your presentations',
                                'Export to Power Point and Google Slides'
                            ],
                            buttonText: user?.plan === "premium" ? "Current plan" : "Get started",
                            buttonVariant: "outline",
                            onButtonClick: () => handleUpgrade('premium'),
                            isDisabled: user?.plan === "premium"
                        }}
                    />
                </div>
            </div>
        </section>
    )
}