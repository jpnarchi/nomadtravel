"use client"

import { motion } from "framer-motion"

const howItWorksSteps = [
    {
        id: 1,
        image: "/step1.png",
        title: "Describe Your Presentation",
        description: "Tell us what you want to present and we'll help you create it"
    },
    {
        id: 2,
        image: "/step2.png",
        title: "AI Creates Your Slides",
        description: "Our AI generates professional slides based on your input"
    },
    {
        id: 3,
        image: "/step3.png",
        title: "Export & Present",
        description: "Download your presentation and share it with your audience"
    }
]

export function HowSection() {
    return (
        <div className="w-full py-16 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="max-w-7xl mx-auto"
            >
                <h2 className="text-black text-3xl sm:text-4xl md:text-5xl font-inter font-bold flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center mb-12">
                    How It Works
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {howItWorksSteps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                            className="flex flex-col bg-white rounded-lg shadow-sm overflow-hidden"
                        >
                            {/* Image Section - Top Half */}
                            <div className="w-full flex items-center justify-center">
                                <img
                                    src={step.image}
                                    alt={step.title}
                                    className="w-full h-full object-contain"
                                />
                            </div>

                            {/* Text Section - Bottom Half */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                <h3 className="text-black text-xl font-semibold mb-3">
                                    {step.title}
                                </h3>
                                <p className="text-gray-600 text-base">
                                    {step.description}
                                </p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
};