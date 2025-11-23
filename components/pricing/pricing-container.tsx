import { Button } from '@/components/ui/button'
import { useAction, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { PricingCard } from './pricing-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useState, useEffect } from 'react'

export function PricingContainer() {
    const { isSignedIn } = useAuth();
    const user = useQuery(api.users.getUserInfo);
    const upgrade = useAction(api.stripe.pay);
    const billingPortal = useAction(api.stripe.billingPortal);
    const router = useRouter();
    const [billingType, setBillingType] = useState<'monthly' | 'annual'>('annual');
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleUpgrade = async (plan: "pro" | "premium" | "ultra") => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        const url = await upgrade({ plan, billingType });
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
        <section className="-mb-10">
            <div className="bg-gradient-to-t from-[#F5F5FA] from-10% to-white to-70% pb-2 pt-10">
                <div className="mx-auto max-w-[140rem] px-6">
                    <div className="mx-auto max-w-4xl space-y-6 text-center mb-8">
                        <h1 className="text-center text-4xl font-semibold lg:text-5xl">Choose the plan that best fits your needs</h1>
                        {user?.subscriptionId && (
                            <div className="flex justify-center">
                                <Button
                                    variant="outline"
                                    className="w-fit cursor-pointer"
                                    onClick={handleBillingPortal}
                                >
                                    Manage subscription
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {!user?.subscriptionId && (
                    <div className="w-full flex justify-center mb-1">
                        <Tabs value={billingType} onValueChange={(value) => setBillingType(value as 'monthly' | 'annual')} className="w-fit">
                            <TabsList className="grid w-full bg-transparent shadow-none border-0 grid-cols-2 gap-2">
                            <TabsTrigger value="monthly" className="rounded-sm rounded-b-none shadow-none border-0 text-xl p-2 data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-[#CE2B25] data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-400 data-[state=inactive]:shadow-none data-[state=inactive]:border-t data-[state=inactive]:border-l data-[state=inactive]:border-r data-[state=inactive]:border-gray-200 px-8">Pay Monthly</TabsTrigger> 
                                <TabsTrigger value="annual" className="rounded-sm rounded-b-none shadow-none border-0 text-xl p-2 data-[state=active]:bg-white data-[state=active]:shadow-none data-[state=active]:border-t-2 data-[state=active]:border-l-2 data-[state=active]:border-r-2 data-[state=active]:border-[#CE2B25] data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-400 data-[state=inactive]:shadow-none data-[state=inactive]:border-t data-[state=inactive]:border-l data-[state=inactive]:border-r data-[state=inactive]:border-gray-200 px-8">Pay Annually</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>
                )}
            </div>

            <div className="w-full bg-white pb-8 py-12"
                style={{
                    backgroundImage: isMobile ? "url('/img/bg-phone.png')" : "url('/img/bg-pricing.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: isMobile ? "fixed" : "none"
                    
                }}
            >
                
                <div className="text-center mb-6 -mt-6">
                    <span className="text-green-600 font-semibold">Save up to 28%</span>
                    <span className="text-black ml-1 font-semibold">with annual billing</span>
                </div>
                
                <div className="mx-auto max-w-[80rem] px-6 grid gap-6 md:grid-cols-4 pb-6 px-12"
                >
                    <PricingCard
                        billingType={billingType}
                        plan={{
                            name: "Free",
                            monthlyPrice: "$0",
                            annualPrice: "$0",
                            description: "For a quick presentation",
                            features: [
                                '2 presentations per month',
                                '5 versions per presentation',
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
                        billingType={billingType}
                        plan={{
                            name: "Pro",
                            monthlyPrice: "$7",
                            annualPrice: "$5",
                            description: "For passionate creators",
                            features: [
                                '10 presentations per month',
                                '20 versions per presentation',
                                'Unlimited templates',
                                'Priority support',
                                'Export to Power Point'
                            ],

                            buttonText: user?.plan === "pro" ? "Current plan" : "Get started",
                            onButtonClick: () => handleUpgrade('pro'),
                            buttonVariant: "outline",
                            isDisabled: user?.plan === "pro"
                        }}
                    />

                    <PricingCard
                        billingType={billingType}
                        plan={{
                            name: "Premium",
                            description: "For presentations lovers",
                            monthlyPrice: "$20",
                            annualPrice: "$14",

                            features: [
                                '35 presentations per month',
                                'Unlimited versions per presentation',
                                'Unlimited templates',
                                'Priority support',
                                'Export to Power Point'
                            ],
                            buttonText: user?.plan === "premium" ? "Current plan" : "Get started",
                            isPopular: true,
                            buttonVariant:"gradient",
                            onButtonClick: () => handleUpgrade('premium'),
                            isDisabled: user?.plan === "premium"
                        }}
                    />
                    <PricingCard
                        billingType={billingType}
                        plan={{
                            name: "Ultra",
                            monthlyPrice: "$49",
                            annualPrice: "$35",
                            description: "For agencies",
                            features: [
                                'Create your own templates',
                                'Unlimited presentations per month',
                                'Unlimited versions per presentation',
                                'Unlimited templates',
                                'Priority support',
                                'Export to Power Point',
                                'Access to new features',
                                
                            ],
                            buttonText: user?.plan === "ultra" ? "Current plan" : "Get started",
                            buttonVariant: "outline",
                            onButtonClick: () => handleUpgrade('ultra'),
                            isDisabled: user?.plan === "ultra"
                        }}
                    />
                </div>
            </div>
        </section>
    )
}