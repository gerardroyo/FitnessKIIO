'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Exercise } from '@/lib/db';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ExerciseListCardProps {
    exercise: Exercise;
    status: 'pending' | 'active' | 'completed';
    lastLog?: string;
    onClick: () => void;
}

export function ExerciseListCard({ exercise, status, lastLog, onClick }: ExerciseListCardProps) {
    const [justCompleted, setJustCompleted] = useState(false);
    const [prevStatus, setPrevStatus] = useState(status);

    // Detect when status changes to completed
    useEffect(() => {
        if (status === 'completed' && prevStatus !== 'completed') {
            setJustCompleted(true);
            const timer = setTimeout(() => setJustCompleted(false), 1000);
            return () => clearTimeout(timer);
        }
        setPrevStatus(status);
    }, [status, prevStatus]);

    return (
        <motion.div
            onClick={onClick}
            whileTap={{ scale: 0.97 }}
            animate={justCompleted ? {
                scale: [1, 1.02, 1],
                boxShadow: [
                    '0 0 0 0 rgba(0, 255, 128, 0)',
                    '0 0 20px 10px rgba(0, 255, 128, 0.3)',
                    '0 0 0 0 rgba(0, 255, 128, 0)'
                ]
            } : {}}
            transition={{ duration: 0.5 }}
            className={cn(
                "relative rounded-xl p-4 cursor-pointer border-l-4",
                status === 'active'
                    ? "bg-[var(--color-surface-hover)] border-[var(--color-primary)] shadow-lg"
                    : "bg-[var(--color-surface)] border-transparent"
            )}
        >
            {/* Celebration Pulse Ring */}
            {justCompleted && (
                <motion.div
                    initial={{ scale: 0.8, opacity: 1 }}
                    animate={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-xl border-2 border-[var(--color-primary)] pointer-events-none"
                />
            )}

            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    {/* Checkbox State */}
                    <motion.div
                        animate={justCompleted ? { rotate: [0, 10, -10, 0], scale: [1, 1.2, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                            status === 'completed' ? "bg-[var(--color-primary)] text-black" :
                                status === 'active' ? "border-2 border-[var(--color-text-muted)]" :
                                    "border-2 border-[#1f3a2f]"
                        )}>
                        {status === 'completed' && <Check size={18} strokeWidth={4} />}
                        {status === 'active' && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />}
                    </motion.div>

                    <div>
                        <h4 className={cn(
                            "font-bold text-lg mb-0.5",
                            status === 'completed' && "text-[var(--color-text-muted)] line-through"
                        )}>
                            {exercise.name}
                        </h4>
                        <p className="text-sm text-[var(--color-text-muted)]">
                            {exercise.targetSets} SERIES × {exercise.targetRepsRange} REPS
                        </p>
                    </div>
                </div>

                {lastLog && (
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase mb-0.5">ÚLTIMO</p>
                        <p className="text-sm font-bold text-[var(--color-primary)]">{lastLog}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

