import { useState, useEffect, useRef } from 'react';

export const useCountdown = (
    initialValue: number,
    isActive: boolean,
    onTick?: (value: number) => void
) => {
    const [count, setCount] = useState(initialValue);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTickRef = useRef<number>(Date.now());

    useEffect(() => {
        if (!isActive) {
            setCount(initialValue);
            return;
        }

        const tick = () => {
            const now = Date.now();
            const delta = Math.floor((now - lastTickRef.current) / 1000);

            if (delta >= 1) {
                setCount(prev => {
                    const next = Math.max(0, prev - delta);
                    if (onTick) onTick(next);
                    return next || initialValue;
                });
                lastTickRef.current = now;
            }

            timeoutRef.current = setTimeout(tick, 1000);
        };

        timeoutRef.current = setTimeout(tick, 1000);

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
        };
    }, [isActive, initialValue, onTick]);

    return count;
};
