'use client';

import { db, Exercise } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { ArrowLeft, Plus, X, Check, Pencil, Dumbbell } from 'lucide-react';

interface RoutineEditPageProps {
    params: Promise<{ id: string }>;
}

export default function RoutineEditPage({ params }: RoutineEditPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');

    const routine = useLiveQuery(() => db.routines.get(Number(id)), [id]);
    const allExercises = useLiveQuery(() => db.exercises.toArray());

    // Get exercises in this routine
    const routineExercises = useLiveQuery(
        async () => {
            if (!routine) return [];
            const result = await db.exercises.bulkGet(routine.exerciseIds);
            return result.filter((e): e is Exercise => !!e);
        },
        [routine?.exerciseIds.join(',')]
    );

    // Exercises not yet in this routine
    const availableExercises = allExercises?.filter(
        e => !routine?.exerciseIds.includes(e.id)
    ) || [];

    const handleAddExercise = async (exerciseId: number) => {
        if (routine) {
            await db.routines.update(routine.id, {
                exerciseIds: [...routine.exerciseIds, exerciseId]
            });
        }
    };

    const handleRemoveExercise = async (exerciseId: number) => {
        if (routine) {
            await db.routines.update(routine.id, {
                exerciseIds: routine.exerciseIds.filter(id => id !== exerciseId)
            });
        }
    };

    const handleSaveName = async () => {
        if (routine && editedName.trim()) {
            await db.routines.update(routine.id, { name: editedName.trim() });
            setIsEditingName(false);
        }
    };

    const startEditingName = () => {
        if (routine) {
            setEditedName(routine.name);
            setIsEditingName(true);
        }
    };

    if (!routine) {
        return (
            <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">
                Cargando...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)]">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} />
                    </button>

                    {isEditingName ? (
                        <div className="flex items-center gap-2 flex-1 mx-4">
                            <input
                                type="text"
                                value={editedName}
                                onChange={(e) => setEditedName(e.target.value)}
                                autoFocus
                                className="flex-1 bg-transparent outline-none text-white text-center font-bold"
                            />
                            <button onClick={handleSaveName} className="text-[var(--color-primary)]">
                                <Check size={20} />
                            </button>
                            <button onClick={() => setIsEditingName(false)} className="text-[var(--color-text-muted)]">
                                <X size={20} />
                            </button>
                        </div>
                    ) : (
                        <button onClick={startEditingName} className="flex items-center gap-2">
                            <h1 className="font-bold text-lg">{routine.name}</h1>
                            <Pencil size={14} className="text-[var(--color-text-muted)]" />
                        </button>
                    )}

                    <div className="w-10" />
                </div>
            </header>

            <div className="p-4 space-y-6">
                {/* Exercises in Routine */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="font-bold text-[var(--color-text-muted)] uppercase text-sm tracking-wider">
                            Ejercicios ({routine.exerciseIds.length})
                        </h2>
                        <button
                            onClick={() => setIsAddingExercise(true)}
                            className="text-[var(--color-primary)] text-sm font-bold flex items-center gap-1"
                        >
                            <Plus size={16} /> Añadir
                        </button>
                    </div>

                    {routineExercises && routineExercises.length > 0 ? (
                        <div className="space-y-2">
                            {routineExercises.map((exercise, idx) => (
                                <div
                                    key={exercise.id}
                                    className="bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)] p-4 flex items-center gap-4"
                                >
                                    <span className="w-6 h-6 rounded-full bg-[#1f3a2f] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center">
                                        {idx + 1}
                                    </span>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{exercise.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">{exercise.muscleGroup}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveExercise(exercise.id)}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl">
                            <Dumbbell size={32} className="mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Sin ejercicios aún</p>
                            <button
                                onClick={() => setIsAddingExercise(true)}
                                className="mt-2 text-[var(--color-primary)] text-sm font-bold"
                            >
                                Añadir ejercicios
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Exercise Modal */}
            {isAddingExercise && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
                    <div className="bg-[var(--color-background)] w-full max-h-[80vh] rounded-t-3xl overflow-hidden">
                        <div className="sticky top-0 bg-[var(--color-background)] p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                            <h2 className="font-bold text-lg">Añadir Ejercicio</h2>
                            <button onClick={() => setIsAddingExercise(false)}>
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
        </div>
    );
}
