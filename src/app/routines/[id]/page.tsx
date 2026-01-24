'use client';

import { Routine } from '@/lib/db';
import { useRoutines, useExercises } from '@/hooks/useFirestore';
import { updateRoutine } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { use, useState, useEffect } from 'react';
import { ArrowLeft, Plus, X, Check, Pencil, Dumbbell, ChevronRight, GripVertical } from 'lucide-react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';

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
    const routineExercises = allExercises
        .filter(e => exerciseIds.includes(String(e.id)))
        .sort((a, b) => exerciseIds.indexOf(String(a.id)) - exerciseIds.indexOf(String(b.id)));

    // Local state for drag and drop to prevent flickering
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (routineExercises.length > 0) {
            // Only update if the *content* has changed (added/removed items), 
            // ignoring order changes to prevent fighting with local drag state.
            const currentIds = items.map(i => i.id).sort().join(',');
            const remoteIds = routineExercises.map(i => i.id).sort().join(',');

            if (items.length === 0 || currentIds !== remoteIds) {
                // If the set of items is different, we must sync.
                // We trust routineExercises (sorted by routine.exerciseIds) for the new order.
                setItems(routineExercises);
            }
        }
    }, [routineExercises]);

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
                                <Reorder.Group
                                    values={items}
                                    onReorder={(newOrder) => {
                                        setItems(newOrder); // Update local state immediately
                                    }}
                                    className="space-y-2"
                                >
                                    {items.map((exercise, idx) => (
                                        <DraggableRoutineItem
                                            key={exercise.id}
                                            exercise={exercise}
                                            index={idx}
                                            items={items}
                                            setDeleteExerciseModal={setDeleteExerciseModal}
                                            updateRoutine={updateRoutine}
                                            user={user}
                                            routine={routine}
                                        />
                                    ))}
                                </Reorder.Group>
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

function DraggableRoutineItem({ exercise, index, items, setDeleteExerciseModal, updateRoutine, user, routine }: any) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={exercise}
            style={{ listStyle: 'none' }}
            dragListener={false}
            dragControls={controls}
            onDragEnd={async () => {
                if (user && routine) {
                    const newIds = items.map((e: any) => String(e.id));
                    await updateRoutine(user.uid, String(routine.id), { exerciseIds: newIds });
                }
            }}
        >
            <motion.div
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <SwipeableRow onDelete={() => setDeleteExerciseModal({ isOpen: true, id: String(exercise.id) })}>
                    <div className="p-4 flex items-center gap-4 bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)]">
                        <div
                            className="text-[var(--color-text-muted)] cursor-grab active:cursor-grabbing p-2 -m-2 touch-none"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={20} />
                        </div>
                        <span className="w-6 h-6 rounded-full bg-[#1f3a2f] text-[var(--color-primary)] text-xs font-bold flex items-center justify-center shrink-0">
                            {index + 1}
                        </span>
                        <div className="flex-1">
                            <p className="font-medium text-white">{exercise.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">{exercise.muscleGroup}</p>
                        </div>
                    </div>
                </SwipeableRow>
            </motion.div>
        </Reorder.Item>
    );
}
