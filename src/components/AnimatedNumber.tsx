'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedNumberProps {
    value: number;
    className?: string;
    suffix?: string;
    prefix?: string;
}

// Single digit with slide animation
function AnimatedDigit({ digit, direction }: { digit: string; direction: 1 | -1 }) {
    return (
        <span className="relative inline-block overflow-hidden" style={{ width: digit === '.' ? '0.3em' : '0.75em', height: '1.3em' }}>
            <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                    key={digit}
                    initial={{ y: direction * 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -direction * 20, opacity: 0 }}
                    transition={{
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                        duration: 0.3
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {digit}
                </motion.span>
            </AnimatePresence>
        </span>
    );
}

export function AnimatedNumber({ value, className = '', suffix = '', prefix = '' }: AnimatedNumberProps) {
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    const direction = value >= prevValue ? 1 : -1;

    useEffect(() => {
        setPrevValue(displayValue);
        // Small delay to trigger animation
        const timer = setTimeout(() => {
            setDisplayValue(value);
        }, 50);
        return () => clearTimeout(timer);
    }, [value]);

    const digits = String(displayValue).split('');

    return (
        <span className={`inline-flex items-center ${className}`}>
            {prefix}
            {digits.map((digit, i) => (
                <AnimatedDigit key={`${i}-${digit}`} digit={digit} direction={direction} />
            ))}
            {suffix}
        </span>
    );
}
