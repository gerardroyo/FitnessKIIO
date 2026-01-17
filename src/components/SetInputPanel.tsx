import { useState } from 'react';
import { Plus, Minus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SetInputPanelProps {
    initialWeight: number;
    initialReps: number;
    onComplete: (weight: number, reps: number) => void;
}

export function SetInputPanel({ initialWeight, initialReps, onComplete }: SetInputPanelProps) {
    const [weight, setWeight] = useState(initialWeight);
    const [reps, setReps] = useState(initialReps);
    const [isCompleted, setIsCompleted] = useState(false);

    // Chips values usually derived from context, hardcoded for MVP as per screenshot
    const chips = [60, 70, 80, 90, 100];

    const handleComplete = () => {
        setIsCompleted(true);
        // Delay callback slightly to show animation
        setTimeout(() => {
            onComplete(weight, reps);
            setIsCompleted(false); // Reset for next usage if component stays mounted
        }, 500);
    };

    return (
        <div className="bg-[var(--color-surface)] rounded-t-3xl p-6 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] border-t border-[rgba(255,255,255,0.05)] relative">
            {/* Weight & Reps Controls */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <ControlGroup
                    label="PESO (KG)"
                    value={weight}
                    onChange={setWeight}
                    step={2.5}
                    isFloat
                />
                <ControlGroup label="REPS" value={reps} onChange={setReps} step={1} />
            </div>

            {/* Complete Button */}
            <motion.button
                onClick={handleComplete}
                whileTap={{ scale: 0.9 }}
                animate={isCompleted ? {
                    scale: [1, 1.1, 1],
                    backgroundColor: ["var(--color-primary)", "#ffffff", "var(--color-primary)"],
                    transition: { duration: 0.4 }
                } : {}}
                className="w-full bg-[var(--color-primary)] text-black font-bold text-lg py-4 rounded-[var(--radius-button)] flex items-center justify-center gap-2 mb-6 shadow-[0_0_20px_rgba(0,255,128,0.25)] relative overflow-hidden"
            >
                <AnimatePresence mode="wait">
                    {!isCompleted ? (
                        <motion.div
                            key="text"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.15 } }}
                            className="flex items-center gap-2"
                        >
                            <Check strokeWidth={3} />
                            COMPLETAR SERIE
                        </motion.div>
                    ) : (
                        <motion.div
                            key="check"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="flex items-center gap-2"
                        >
                            <Check strokeWidth={4} size={32} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chips */}
            <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar">
                {chips.map(chip => (
                    <button
                        key={chip}
                        onClick={() => setWeight(chip)}
                        className={cn(
                            "px-4 py-2 rounded-lg font-bold min-w-[60px]",
                            Math.abs(weight - chip) < 0.1
                                ? "bg-[var(--color-primary-dark)] text-black"
                                : "bg-[#1f3a2f] text-[var(--color-text-muted)]"
                        )}
                    >
                        {chip}kg
                    </button>
                ))}
            </div>
        </div>
    );
}

function ControlGroup({ label, value, onChange, step, isFloat }: any) {
    const inc = () => onChange((v: number) => isFloat ? +(v + step).toFixed(1) : v + step);
    const dec = () => onChange((v: number) => isFloat ? +(v - step).toFixed(1) : Math.max(0, v - step));

    return (
        <div className="bg-[#1f3a2f] rounded-xl p-1 flex items-center justify-between relative">
            <button onClick={dec} className="w-12 h-12 flex items-center justify-center text-white text-2xl active:opacity-70">
                <Minus size={20} />
            </button>
            <div className="text-center pt-2">
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-2xl font-bold bg-transparent text-white w-20">{value}</p>
            </div>
            <button onClick={inc} className="w-12 h-12 flex items-center justify-center text-white text-2xl active:opacity-70">
                <Plus size={20} />
            </button>
        </div>
    );
}

