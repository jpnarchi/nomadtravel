import { PricingCard } from "./pricing-card";
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export function PricingPopup({
    isOpen,
    onOpenChange,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
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

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onOpenChange(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onOpenChange]);

    // Prevent body scroll when open but allow modal scroll
    // useEffect(() => {
    //     if (isOpen) {
    //         const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    //         document.body.style.overflow = 'hidden';
    //         document.body.style.paddingRight = `${scrollbarWidth}px`;
    //     } else {
    //         document.body.style.overflow = '';
    //         document.body.style.paddingRight = '';
    //     }
    //     return () => {
    //         document.body.style.overflow = '';
    //         document.body.style.paddingRight = '';
    //     };
    // }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />

            {/* Modal */}
            <div className="relative bg-background rounded-lg shadow-2xl max-h-[90vh] overflow-y-auto w-[calc(100vw-2rem)] max-w-[1400px]">
                {/* Close button */}
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10"
                >
                    <X className="h-5 w-5" />
                    <span className="sr-only">Close</span>
                </button>

                {/* Content */}
                <div className="p-8 md:p-10 lg:p-12">
                    <div className="text-center space-y-3 mb-10">
                        <h2 className="text-3xl md:text-4xl font-semibold">Pricing</h2>
                        <p className="text-muted-foreground text-base md:text-lg">
                            Choose the plan that best fits your needs
                        </p>
                    </div>

                    {user?.subscriptionId && (
                        <div className="flex justify-center mb-8">
                            <Button
                                variant="outline"
                                className="w-fit cursor-pointer"
                                onClick={handleBillingPortal}
                            >
                                Manage subscription
                            </Button>
                        </div>
                    )}

                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
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
                                name: "Ultra",
                                price: "49 USD",
                                description: "For agencies",
                                features: [
                                    'Everything in the premium plan',
                                    'Unlimited presentations',
                                    'Create your own templates',
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
            </div>
        </div>
    )
}