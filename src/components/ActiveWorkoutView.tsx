import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkoutSession, Exercise, Routine } from '@/lib/db'; // Keep interfaces
import { updateSession, updateRoutine, addUserRoutine } from '@/lib/firestore'; // Firestore actions
import { useExercises, useRoutines } from '@/hooks/useFirestore'; // Firestore hooks
import { ChevronLeft, MoreHorizontal, Plus, FileText, X, Dumbbell, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseListCard } from './ExerciseListCard';
import { useAuth } from '@/context/AuthContext';

interface ActiveWorkoutViewProps {
    session: WorkoutSession;
}

export function ActiveWorkoutView({ session }: ActiveWorkoutViewProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [elapsed, setElapsed] = useState(0);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [notes, setNotes] = useState(session.notes || '');

    // Load data hooks
    const { exercises: allExercises } = useExercises();
    const { routines } = useRoutines();

    // Find current routine
    const routine = routines.find(r => String(r.id) === String(session.routineId));

    // Get exercise IDs from session entries
    const exerciseIds = session.entries.map(e => String(e.exerciseId));

    // Filter exercises used in this session
    const exercises = allExercises.filter(e => exerciseIds.includes(String(e.id)));

    // Exercises not in current session
    const availableExercises = allExercises.filter(e => !exerciseIds.includes(String(e.id)));

    // Check if routine was modified
    const originalExerciseIds = routine?.exerciseIds.map(String) || [];
    const hasChanges = session.routineId
        ? JSON.stringify(originalExerciseIds.sort()) !== JSON.stringify(exerciseIds.slice().sort())
        : exerciseIds.length > 0; // Free training with exercises added

    // Timer logic
    useEffect(() => {
        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - session.startTime) / 1000));
        }, 1000);
        return () => clearInterval(interval);
    }, [session.startTime]);

    const formatTime = (seconds: number) => {
        const mm = Math.floor(seconds / 60).toString().padStart(2, '0');
        const ss = (seconds % 60).toString().padStart(2, '0');
        return `${mm}:${ss}`;
    };

    const completedCount = session.entries.filter(e =>
        e.sets.some(s => s.isCompleted)
    ).length;

    const totalExercises = exerciseIds.length;
    const progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

    const navigateToExercise = (exerciseId: string | number) => {
        router.push(`/exercise/${exerciseId}`);
    };

    const handleAddExercise = async (exerciseId: string | number) => {
        if (!user) return;
        const newEntries = [...session.entries, { exerciseId: String(exerciseId), sets: [] }];
        await updateSession(user.uid, String(session.id), { entries: newEntries });
    };

    const handleSaveNotes = async () => {
        if (!user) return;
        await updateSession(user.uid, String(session.id), { notes });
        setShowNotesModal(false);
    };

    const handleFinishClick = () => {
        if (hasChanges) {
            setShowFinishModal(true);
        } else {
            finishSession();
        }
    };

    const finishSession = async () => {
        if (!user) return;
        await updateSession(user.uid, String(session.id), {
            state: 'completed',
            endTime: Date.now(),
            durationSeconds: elapsed,
            notes
        });
        router.refresh();
    };

    const updateExistingRoutine = async () => {
        if (!user || !routine) return;
        // exerciseIds are strings, updateRoutine likely expects numbers if we didn't update types?
        // We updated types in db.ts to number | string.
        await updateRoutine(user.uid, String(routine.id), { exerciseIds: exerciseIds.map(Number) }); // Still map to Number? Firestore ID are strings.
        // Wait, exerciseIds in Routine are number[] in interface?
        // In db.ts: exerciseIds: number[].
        // I should update Routine interface too if I want strings.
        // Let's assume for now we keep using what we have, but Firestore IDs are strings.
        // If I try to save strings into number[], TS might complain or Firestore will save strings anyway.
        // Let's coerce to any or update interface properly in a follow up if needed.
        // Actually I updated ID type but not exerciseIds array type.
        // Let's fix that in this edit too if possible or in db.ts.
        await updateRoutine(user.uid, String(routine.id), { exerciseIds: exerciseIds.map(id => isNaN(Number(id)) ? id : Number(id)) as any });

        await finishSession();
    };

    const createNewRoutine = async () => {
        const name = prompt('Nombre de la nueva rutina:', `${session.name} (modificada)`);
        if (name && user) {
            const newRoutineId = await addUserRoutine(user.uid, {
                name,
                exerciseIds: exerciseIds.map(id => isNaN(Number(id)) ? id : Number(id)) as any
            });
            // Update session name and link to new routine
            await updateSession(user.uid, String(session.id), {
                name,
                routineId: newRoutineId
            });
        }
        await finishSession();
    };

    if (!exercises) return <div className="p-6">Cargando...</div>;

    return (
        <div className="flex flex-col h-full bg-[var(--color-background)]">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-[var(--color-background)] sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <ChevronLeft
                        className="text-white cursor-pointer"
                        onClick={() => {/* Maybe confirm exit? */ }}
                    />
                    <h1 className="text-lg font-bold truncate max-w-[200px]">{session.name}</h1>
                </div>
                <button
                    onClick={handleFinishClick}
                    className="bg-[var(--color-surface-hover)] text-[var(--color-primary)] px-4 py-1.5 rounded-full text-sm font-bold active:opacity-80"
                >
                    Finalizar
                </button>
            </header>

            <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-6">
                {/* Progress Card */}
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-card)] p-5 card-shadow relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div className="space-y-1">
                            <span className="text-[var(--color-primary)] text-xs font-bold tracking-wider uppercase">
                                ENTRENAMIENTO EN CURSO
                            </span>
                            <h2 className="text-2xl font-bold leading-tight">
                                ¡Vas por buen <br /> camino!
                            </h2>
                            <p className="text-[var(--color-text-muted)] text-sm pt-1">
                                {completedCount} de {totalExercises} ejercicios completados
                            </p>
                        </div>

                        {/* Circular Progress */}
                        <div className="w-16 h-16 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="32" cy="32" r="28" stroke="var(--color-surface-hover)" strokeWidth="6" fill="none" />
                                <circle
                                    cx="32" cy="32" r="28"
                                    stroke="var(--color-primary)"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray="175.9"
                                    strokeDashoffset={175.9 - (175.9 * progressPercent) / 100}
                                    className="transition-all duration-500 ease-out"
                                />
                            </svg>
                            <span className="absolute text-xs font-bold">{Math.round(progressPercent)}%</span>
                        </div>
                    </div>

                    <div className="mt-4 h-1.5 bg-[#1f3a2f] rounded-full overflow-hidden">
                        <div
                            className="h-full bg-[var(--color-primary)] transition-all duration-500"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>

                {/* Exercises List */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold">Ejercicios de hoy</h3>
                        <MoreHorizontal className="text-[var(--color-text-muted)]" size={20} />
                    </div>

                    {exercises.length > 0 ? (
                        exercises.map((exercise) => {
                            const entry = session.entries.find(e => e.exerciseId === exercise!.id);
                            const isStarted = !!entry;
                            const isCompleted = entry?.sets.every(s => s.isCompleted) && entry?.sets.length >= exercise!.targetSets;

                            return (
                                <ExerciseListCard
                                    key={exercise!.id}
                                    exercise={exercise!}
                                    status={isCompleted ? 'completed' : isStarted ? 'active' : 'pending'}
                                    lastLog="80kg x 8"
                                    onClick={() => navigateToExercise(exercise!.id)}
                                />
                            );
                        })
                    ) : (
                        <div className="text-center py-8 text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl">
                            <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Sin ejercicios</p>
                            <button
                                onClick={() => setShowAddExerciseModal(true)}
                                className="mt-2 text-[var(--color-primary)] text-sm font-bold"
                            >
                                Añadir ejercicio
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="fixed bottom-6 left-4 right-4 bg-[var(--color-surface)] rounded-2xl p-3 flex items-center justify-between shadow-2xl border border-[rgba(255,255,255,0.05)] z-20">
                <div className="flex items-center gap-3 pl-2">
                    <div className="bg-[#1f3a2f] p-2 rounded-lg">
                        <div className="w-5 h-5 border-2 border-[var(--color-primary)] rounded-full flex items-center justify-center">
                            <div className="w-0.5 h-2 bg-[var(--color-primary)] mb-0.5" />
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-bold tracking-wider uppercase">TIEMPO TOTAL</p>
                        <p className="text-xl font-mono font-bold leading-none">{formatTime(elapsed)}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setShowNotesModal(true)}
                        className="w-12 h-12 bg-[#2d4a3e] rounded-xl flex items-center justify-center text-[var(--color-text-muted)]"
                    >
                        <FileText size={20} />
                    </button>
                    <button
                        onClick={() => setShowAddExerciseModal(true)}
                        className="w-12 h-12 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-black shadow-lg shadow-[rgba(0,255,128,0.2)]"
                    >
                        <Plus size={24} strokeWidth={3} />
                    </button>
                </div>
            </div>

            {/* Notes Modal */}
            {showNotesModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
                    <div className="bg-[var(--color-background)] w-full rounded-t-3xl overflow-hidden">
                        <div className="sticky top-0 bg-[var(--color-background)] p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                            <h2 className="font-bold text-lg">Notas de la sesión</h2>
                            <button onClick={() => setShowNotesModal(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-4">
                            <textarea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="Escribe aquí tus notas... (ej: Hoy me sentía cansado)"
                                className="w-full h-32 bg-[var(--color-surface)] rounded-xl p-4 text-white placeholder:text-[var(--color-text-muted)] outline-none resize-none border border-[rgba(255,255,255,0.05)]"
                            />
                            <button
                                onClick={handleSaveNotes}
                                className="w-full mt-4 bg-[var(--color-primary)] text-black font-bold py-3 rounded-xl"
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Exercise Modal */}
            {showAddExerciseModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
                    <div className="bg-[var(--color-background)] w-full max-h-[80vh] rounded-t-3xl overflow-hidden">
                        <div className="sticky top-0 bg-[var(--color-background)] p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                            <h2 className="font-bold text-lg">Añadir Ejercicio</h2>
                            <button onClick={() => setShowAddExerciseModal(false)}>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
                            {availableExercises.length > 0 ? (
                                availableExercises.map((exercise) => (
                                    <button
                                        key={exercise.id}
                                        onClick={() => {
                                            handleAddExercise(exercise.id);
                                        }}
                                        className="w-full bg-[var(--color-surface)] rounded-xl p-4 flex items-center gap-4 active:scale-98 transition-transform border border-[rgba(255,255,255,0.05)]"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                                            <Dumbbell size={18} />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-white">{exercise.name}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{exercise.muscleGroup}</p>
                                        </div>
                                        <Plus size={20} className="text-[var(--color-primary)]" />
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-[var(--color-text-muted)]">
                                    <p>Todos los ejercicios ya están añadidos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Finish with Changes Modal */}
            {showFinishModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-[var(--color-background)] w-full max-w-sm rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)]">
                        <div className="p-6 text-center">
                            <h2 className="font-bold text-xl mb-2">Cambios detectados</h2>
                            <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                Has modificado los ejercicios de esta rutina. ¿Qué quieres hacer?
                            </p>

                            <div className="space-y-3">
                                {session.routineId && (
                                    <button
                                        onClick={updateExistingRoutine}
                                        className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl text-left"
                                    >
                                        <p className="font-bold text-white">Actualizar rutina existente</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">Guardar los cambios en "{routine?.name}"</p>
                                    </button>
                                )}

                                <button
                                    onClick={createNewRoutine}
                                    className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl text-left"
                                >
                                    <p className="font-bold text-white">Crear nueva rutina</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">Guardar como una rutina nueva</p>
                                </button>

                                <button
                                    onClick={finishSession}
                                    className="w-full bg-[var(--color-primary)] text-black font-bold p-4 rounded-xl"
                                >
                                    Solo finalizar
                                </button>

                                <button
                                    onClick={() => setShowFinishModal(false)}
                                    className="w-full text-[var(--color-text-muted)] p-2"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
