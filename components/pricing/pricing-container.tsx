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
        <section className="py-16">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Precios</h1>
                    <p>Escoge el plan que mejor se adapte a tus necesidades</p>
                </div>

                {user?.subscriptionId && (
                    <div className="mt-8 flex justify-center">
                        <Button
                            variant="outline"
                            className="mt-4 w-fit cursor-pointer"
                            onClick={handleBillingPortal}

                        >
                            Gestionar suscripción
                        </Button>
                    </div>
                )}

                <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3">
                    <PricingCard
                        plan={{
                            name: "Gratis",
                            price: "$0 MXN / mes",
                            description: "Para testear",
                            features: ['Nerd limitado', 'Plantillas limitadas', 'Comunidad de usuarios'],
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
                            features: ['Todo lo del plan gratis', 'Llamada semanal con negocios', 'Seminario con expertos', 'Participa en votación semanal', 'Nerd ilimitado', 'Plantillas ilimitadas', 'Soporte prioritario', '2 Hostings'],
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
                            features: ['Todo lo del plan pro', 'Llamada semanal con agencias', 'Hostings ilimitados'],
                            buttonText: user?.plan === "premium" ? "Plan actual" : "Empezar",
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