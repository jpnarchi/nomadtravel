import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Check } from 'lucide-react'

export function PricingContainer() {
    return (
        <section className="py-16">
            <div className="mx-auto max-w-6xl px-6">
                <div className="mx-auto max-w-2xl space-y-6 text-center">
                    <h1 className="text-center text-4xl font-semibold lg:text-5xl">Precios</h1>
                    <p>Escoge el plan que mejor se adapte a tus necesidades</p>
                </div>

                <div className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-medium">Gratis</CardTitle>

                            <span className="my-3 block text-2xl font-semibold">$0 USD / mes</span>

                            <CardDescription className="text-sm">Para testear</CardDescription>
                            <Button
                                asChild
                                variant="outline"
                                className="mt-4 w-full">
                                <Link href="">Empezar</Link>
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

                            <span className="my-3 block text-2xl font-semibold">$49 USD / mes</span>

                            <CardDescription className="text-sm">Para negocios</CardDescription>

                            <Button
                                asChild
                                className="mt-4 w-full">
                                <Link href="">Empezar</Link>
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

                            <span className="my-3 block text-2xl font-semibold">$199 USD / mes</span>

                            <CardDescription className="text-sm">Para agencias</CardDescription>

                            <Button
                                asChild
                                variant="outline"
                                className="mt-4 w-full">
                                <Link href="">Empezar</Link>
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