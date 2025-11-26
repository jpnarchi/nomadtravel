import Link from 'next/link'
import Image from 'next/image'
import { Twitter, Linkedin, Github, Instagram } from 'lucide-react'

const links = [
    {
        title: 'Home',
        href: '/',
    },
    {
        title: 'Pricing',
        href: '/pricing',
    },
    {
        title: 'Support',
        href: '/support',
    }
    // {
    //     title: 'Status',
    //     href: '/status',
    // },
]

const socialLinks = [
    {
        name: 'Twitter',
        href: 'https://twitter.com/ilovepresentations.io',
        icon: Twitter,
    },
    {
        name: 'LinkedIn',
        href: 'https://linkedin.com/company/ilovepresentations.io',
        icon: Linkedin,
    },
    {
        name: 'Instagram',
        href: 'https://instagram.com/ilovepresentations.io',
        icon: Instagram,
    },
    {
        name: 'Github',
        href: 'https://github.com/ilovepresentations.io',
        icon: Github,
    },
]

export function Footer() {
    return (
        <footer className="py-10 bg-white border-t">
            <div className="mx-auto px-6 max-w-7xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Logo - Left Side */}
                    <div className="flex items-start">
                        <Link href="/" className="flex items-center gap-2">
                            <Image
                                src="/logo.png"
                                alt="Logo"
                                width={94}
                                height={94}
                                priority
                            />
                        </Link>
                    </div>

                    {/* Right Side - Two Columns (starting from center) */}
                    <div className="flex flex-col sm:flex-row gap-8 md:gap-12">
                        {/* Column 1: Navigation Links & Copyright */}
                        <div className="flex flex-col gap-3">
                            {links.map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className="text-muted-foreground hover:text-primary text-sm duration-150">
                                    {link.title}
                                </Link>
                            ))}
                            <span className="text-muted-foreground text-xs mt-4">
                                © 2025 iLovePresentations, All rights reserved
                            </span>
                        </div>

                        {/* Column 2: Social Media */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-semibold text-foreground">Follow us</h3>
                            <div className="flex gap-4">
                                {socialLinks.map((social, index) => {
                                    const Icon = social.icon
                                    return (
                                        <Link
                                            key={index}
                                            href={social.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-muted-foreground hover:text-primary duration-150"
                                            aria-label={social.name}
                                        >
                                            <Icon className="w-5 h-5" />
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}