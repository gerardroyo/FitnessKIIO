'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkoutSession, Exercise, SetEntry } from '@/lib/db';
import { useActiveSession, useExercises } from '@/hooks/useFirestore';
import { getUserSessions, updateSession } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { SetInputPanel } from '@/components/SetInputPanel';
import { ChevronLeft, MoreHorizontal, Timer, Edit2, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileLayout } from '@/components/MobileLayout';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ConfirmModal } from '@/components/ConfirmModal';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function ExercisePage({ params }: PageProps) {
    const router = useRouter();
    const { session, loading: sessionLoading } = useActiveSession();
    const { exercises, loading: exercisesLoading } = useExercises();
    const { user } = useAuth();

    // Unwrap params using React.use()
    const { id } = use(params);
    const exerciseId = id; // string ID

    const exercise = exercises.find(e => String(e.id) === exerciseId);

    if (sessionLoading || exercisesLoading) return null; // Loading
    if (!session || !exercise) return null; // Invalid

    return (
        <MobileLayout>
            <ExerciseDetailLogic session={session} exercise={exercise} router={router} userId={user?.uid} />
        </MobileLayout>
    );
}

function ExerciseDetailLogic({ session, exercise, router, userId }: { session: WorkoutSession, exercise: Exercise, router: any, userId?: string }) {
    // State for Sets
    const entry = session.entries.find(e => String(e.exerciseId) === String(exercise.id));
    const [sets, setSets] = useState<SetEntry[]>([]);
    const [deleteSetIndex, setDeleteSetIndex] = useState<number | null>(null);

    // Timer State
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Fetch Previous History
    const [previousSessionData, setPreviousSessionData] = useState<{ sets: SetEntry[], bestSet: any } | null>(null);

    useEffect(() => {
        if (!userId) return;

        async function fetchHistory() {
            // Fetch last 20 sessions to find history
            const sessions = await getUserSessions(userId!, 20);
            const completedSessions = sessions
                .filter(s => s.state === 'completed')
                // Sort descending by completion time (if not already sorted by query)
                .sort((a, b) => (b.endTime || 0) - (a.endTime || 0));

            const lastSession = completedSessions.find(s =>
                s.entries.some(e => String(e.exerciseId) === String(exercise.id))
            );

            if (!lastSession) {
                setPreviousSessionData(null);
                return;
            }

            const entry = lastSession.entries.find(e => String(e.exerciseId) === String(exercise.id));
            if (!entry) return;

            // Calculate 1RM from best set
            const bestSet = entry.sets.reduce((best, current) => {
                const current1RM = current.weight * (1 + current.reps / 30);
                const best1RM = best ? best.weight * (1 + best.reps / 30) : 0;
                return current1RM > best1RM ? current : best;
            }, null as SetEntry | null);

            setPreviousSessionData({
                sets: entry.sets,
                bestSet: bestSet
                    ? { weight: bestSet.weight, reps: bestSet.reps, oneRem: Math.round(bestSet.weight * (1 + bestSet.reps / 30)) }
                    : null
            });
        }

        fetchHistory();
    }, [userId, exercise.id]);

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
    }, [JSON.stringify(entry), exercise, previousSessionData]); // Use stringify for deep compare of entry or just depend on entry.sets.length logic

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
        const existingEntryIndex = session.entries.findIndex(e => String(e.exerciseId) === String(exercise.id));
        const newEntry = { exerciseId: String(exercise.id), sets: newSets };

        let newEntries = [...session.entries];
        if (existingEntryIndex >= 0) {
            newEntries[existingEntryIndex] = newEntry;
        } else {
            newEntries.push(newEntry);
        }

        if (userId) {
            await updateSession(userId, String(session.id), { entries: newEntries });
        }

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
        const existingEntryIndex = session.entries.findIndex(e => String(e.exerciseId) === String(exercise.id));
        const newEntry = { exerciseId: String(exercise.id), sets: newSets };

        let newEntries = [...session.entries];
        if (existingEntryIndex >= 0) {
            newEntries[existingEntryIndex] = newEntry;
        } else {
            newEntries.push(newEntry);
        }

        if (userId) {
            await updateSession(userId, String(session.id), { entries: newEntries });
        }
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
                            <SwipeableRow
                                key={idx}
                                onDelete={() => setDeleteSetIndex(idx)}
                            >
                                <div
                                    onClick={isDone ? async () => {
                                        // Toggle completion off to edit
                                        const newSets = [...sets];
                                        newSets[idx] = { ...newSets[idx], isCompleted: false };
                                        setSets(newSets);
                                        // Update DB
                                        const existingEntryIndex = session.entries.findIndex(e => String(e.exerciseId) === String(exercise.id));
                                        const newEntry = { exerciseId: String(exercise.id), sets: newSets };
                                        let newEntries = [...session.entries];
                                        if (existingEntryIndex >= 0) newEntries[existingEntryIndex] = newEntry;
                                        if (userId) await updateSession(userId, String(session.id), { entries: newEntries });
                                    } : undefined}
                                    className={cn(
                                        "rounded-xl p-4 flex items-center justify-between border transition-all cursor-pointer bg-[var(--color-surface)]",
                                        isActive
                                            ? "border-[var(--color-primary)] bg-[rgba(0,255,128,0.05)] shadow-[0_0_15px_rgba(0,255,128,0.1)]"
                                            : isDone
                                                ? "border-transparent opacity-80"
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
                            </SwipeableRow>
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
            {/* Set Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteSetIndex !== null}
                onClose={() => setDeleteSetIndex(null)}
                onConfirm={async () => {
                    if (deleteSetIndex === null) return;
                    const newSets = sets.filter((_, i) => i !== deleteSetIndex);
                    setSets(newSets);

                    const existingEntryIndex = session.entries.findIndex(e => String(e.exerciseId) === String(exercise.id));
                    const newEntry = { exerciseId: String(exercise.id), sets: newSets };
                    let newEntries = [...session.entries];
                    if (existingEntryIndex >= 0) newEntries[existingEntryIndex] = newEntry;

                    if (userId) await updateSession(userId, String(session.id), { entries: newEntries });
                    setDeleteSetIndex(null);
                }}
                title="¿Eliminar serie?"
                message="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="warning"
            />
        </div>
    );
}
