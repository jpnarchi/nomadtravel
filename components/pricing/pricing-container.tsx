import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'
import { useAction, useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

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

        // const url = await upgrade({ plan });
        // if (url) {
        //     router.push(url);
        // }
    }

    const handleBillingPortal = async () => {
        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        // const url = await billingPortal();
        // if (url) {
        //     router.push(url);
        // }
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-medium">Gratis</CardTitle>

                            <span className="my-3 block text-2xl font-semibold">$0 MXN / mes</span>

                            <CardDescription className="text-sm">Para testear</CardDescription>
                            <Button
                                variant="outline"
                                className="mt-4 w-full cursor-pointer"
                                onClick={() => { }}
                                disabled={user?.plan === "free" || user?.plan === "pro" || user?.plan === "premium"}
                            >
                                {user?.plan === "free" ? "Plan actual" : "Empezar"}
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Nerd limitado', 'Plantillas limitadas', 'Comunidad de usuarios'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="relative">
                        <span className="bg-linear-to-br/increasing absolute inset-x-0 -top-3 mx-auto flex h-6 w-fit items-center rounded-full from-purple-400 to-amber-300 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-inset ring-white/20 ring-offset-1 ring-offset-gray-950/5">Popular</span>

                        <CardHeader>
                            <CardTitle className="font-medium">Pro</CardTitle>

                            <span className="my-3 block text-2xl font-semibold">$1,000 MXN / mes</span>

                            <CardDescription className="text-sm">Para negocios</CardDescription>

                            <Button
                                className="mt-4 w-full cursor-pointer"
                                onClick={() => handleUpgrade('pro')}
                                disabled={user?.plan === "pro"}
                            >
                                {user?.plan === "pro" ? "Plan actual" : "Empezar"}
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Todo lo del plan gratis', 'Llamada semanal con negocios', 'Seminario con expertos', 'Participa en votación semanal', 'Nerd ilimitado', 'Plantillas ilimitadas', 'Soporte prioritario', '2 Hostings'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-medium">Premium</CardTitle>

                            <span className="my-3 block text-2xl font-semibold">$4,000 MXN / mes</span>

                            <CardDescription className="text-sm">Para agencias</CardDescription>

                            <Button
                                variant="outline"
                                className="mt-4 w-full cursor-pointer"
                                onClick={() => handleUpgrade('premium')}
                                disabled={user?.plan === "premium"}
                            >
                                {user?.plan === "premium" ? "Plan actual" : "Empezar"}
                            </Button>
                        </CardHeader>

                        <CardContent className="space-y-4">
                            <hr className="border-dashed" />

                            <ul className="list-outside space-y-3 text-sm">
                                {['Todo lo del plan pro', 'Llamada semanal con agencias', 'Hostings ilimitados'].map((item, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2">
                                        <Check className="size-3" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}