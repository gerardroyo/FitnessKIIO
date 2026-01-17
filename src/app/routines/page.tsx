'use client';

import { Routine } from '@/lib/db';
import { useRoutines } from '@/hooks/useFirestore';
import { addUserRoutine, deleteRoutine } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Check, X, Calendar, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SwipeableRow } from '@/components/SwipeableRow';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoutinesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const { routines } = useRoutines();

    const handleCreate = async () => {
        if (newName.trim() && user) {
            const id = await addUserRoutine(user.uid, {
                name: newName.trim(),
                exerciseIds: []
            });
            setNewName('');
            setIsCreating(false);
            router.push(`/routines/${id}`);
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteModal.id && user) {
            await deleteRoutine(user.uid, deleteModal.id);
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-background)]">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg">Mis Rutinas</h1>
                        <button
                            onClick={() => setIsCreating(true)}
                            className="p-2 -mr-2 text-[var(--color-primary)]"
                        >
                            <Plus size={24} />
                        </button>
                    </div>
                </header>

                <div className="p-4 space-y-4">
                    {/* Create New Routine */}
                    {isCreating && (
                        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-primary)]">
                            <p className="text-sm font-bold mb-2">Nueva Rutina</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="Nombre de la rutina"
                                    autoFocus
                                    className="flex-1 bg-[#1f3a2f] p-3 rounded-lg outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                                />
                                <button
                                    onClick={handleCreate}
                                    disabled={!newName.trim()}
                                    className="bg-[var(--color-primary)] text-black font-bold px-4 rounded-lg disabled:opacity-50"
                                >
                                    <Check size={20} />
                                </button>
                                <button
                                    onClick={() => { setIsCreating(false); setNewName(''); }}
                                    className="bg-[#1f3a2f] text-white px-4 rounded-lg"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Routines List */}
                    <AnimatePresence mode="popLayout">
                        {routines?.map((routine) => (
                            <motion.div
                                key={routine.id}
                                layout
                                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                            >
                                <SwipeableRow onDelete={() => setDeleteModal({ isOpen: true, id: String(routine.id) })}>
                                    <div
                                        onClick={() => router.push(`/routines/${routine.id}`)}
                                        className="bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)] p-4 flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-12 h-12 rounded-xl bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                                            <Calendar size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{routine.name}</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">
                                                {routine.exerciseIds.length} ejercicios
                                            </p>
                                        </div>
                                        <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                                    </div>
                                </SwipeableRow>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {routines?.length === 0 && !isCreating && (
                        <div className="text-center py-12 text-[var(--color-text-muted)]">
                            <Calendar size={48} className="mx-auto mb-4 opacity-30" />
                            <p>No hay rutinas todavía</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 text-[var(--color-primary)] font-bold"
                            >
                                Crear la primera
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Routine Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar rutina?"
                message="Esta rutina y su configuración se eliminarán permanentemente."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </ProtectedRoute>
    );
}

