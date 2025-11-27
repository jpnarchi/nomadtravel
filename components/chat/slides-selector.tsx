import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function SlideSelector({
    onSlideChange,
    userPlan
}: {
    onSlideChange: (numSlides: number) => void
    userPlan?: string
}) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedSlides, setSelectedSlides] = useState(5);

    // Determine if user has premium access (ultra, admin, or pro plans)
    const hasPremiumAccess = userPlan === 'ultra' || userPlan === 'admin' || userPlan === 'pro';

    const handleSlideSelect = (numSlides: number) => {
        // If user doesn't have premium and tries to select > 7 slides, don't allow
        if (!hasPremiumAccess && numSlides > 7) {
            return;
        }
        setSelectedSlides(numSlides);
        setDropdownOpen(false);
        onSlideChange(numSlides);
    };

    return (
        <div className="flex flex-wrap gap-2 -mb-2">
                <motion.div
                    key={1}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 * 0.1 }}
                    className="relative"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="text-sm cursor-pointer flex items-center gap-2 bg-white rounded-4xl"
                    >
                        Number of Slides: {selectedSlides}
                        <ChevronDown className="h-4 w-4" />
                    </Button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                        {dropdownOpen && (
                            <>
                                {/* Backdrop to close dropdown */}
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setDropdownOpen(false)}
                                />

                                {/* Menu */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute top-10 left-0 w-48 bg-white border border-zinc-200 rounded-lg shadow-xl z-50 overflow-hidden max-h-64 overflow-y-auto"
                                >
                                    <div className="py-1">
                                        {Array.from({ length: 15 }, (_, i) => i + 1).map((num) => {
                                            const isPremiumOnly = !hasPremiumAccess && num > 7;
                                            return (
                                                <button
                                                    key={num}
                                                    type="button"
                                                    onClick={() => handleSlideSelect(num)}
                                                    disabled={isPremiumOnly}
                                                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                                        isPremiumOnly
                                                            ? 'cursor-not-allowed opacity-60'
                                                            : 'hover:bg-zinc-100'
                                                    } ${
                                                        selectedSlides === num ? 'bg-zinc-100 text-primary font-medium' : 'text-zinc-700'
                                                    }`}
                                                >
                                                    <span>{num} {num === 1 ? 'Slide' : 'Slides'}</span>
                                                    {isPremiumOnly && (
                                                        <span className="bg-gradient-to-r from-[#E5332D] via-[#db3f42] to-[#BD060A] bg-[length:200%_100%] flex h-5 w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium text-white">
                                                            PRO
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </motion.div>

        </div>
    );
}