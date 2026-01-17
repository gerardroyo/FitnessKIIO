import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Exercise } from '@/lib/db';

interface ExerciseListCardProps {
    exercise: Exercise;
    status: 'pending' | 'active' | 'completed';
    lastLog?: string;
    onClick: () => void;
}

export function ExerciseListCard({ exercise, status, lastLog, onClick }: ExerciseListCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "relative rounded-xl p-4 transition-all active:scale-98 cursor-pointer border-l-4",
                status === 'active'
                    ? "bg-[var(--color-surface-hover)] border-[var(--color-primary)] shadow-lg"
                    : "bg-[var(--color-surface)] border-transparent"
            )}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    {/* Checkbox State */}
                    <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        status === 'completed' ? "bg-[var(--color-primary)] text-black" :
                            status === 'active' ? "border-2 border-[var(--color-text-muted)]" :
                                "border-2 border-[#1f3a2f]"
                    )}>
                        {status === 'completed' && <Check size={18} strokeWidth={4} />}
                        {status === 'active' && <div className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />}
                    </div>

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
                        {/* Hidden on very small screens if needed, but per design usually visible */}
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase mb-0.5">ÚLTIMO</p>
                        <p className="text-sm font-bold text-[var(--color-primary)]">{lastLog}</p>
                    </div>
                )}
            </div>

            {/* Mobile visible "Last" if needed, simplified for now */}
        </div>
    );
}
