import Link from 'next/link'

const links = [
    {
        title: 'Precios',
        href: '#',
    },
    {
        title: 'Aprende',
        href: '#',
    },
    {
        title: 'Acerca de',
        href: '#',
    },
]

export function Footer() {
    return (
        <footer className="py-6">
            <div className="mx-auto px-6">
                <div className="flex flex-wrap justify-between gap-6">
                    <span className="text-muted-foreground order-last block text-center text-sm md:order-first">© {new Date().getFullYear()} Nerd.lat, Todos los derechos reservados</span>
                    <div className="order-first flex flex-wrap justify-center gap-6 text-sm md:order-last">
                        {links.map((link, index) => (
                            <Link
                                key={index}
                                href={link.href}
                                className="text-muted-foreground hover:text-primary block duration-150">
                                <span>{link.title}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    )
}