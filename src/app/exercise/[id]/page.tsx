'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, type WorkoutSession, type Exercise, type SetEntry } from '@/lib/db';
import { useActiveSession } from '@/hooks/use-workout';
import { useLiveQuery } from 'dexie-react-hooks';
import { SetInputPanel } from '@/components/SetInputPanel';
import { ChevronLeft, MoreHorizontal, Timer, Edit2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileLayout } from '@/components/MobileLayout';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ExercisePage({ params }: PageProps) {
    const router = useRouter();
    const session = useActiveSession();

    // Unwrap params using React.use()
    const { id } = use(params);
    const exerciseId = parseInt(id);

    const exercise = useLiveQuery(() => db.exercises.get(exerciseId), [exerciseId]);

    if (!session || !exercise) return null; // Loading or Invalid

    return (
        <MobileLayout>
            <ExerciseDetailLogic session={session} exercise={exercise} router={router} />
        </MobileLayout>
    );
}

function ExerciseDetailLogic({ session, exercise, router }: { session: WorkoutSession, exercise: Exercise, router: any }) {
    // State for Sets
    const entry = session.entries.find(e => e.exerciseId === exercise.id);
    const [sets, setSets] = useState<SetEntry[]>([]);

    // Timer State
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Fetch Previous History
    const previousSessionData = useLiveQuery(async () => {
        const lastSession = await db.sessions
            .where('state').equals('completed')
            .reverse()
            .filter(s => s.entries.some(e => e.exerciseId === exercise.id))
            .first();

        if (!lastSession) return null;

        const entry = lastSession.entries.find(e => e.exerciseId === exercise.id);
        if (!entry) return null;

        // Calculate 1RM from best set
        const bestSet = entry.sets.reduce((best, current) => {
            const current1RM = current.weight * (1 + current.reps / 30);
            const best1RM = best ? best.weight * (1 + best.reps / 30) : 0;
            return current1RM > best1RM ? current : best;
        }, null as SetEntry | null);

        return {
            sets: entry.sets,
            bestSet: bestSet
                ? { weight: bestSet.weight, reps: bestSet.reps, oneRem: Math.round(bestSet.weight * (1 + bestSet.reps / 30)) }
                : null
        };
    }, [exercise.id]);

    // Initialize/Sync sets
    useEffect(() => {
        if (!entry || entry.sets.length === 0) {
            // Parse target reps range (e.g. "8-12" -> min: 8, max: 12)
            const [minRepsStr, maxRepsStr] = exercise.targetRepsRange.split('-');
            const minReps = parseInt(minRepsStr) || 8;
            const maxReps = parseInt(maxRepsStr) || minReps;

            // Initialize with Progressive Overload Logic
            const initialSets: SetEntry[] = Array.from({ length: exercise.targetSets }).map((_, i) => {
                const prevSet = previousSessionData?.sets[i];

                let targetWeight = 40; // Default
                let targetReps = minReps;

                if (prevSet) {
                    if (prevSet.reps >= maxReps && prevSet.isCompleted) {
                        // Progression: Increase weight, reset reps to min
                        targetWeight = prevSet.weight + 2.5;
                        targetReps = minReps;
                    } else {
                        // Stagnation: Keep weight, aim for max reps
                        targetWeight = prevSet.weight;
                        targetReps = maxReps;
                    }
                } else if (previousSessionData?.sets && previousSessionData.sets.length > 0) {
                    // If new set (more sets than last time), copy last known weight
                    const lastKnown = previousSessionData.sets[previousSessionData.sets.length - 1];
                    targetWeight = lastKnown.weight;
                    targetReps = minReps;
                }

                return {
                    setNumber: i + 1,
                    weight: targetWeight,
                    reps: targetReps,
                    completedAt: 0,
                    isCompleted: false
                };
            });

            setSets(initialSets);
        } else {
            setSets(entry.sets);
        }
    }, [entry, exercise, previousSessionData]);

    // Find active set (first uncompleted)
    const activeSetIndex = sets.findIndex(s => !s.isCompleted);
    const isAllCompleted = activeSetIndex === -1 && sets.length > 0;
    const currentSet = activeSetIndex !== -1 ? sets[activeSetIndex] : sets[sets.length - 1]; // fallback to last if done

    // Timer Tick
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isResting) {
            interval = setInterval(() => setRestTimer(t => t + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isResting]);

    const handleCompleteSet = async (weight: number, reps: number) => {
        if (activeSetIndex === -1) return; // All done

        const newSets = [...sets];
        newSets[activeSetIndex] = {
            ...newSets[activeSetIndex],
            weight,
            reps,
            completedAt: Date.now(),
            isCompleted: true
        };

        setSets(newSets);

        // Update DB
        const existingEntryIndex = session.entries.findIndex(e => e.exerciseId === exercise.id);
        const newEntry = { exerciseId: exercise.id, sets: newSets };

        let newEntries = [...session.entries];
        if (existingEntryIndex >= 0) {
            newEntries[existingEntryIndex] = newEntry;
        } else {
            newEntries.push(newEntry);
        }

        await db.sessions.update(session.id, { entries: newEntries });

        // Start Rest
        setRestTimer(0);
        setIsResting(true);
    };

    const handleAddSet = async () => {
        const lastSet = sets[sets.length - 1];
        const newSet: SetEntry = {
            setNumber: sets.length + 1,
            weight: lastSet ? lastSet.weight : 80,
            reps: lastSet ? lastSet.reps : 0,
            completedAt: 0,
            isCompleted: false
        };

        const newSets = [...sets, newSet];
        setSets(newSets);

        // Update DB
        const existingEntryIndex = session.entries.findIndex(e => e.exerciseId === exercise.id);
        const newEntry = { exerciseId: exercise.id, sets: newSets };

        let newEntries = [...session.entries];
        if (existingEntryIndex >= 0) {
            newEntries[existingEntryIndex] = newEntry;
        } else {
            newEntries.push(newEntry);
        }

        await db.sessions.update(session.id, { entries: newEntries });
    };

    const formatTime = (s: number) => {
        const mm = Math.floor(s / 60).toString().padStart(2, '0');
        const ss = (s % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)]">
            {/* Header */}
            <header className="flex items-center justify-between p-4 sticky top-0 bg-[var(--color-background)] z-10">
                <div className="flex items-center gap-2" onClick={() => router.back()}>
                    <ChevronLeft size={24} />
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-widest uppercase mb-1">DESCANSO</span>
                    <div className="flex items-center gap-2 text-[var(--color-primary)]">
                        <span className="text-2xl font-bold font-mono">{formatTime(restTimer)}</span>
                        <Timer size={16} className={isResting ? "animate-pulse" : ""} />
                    </div>
                </div>
                <MoreHorizontal onClick={() => router.push(`/stats/${exercise.id}`)} className="cursor-pointer" />
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-96">
                {/* Title */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-white mb-1">{exercise.name}</h1>
                    <p className="text-[var(--color-text-muted)] text-sm">{exercise.equipmentType} • {exercise.muscleGroup}</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[rgba(255,255,255,0.05)]">
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase mb-1">ANTERIOR</p>
                        <p className="text-lg font-bold">
                            {previousSessionData?.bestSet ? `${previousSessionData.bestSet.weight}kg x ${previousSessionData.bestSet.reps}` : '-'}
                        </p>
                    </div>
                    <div className="bg-[var(--color-surface)] p-3 rounded-xl border border-[rgba(255,255,255,0.05)]">
                        <p className="text-[10px] text-[var(--color-text-primary)] text-[var(--color-text-muted)] font-bold uppercase mb-1">1RM EST.</p>
                        <p className="text-lg font-bold text-[var(--color-primary)]">
                            {previousSessionData?.bestSet ? `${previousSessionData.bestSet.oneRem}kg` : '-'}
                        </p>
                    </div>
                </div>

                {/* Sets List */}
                <div className="space-y-3">
                    <div className="flex justify-between items-end mb-2">
                        <h3 className="text-lg font-bold">Series</h3>
                        <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-surface)] px-2 py-1 rounded-md">
                            {sets.filter(s => s.isCompleted).length} / {sets.length} Completadas
                        </span>
                    </div>

                    {sets.map((set, idx) => {
                        const isActive = idx === activeSetIndex;
                        const isDone = set.isCompleted;
                        // Retrieve previous set for display
                        const prevSet = previousSessionData?.sets[idx];

                        return (
                            <div
                                key={idx}
                                className={cn(
                                    "rounded-xl p-4 flex items-center justify-between border transition-all",
                                    isActive
                                        ? "border-[var(--color-primary)] bg-[rgba(0,255,128,0.05)] shadow-[0_0_15px_rgba(0,255,128,0.1)]"
                                        : isDone
                                            ? "border-transparent bg-[var(--color-surface)] opacity-80"
                                            : "border-dashed border-[#1f3a2f] bg-transparent opacity-50"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                                        isActive ? "bg-[var(--color-primary)] text-black" :
                                            isDone ? "bg-[#1f3a2f] text-[var(--color-primary)]" : "bg-[#1f3a2f] text-[var(--color-text-muted)]"
                                    )}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <p className={cn("font-bold", isDone && "text-[var(--color-text-muted)]")}>
                                            {isDone ? "Completado" : isActive ? "Serie Actual" : "Pendiente"}
                                        </p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {isDone
                                                ? `${set.weight} kg x ${set.reps} reps`
                                                : prevSet
                                                    ? `Anterior: ${prevSet.weight} kg x ${prevSet.reps}`
                                                    : `Objetivo: ${set.weight} kg x ${set.reps}`
                                            }
                                        </p>
                                    </div>
                                </div>

                                {isDone ? (
                                    <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                                        <Check size={14} className="text-black" strokeWidth={3} />
                                    </div>
                                ) : isActive && (
                                    <div className="w-8 h-8 bg-[var(--color-surface-hover)] rounded-lg flex items-center justify-center">
                                        <Edit2 size={16} />
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    <button
                        onClick={handleAddSet}
                        className="w-full py-3 rounded-xl border border-dashed border-[var(--color-primary)] text-[var(--color-primary)] font-bold flex items-center justify-center gap-2 hover:bg-[rgba(0,255,128,0.05)] active:scale-98 transition-transform"
                    >
                        <Plus size={20} />
                        Añadir Serie
                    </button>
                </div>
            </div>

            {/* Input Panel */}
            {!isAllCompleted && (
                <div className="fixed bottom-0 left-0 right-0 z-20">
                    <SetInputPanel
                        initialWeight={currentSet?.weight || 0}
                        initialReps={currentSet?.reps || 0}
                        onComplete={handleCompleteSet}
                    />
                </div>
            )}
        </div>
    );
}
