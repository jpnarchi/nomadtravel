import { useState, useEffect } from 'react';

export function useProgressiveMessage(
    messages: string[],
    interval: number = 2000,
    isActive: boolean = true,
    loop: boolean = false
) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (!isActive || messages.length === 0) {
            setCurrentIndex(0);
            return;
        }

        // Si ya estamos en el último mensaje y no queremos loop, no hacemos nada
        if (!loop && currentIndex >= messages.length - 1) {
            return;
        }

        const timer = setInterval(() => {
            setCurrentIndex((prevIndex) => {
                if (loop) {
                    // Loop through messages
                    return (prevIndex + 1) % messages.length;
                } else {
                    // Stop at the last message
                    return Math.min(prevIndex + 1, messages.length - 1);
                }
            });
        }, interval);

        return () => clearInterval(timer);
    }, [messages, interval, isActive, loop, currentIndex]);

    return messages[currentIndex] || messages[0];
}
