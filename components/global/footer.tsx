import Link from 'next/link'

const links = [
    {
        title: 'Pricing',
        href: '#',
    },
    {
        title: 'Learn',
        href: '#',
    },
    {
        title: 'About',
        href: '#',
    },
]

export function Footer() {
    return (
        <footer className="py-6">
            <div className="mx-auto px-6">
                <div className="flex flex-wrap justify-between gap-6">
                    <span className="text-muted-foreground order-last block text-center text-sm md:order-first">© {new Date().getFullYear()} Nerd.lat, All rights reserved</span>
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