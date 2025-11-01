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
            <div className="mx-auto max-w-6xl px-6">
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

                <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3">
                    <PricingCard
                        plan={{
                            name: "Free",
                            price: "$0 MXN / month",
                            description: "For testing",
                            features: [
                                '1 project',
                                '4 versions of your project',
                                'Limited templates',
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
                            price: "$1,000 MXN / month",
                            description: "For businesses",
                            features: [
                                'Everything in the free plan',
                                'Weekly call with businesses',
                                'Seminars with experts',
                                'Participate in weekly voting',
                                'Unlimited projects',
                                '50 versions of your project',
                                'Unlimited templates',
                                'Priority support',
                                '2 Hostings'
                            ],
                            isPopular: true,
                            buttonText: user?.plan === "pro" ? "Current plan" : "Get started",
                            onButtonClick: () => handleUpgrade('pro'),
                            isDisabled: user?.plan === "pro"
                        }}
                    />

                    <PricingCard
                        plan={{
                            name: "Premium",
                            price: "$4,000 MXN / month",
                            description: "For agencies",
                            features: [
                                'Everything in the pro plan',
                                'Weekly call with agencies',
                                'Unlimited projects',
                                'Unlimited versions of your project',
                                'Unlimited hosting'
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