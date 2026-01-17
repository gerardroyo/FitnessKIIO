'use client';

import { Exercise } from '@/lib/db';
import { useExercises } from '@/hooks/useFirestore';
import { addUserExercise, updateExercise, deleteExercise } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Check, X, Dumbbell, ChevronRight } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { SwipeableRow } from '@/components/SwipeableRow';
import { ConfirmModal } from '@/components/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function ExercisesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editName, setEditName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newMuscle, setNewMuscle] = useState('Pecho');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const { exercises } = useExercises();

    // Group exercises by muscle group
    const groupedExercises = useMemo(() => {
        if (!exercises) return {};
        const groups: Record<string, Exercise[]> = {};
        for (const ex of exercises) {
            const group = ex.muscleGroup || 'Otro';
            if (!groups[group]) groups[group] = [];
            groups[group].push(ex);
        }
        return groups;
    }, [exercises]);

    const muscleGroups = Object.keys(groupedExercises).sort();

    const handleEdit = (exercise: Exercise) => {
        setEditingId(exercise.id);
        setEditName(exercise.name);
    };

    const handleSaveEdit = async () => {
        if (editingId && editName.trim() && user) {
            await updateExercise(user.uid, String(editingId), { name: editName.trim() });
            setEditingId(null);
            setEditName('');
        }
    };

    const handleCreate = async () => {
        if (newName.trim() && user) {
            await addUserExercise(user.uid, {
                name: newName.trim(),
                muscleGroup: newMuscle,
                equipmentType: 'dumbbell',
                defaultRestSeconds: 90,
                targetSets: 4,
                targetRepsRange: '8-12'
            });
            setNewName('');
            setIsCreating(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.id && user) {
            await deleteExercise(user.uid, deleteModal.id);
        }
    };

    const muscleOptions = ['Pecho', 'Espalda', 'Hombro', 'Bíceps', 'Tríceps', 'Pierna', 'Core', 'Otro'];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-background)]">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg">Ejercicios</h1>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-2 -mr-2 text-[var(--color-primary)]"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </header>

                <div className="p-4 space-y-6">
                    {/* Create New Exercise */}
                    <AnimatePresence>
                        {isCreating && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, y: -20 }}
                                animate={{ opacity: 1, height: 'auto', y: 0 }}
                                exit={{ opacity: 0, height: 0, y: -20 }}
                                transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
                                className="overflow-hidden"
                            >
                                <div className="bg-[var(--color-surface)] p-4 rounded-xl border-2 border-[var(--color-primary)] space-y-3 mb-6">
                                    <div className="flex items-center gap-3">
                                        <Dumbbell size={20} className="text-[var(--color-primary)] shrink-0" />
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            placeholder="Nombre del ejercicio..."
                                            autoFocus
                                            className="flex-1 bg-transparent outline-none text-white placeholder:text-[var(--color-text-muted)]"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {muscleOptions.map(m => (
                                            <button
                                                key={m}
                                                onClick={() => setNewMuscle(m)}
                                                className={`px-3 py-1 text-xs rounded-full border transition-colors ${newMuscle === m
                                                    ? 'bg-[var(--color-primary)] text-black border-[var(--color-primary)]'
                                                    : 'border-[rgba(255,255,255,0.1)] text-[var(--color-text-muted)]'
                                                    }`}
                                            >
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => { setIsCreating(false); setNewName(''); }} className="px-4 py-2 text-[var(--color-text-muted)]">
                                            Cancelar
                                        </button>
                                        <button onClick={handleCreate} className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-bold">
                                            Crear
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Grouped Exercise List */}
                    {muscleGroups.map(group => (
                        <div key={group}>
                            <h2 className="text-sm font-bold text-[var(--color-primary)] uppercase tracking-wider mb-2 px-1">
                                {group}
                            </h2>
                            <div className="space-y-2">
                                <AnimatePresence mode="popLayout">
                                    {groupedExercises[group].map((exercise) => (
                                        <motion.div
                                            key={exercise.id}
                                            layout
                                            exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                        >
                                            <SwipeableRow onDelete={() => setDeleteModal({ isOpen: true, id: String(exercise.id) })}>
                                                {editingId === exercise.id ? (
                                                    <div className="p-4 flex items-center gap-3">
                                                        <input
                                                            type="text"
                                                            value={editName}
                                                            onChange={(e) => setEditName(e.target.value)}
                                                            autoFocus
                                                            className="flex-1 bg-transparent outline-none text-white"
                                                        />
                                                        <button onClick={handleSaveEdit} className="p-2 text-[var(--color-primary)]">
                                                            <Check size={20} />
                                                        </button>
                                                        <button onClick={() => setEditingId(null)} className="p-2 text-[var(--color-text-muted)]">
                                                            <X size={20} />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center">
                                                        <div
                                                            onClick={() => router.push(`/stats/${exercise.id}`)}
                                                            className="flex-1 p-4 flex items-center gap-4 cursor-pointer"
                                                        >
                                                            <p className="font-medium text-white">{exercise.name}</p>
                                                            <ChevronRight size={18} className="text-[var(--color-text-muted)] ml-auto" />
                                                        </div>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleEdit(exercise); }}
                                                            className="p-4 text-[var(--color-text-muted)] hover:text-white border-l border-[rgba(255,255,255,0.05)]"
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </SwipeableRow>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}

                    {exercises?.length === 0 && !isCreating && (
                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                            <Dumbbell size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No hay ejercicios todavía</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 text-[var(--color-primary)] font-bold"
                            >
                                Crear el primero
                            </button>
                        </div>
                    )}
                </div>
                <ConfirmModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal({ isOpen: false, id: null })}
                    onConfirm={handleConfirmDelete}
                    title="¿Eliminar ejercicio?"
                    message="Este ejercicio se eliminará permanentemente de tu lista."
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    variant="danger"
                />
            </div>
        </ProtectedRoute>
    );
}
