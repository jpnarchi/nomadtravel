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
        <section className="">
            <div className="bg-gradient-to-t from-[#F5F5FA] from-10% to-white to-70% pb-2 pt-10">
                <div className="mx-auto max-w-[140rem] px-6">
                    <div className="mx-auto max-w-7xl space-y-6 text-center mb-8">
                        <h1 className="text-center text-4xl font-semibold lg:text-5xl font-[family-name:var(--font-ppmori-semibold)]">Choose the plan that best fits your needs</h1>
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

            <div className="w-full bg-white pb-8 py-12 bg-gradient-to-t from-[#F4A7B6]/30 from-10% to-primary/90 to-99% relative overflow-hidden">

            {/* Imágenes decorativas - Detrás de las tarjetas */}
            {/* Imagen izquierda - Solo visible en desktop */}
            {/* <img
                src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIujywkLOXp1zcDUfrCqNGaIx5LkJ9gbPMjRn6"
                alt="Decorative left"
                className="hidden lg:block absolute left-0 top-0 w-32 xl:w-40 h-auto opacity-80 mt-20 z-0"
            />

            
            <img
                src="https://jtz6kmagvp.ufs.sh/f/CE5PYDsI3GDIT9jM2zUlgOP8WXqRbDcys6iZYpKNLMvldaEF"
                alt="Decorative right"
                className="hidden lg:block absolute right-0 bottom-0 w-32 xl:w-60 h-auto opacity-80 mb-10 transform scale-x-[-1] z-0"
            /> */}

                <div className="text-center mb-6 -mt-6 relative z-10">
                    <span className="text-white font-semibold">Save up to 28%</span>
                    <span className="text-white ml-1 font-semibold">with annual billing</span>
                </div>
                
                <div className="mx-auto max-w-[80rem] px-6 grid gap-6 md:grid-cols-4 pb-6 px-12 relative z-10"
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
                                '20 presentations per month',
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