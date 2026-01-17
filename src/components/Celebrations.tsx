'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

interface CompletionCelebrationProps {
    show: boolean;
    onComplete?: () => void;
}

export function CompletionCelebration({ show, onComplete }: CompletionCelebrationProps) {
    return (
        <AnimatePresence onExitComplete={onComplete}>
            {show && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                    className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                >
                    {/* Pulse rings */}
                    <motion.div
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2.5, opacity: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className="absolute w-16 h-16 rounded-full border-4 border-[var(--color-primary)]"
                    />
                    <motion.div
                        initial={{ scale: 0.5, opacity: 1 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                        className="absolute w-16 h-16 rounded-full border-2 border-[var(--color-primary)]"
                    />

                    {/* Check icon */}
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                        className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-[rgba(0,255,128,0.4)]"
                    >
                        <Check className="text-black" size={32} strokeWidth={3} />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// Mini celebration for individual set completion
export function SetCompletePulse({ show }: { show: boolean }) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    exit={{}}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full bg-[var(--color-primary)]/30 pointer-events-none"
                />
            )}
        </AnimatePresence>
    );
}
