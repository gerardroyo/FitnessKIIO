'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Trash2 } from 'lucide-react';

interface SwipeableRowProps {
    children: React.ReactNode;
    onDelete: () => void;
    threshold?: number;
    disabled?: boolean;
}

export function SwipeableRow({ children, onDelete, threshold = 100, disabled = false }: SwipeableRowProps) {
    const x = useMotionValue(0);
    const deleteOpacity = useTransform(x, [-threshold, -50, 0], [1, 0.5, 0]);
    const deleteScale = useTransform(x, [-threshold, -50, 0], [1, 0.8, 0.5]);

    const handleDragEnd = (_: any, info: PanInfo) => {
        if (!disabled && info.offset.x < -threshold) {
            onDelete();
        }
    };

    return (
        <div className="relative overflow-hidden rounded-xl">
            {/* Delete background */}
            <motion.div
                className="absolute inset-y-0 right-0 w-24 bg-red-500/20 flex items-center justify-center"
                style={{ opacity: deleteOpacity }}
            >
                <motion.div style={{ scale: deleteScale }}>
                    <Trash2 className="text-red-500" size={24} />
                </motion.div>
            </motion.div>

            {/* Swipeable content */}
            <motion.div
                drag={disabled ? false : "x"}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={{ left: 0.5, right: 0 }}
                onDragEnd={handleDragEnd}
                style={{ x }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="relative bg-[var(--color-surface)] rounded-xl touch-pan-y"
            >
                {children}
            </motion.div>
        </div>
    );
}
