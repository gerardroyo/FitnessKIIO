'use client';

import { Routine } from '@/lib/db';
import { useRoutines, useExercises } from '@/hooks/useFirestore';
import { updateRoutine } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { use, useState } from 'react';
import { ArrowLeft, Plus, X, Check, Pencil, Dumbbell, ChevronRight } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

interface RoutineEditPageProps {
    params: Promise<{ id: string }>;
}

export default function RoutineEditPage({ params }: RoutineEditPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);
    const [editedName, setEditedName] = useState('');
    const [deleteExerciseModal, setDeleteExerciseModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const { routines } = useRoutines();
    const { exercises: allExercises } = useExercises();

    const routine = routines.find(r => String(r.id) === id);

    // Get exercises in this routine
    const exerciseIds = routine?.exerciseIds.map(String) || [];
    const routineExercises = allExercises.filter(e => exerciseIds.includes(String(e.id)));

    // Exercises not yet in this routine
    const availableExercises = allExercises.filter(
        e => !exerciseIds.includes(String(e.id))
    );

    const handleAddExercise = async (exerciseId: string | number) => {
        if (routine && user) {
            await updateRoutine(user.uid, String(routine.id), {
                exerciseIds: [...routine.exerciseIds, exerciseId]
            });
        }
    };

    const handleConfirmRemoveExercise = async () => {
        if (!deleteExerciseModal.id || !routine || !user) return;
        await updateRoutine(user.uid, String(routine.id), {
            exerciseIds: routine.exerciseIds.filter(id => String(id) !== deleteExerciseModal.id)
        });
    };

    const handleSaveName = async () => {
        if (routine && editedName.trim() && user) {
            await updateRoutine(user.uid, String(routine.id), { name: editedName.trim() });
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
        <ProtectedRoute>
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
                                <AnimatePresence mode="popLayout">
                                    {routineExercises.map((exercise, idx) => (
                                        <motion.div
                                            key={exercise.id}
                                            layout
                                            exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                        >
                                            <SwipeableRow onDelete={() => setDeleteExerciseModal({ isOpen: true, id: String(exercise.id) })}>
                                                <div className="p-4 flex items-center gap-4">
                                                    <span className="w-6 h-6 rounded-full bg-[#1f3a2f] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center">
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1">
                                                        <p className="font-medium text-white">{exercise.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">{exercise.muscleGroup}</p>
                                                    </div>
                                                </div>
                                            </SwipeableRow>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
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

                {/* Delete Exercise Confirmation Modal */}
                <ConfirmModal
                    isOpen={deleteExerciseModal.isOpen}
                    onClose={() => setDeleteExerciseModal({ isOpen: false, id: null })}
                    onConfirm={handleConfirmRemoveExercise}
                    title="¿Quitar ejercicio?"
                    message="Este ejercicio se quitará de la rutina."
                    confirmText="Quitar"
                    cancelText="Cancelar"
                    variant="warning"
                />

                {/* Add Exercise Modal */}
                <AnimatePresence>
                    {isAddingExercise && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 bg-black/80 z-50"
                                onClick={() => setIsAddingExercise(false)}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                                className="fixed bottom-0 left-0 right-0 bg-[var(--color-background)] max-h-[80vh] rounded-t-3xl overflow-hidden z-50"
                            >
                                <div className="flex justify-center pt-3 pb-1">
                                    <div className="w-10 h-1 bg-[#3a3a3c] rounded-full" />
                                </div>
                                <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                                    <h2 className="font-bold text-lg">Añadir Ejercicio</h2>
                                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setIsAddingExercise(false)}>
                                        <X size={24} />
                                    </motion.button>
                                </div>

                                <div className="p-4 overflow-y-auto max-h-[60vh] space-y-2">
                                    {availableExercises.length > 0 ? (
                                        availableExercises.map((exercise) => (
                                            <motion.button
                                                key={exercise.id}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={() => handleAddExercise(exercise.id)}
                                                className="w-full bg-[var(--color-surface)] rounded-xl p-4 flex items-center gap-4 border border-[rgba(255,255,255,0.05)]"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                                                    <Dumbbell size={18} />
                                                </div>
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium text-white">{exercise.name}</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">{exercise.muscleGroup}</p>
                                                </div>
                                                <Plus size={20} className="text-[var(--color-primary)]" />
                                            </motion.button>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-[var(--color-text-muted)]">
                                            <p>Todos los ejercicios ya están añadidos</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}
