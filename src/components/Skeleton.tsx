'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <motion.div
            className={`bg-[#1f3a2f] rounded-lg ${className}`}
            animate={{
                opacity: [0.5, 1, 0.5],
            }}
            transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut'
            }}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-4">
            <Skeleton className="h-3 w-16 mb-2" />
            <Skeleton className="h-8 w-12" />
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-4">
            <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-4 w-32" />
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <Skeleton key={i} className="h-6 w-8 rounded-md" />
                    ))}
                </div>
            </div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
    );
}

export function HistoryItemSkeleton() {
    return (
        <div className="bg-[var(--color-surface)] rounded-xl p-4 flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="w-8 h-8 rounded-lg" />
        </div>
    );
}
