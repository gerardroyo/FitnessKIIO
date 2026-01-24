'use client';

import { WorkoutSession, Exercise } from '@/lib/db';
import { useExercises } from '@/hooks/useFirestore';
import { getSession } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { ArrowLeft, Clock, Dumbbell, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface SessionPageProps {
    params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [expandedExercise, setExpandedExercise] = useState<number | null>(null);
    const [session, setSession] = useState<WorkoutSession | null>(null);

    const { exercises } = useExercises();

    useEffect(() => {
        if (!user || !id) return;
        async function fetchSession() {
            const s = await getSession(user!.uid, id);
            setSession(s);
        }
        fetchSession();
    }, [user, id]);

    // Get all exercises used in this session using the hook data
    // Create a map for easy lookup
    const exerciseMap = new Map(exercises.map(e => [String(e.id), e]));

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">
                Cargando...
            </div>
        );
    }

    const durationMinutes = Math.floor((session.durationSeconds || 0) / 60);
    const hours = Math.floor(durationMinutes / 60);
    const mins = durationMinutes % 60;
    const durationText = hours > 0 ? `${hours}h ${mins}min` : `${mins} min`;
    const exerciseCount = session.entries.length;

    const totalVolume = session.entries.reduce((acc, entry) => {
        return acc + entry.sets.reduce((sAcc, set) => sAcc + (set.isCompleted ? set.weight * set.reps : 0), 0);
    }, 0);
    const totalSets = session.entries.reduce((acc, entry) => acc + entry.sets.filter(s => s.isCompleted).length, 0);

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">{session.name}</h1>
                    <div className="w-10" /> {/* Spacer */}
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Session Info */}
                <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
                    <p className="text-[var(--color-text-muted)] text-sm mb-4">
                        {new Date(session.startTime).toLocaleDateString(undefined, {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center">
                            <div className="flex items-center gap-2 text-[var(--color-primary)] mb-1">
                                <Clock size={18} />
                                <span className="text-2xl font-bold">{durationText}</span>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Duración</p>
                        </div>
                        <div className="flex flex-col items-center border-l border-[rgba(255,255,255,0.1)]">
                            <div className="flex items-center gap-2 text-[var(--color-primary)] mb-1">
                                <Dumbbell size={18} />
                                <span className="text-2xl font-bold">{exerciseCount}</span>
                            </div>
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Ejercicios</p>
                        </div>
                    </div>

                    {/* Notes Section */}
                    {session.notes && (
                        <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.1)]">
                            <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                                <FileText size={16} />
                                <span className="text-xs font-bold uppercase tracking-wider">Notas</span>
                            </div>
                            <p className="text-sm text-white/90 italic whitespace-pre-wrap">
                                "{session.notes}"
                            </p>
                        </div>
                    )}
                </div>

                {/* Exercises List */}
                <div>
                    <h2 className="text-lg font-bold mb-3">Ejercicios</h2>
                    <div className="space-y-3">
                        {session.entries.map((entry, idx) => {
                            const exercise = exerciseMap.get(String(entry.exerciseId));
                            const isExpanded = expandedExercise === idx;
                            const completedSets = entry.sets.filter(s => s.isCompleted);

                            return (
                                <div
                                    key={idx}
                                    className="bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)] overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedExercise(isExpanded ? null : idx)}
                                        className="w-full p-4 flex justify-between items-center"
                                    >
                                        <div className="text-left">
                                            <p className="font-bold">{exercise?.name || 'Ejercicio'}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {completedSets.length} series completadas
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[var(--color-primary)] font-bold">
                                                {completedSets.length > 0 ? `${Math.max(...completedSets.map(s => s.weight))} kg` : '-'}
                                            </span>
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-2">
                                            <div className="grid grid-cols-3 text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider pb-2 border-b border-[rgba(255,255,255,0.05)]">
                                                <span>Serie</span>
                                                <span className="text-center">Reps</span>
                                                <span className="text-right">Peso</span>
                                            </div>
                                            {entry.sets.map((set, sIdx) => (
                                                <div
                                                    key={sIdx}
                                                    className={`grid grid-cols-3 py-2 ${set.isCompleted ? '' : 'opacity-40'}`}
                                                >
                                                    <span className="text-[var(--color-text-muted)]">{sIdx + 1}</span>
                                                    <span className="text-center font-mono font-bold">{set.reps}</span>
                                                    <span className="text-right font-mono font-bold">{set.weight} kg</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
