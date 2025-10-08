import { PricingCard } from "./pricing-card";
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { X } from 'lucide-react';
import { useEffect } from 'react';

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
                        <h2 className="text-3xl md:text-4xl font-semibold">Precios</h2>
                        <p className="text-muted-foreground text-base md:text-lg">
                            Escoge el plan que mejor se adapte a tus necesidades
                        </p>
                    </div>

                    <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <PricingCard
                            plan={{
                                name: "Gratis",
                                price: "$0 MXN / mes",
                                description: "Para testear",
                                features: [
                                    'Nerd limitado',
                                    'Plantillas limitadas',
                                    'Comunidad de usuarios'
                                ],
                                buttonText: user?.plan === "free" ? "Plan actual" : "Empezar",
                                buttonVariant: "outline",
                                onButtonClick: () => { },
                                isDisabled: user?.plan === "free" || user?.plan === "pro" || user?.plan === "premium"
                            }}
                        />

                        <PricingCard
                            plan={{
                                name: "Pro",
                                price: "$1,000 MXN / mes",
                                description: "Para negocios",
                                features: [
                                    'Todo lo del plan gratis',
                                    'Llamada semanal con negocios',
                                    'Seminario con expertos',
                                    'Participa en votación semanal',
                                    'Nerd ilimitado',
                                    'Plantillas ilimitadas',
                                    'Soporte prioritario',
                                    '2 Hostings'
                                ],
                                isPopular: true,
                                buttonText: user?.plan === "pro" ? "Plan actual" : "Empezar",
                                onButtonClick: () => handleUpgrade('pro'),
                                isDisabled: user?.plan === "pro"
                            }}
                        />

                        <PricingCard
                            plan={{
                                name: "Premium",
                                price: "$4,000 MXN / mes",
                                description: "Para agencias",
                                features: [
                                    'Todo lo del plan pro',
                                    'Llamada semanal con agencias',
                                    'Hostings ilimitados'
                                ],
                                buttonText: user?.plan === "premium" ? "Plan actual" : "Empezar",
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