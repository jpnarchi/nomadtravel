import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export function SuggestionButtons({
    suggestions,
    onSuggestionClick
}: {
    suggestions: string[],
    onSuggestionClick: (suggestion: string) => void
}) {
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-wrap gap-2 pl-8">
            {suggestions.map((suggestion, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSuggestionClick(suggestion.trim())}
                        className="text-sm cursor-pointer"
                    >
                        {suggestion.trim()}
                    </Button>
                </motion.div>
            ))}
        </div>
    );
}