"use client";

import { useState, useEffect, useRef } from "react";

const PLACEHOLDER_VARIANTS = [
    "I want a presentation for my startup...",
    "Create a sales pitch deck...",
    "Build a product roadmap presentation...",
    "Design a business proposal...",
    "Make a quarterly review presentation...",
];

const TYPING_SPEED = 100; // ms per character
const ERASING_SPEED = 50; // ms per character
const PAUSE_BEFORE_ERASING = 2000; // ms to pause before erasing
const PAUSE_BEFORE_TYPING = 500; // ms to pause before typing next variant

export function useTypingPlaceholder() {
    const [placeholder, setPlaceholder] = useState("");
    const [variantIndex, setVariantIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [charIndex, setCharIndex] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        const currentVariant = PLACEHOLDER_VARIANTS[variantIndex];

        if (isTyping) {
            // Typing phase
            if (charIndex < currentVariant.length) {
                timeoutRef.current = setTimeout(() => {
                    setPlaceholder(currentVariant.slice(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                }, TYPING_SPEED);
            } else {
                // Finished typing, pause before erasing
                timeoutRef.current = setTimeout(() => {
                    setIsTyping(false);
                }, PAUSE_BEFORE_ERASING);
            }
        } else {
            // Erasing phase
            if (charIndex > 0) {
                timeoutRef.current = setTimeout(() => {
                    setPlaceholder(currentVariant.slice(0, charIndex - 1));
                    setCharIndex(charIndex - 1);
                }, ERASING_SPEED);
            } else {
                // Finished erasing, move to next variant
                timeoutRef.current = setTimeout(() => {
                    setVariantIndex((variantIndex + 1) % PLACEHOLDER_VARIANTS.length);
                    setIsTyping(true);
                }, PAUSE_BEFORE_TYPING);
            }
        }

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [charIndex, isTyping, variantIndex]);

    return placeholder;
}
