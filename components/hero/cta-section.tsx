"use client"
import { Crown, CircleCheckBig } from "lucide-react"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

export function CTASection() {
    const router = useRouter()

    return (
        <div className="w-full py-20 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto"
            >
                <div
                    className="grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden shadow-lg min-h-[500px]"
                    style={{ backgroundColor: '#FFF3D6' }}
                >
                    {/* Left Column - Text Content */}
                    <div className="flex flex-col justify-center p-10 md:p-14 lg:p-20">
                        <h2 className="text-black text-3xl md:text-4xl font-inter font-bold mb-6">
                            Get more with Premium
                        </h2>
                        <div className="space-y-4 text-black text-base md:text-lg">
                            <div className="flex items-start gap-3">
                                <CircleCheckBig className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                                <p>
                                    Get full access to unlimited presentations
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CircleCheckBig className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                                <p>
                                    Advanced AI features, custom templates, and priority support
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <CircleCheckBig className="text-green-500 w-6 h-6 flex-shrink-0 mt-1" />
                                <p>
                                    Export to multiple formats
                                </p>
                            </div>
                        </div>
                        <button
                            className="flex items-center gap-2 mt-8 bg-[#FFC233] text-black px-8 py-3 rounded-full font-semibold hover:bg-[#F09E04] transition-colors w-fit"
                            onClick={() => router.push('/pricing')}
                        >
                            <Crown className="w-5 h-5" />
                            Get Premium
                        </button>
                    </div>

                    {/* Right Column - Image */}
                    <div className="hidden lg:flex relative h-80 md:h-auto min-h-[600px]">
                        <img
                            src="/cta.png"
                            alt="Premium Features"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
