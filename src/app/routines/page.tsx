'use client';

import { Routine } from '@/lib/db';
import { useRoutines } from '@/hooks/useFirestore';
import { addUserRoutine, deleteRoutine } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Check, X, Calendar, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SwipeableRow } from '@/components/SwipeableRow';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { ArrowUp, ArrowDown, GripVertical } from 'lucide-react';
import { updateRoutine } from '@/lib/firestore';

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

    // Local state for DnD
    const [items, setItems] = useState<any[]>([]);

    useEffect(() => {
        if (routines.length > 0) {
            // Sort by order before setting items
            const sorted = [...routines].sort((a, b) => (a.order || 0) - (b.order || 0));
            // Sync if length differs or first load. 
            // Simple check to avoid conflict during drag: only sync if IDs drastically change or length changes
            const currentIds = items.map(i => i.id).join(',');
            const remoteIds = sorted.map(i => i.id).join(',');

            if (items.length === 0 || currentIds !== remoteIds) {
                setItems(sorted);
            }
        }
    }, [routines]);

    const handleCreate = async () => {
        if (newName.trim() && user) {
            const id = await addUserRoutine(user.uid, {
                name: newName.trim(),
                exerciseIds: [],
                order: routines.length // Set order to avoid sorting issues
            });
            setNewName('');
            setIsCreating(false);

            // Wait a short time for Firestore to sync before navigating
            // This prevents the infinite loading state on the detail page
            await new Promise(resolve => setTimeout(resolve, 500));
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
                    {/* Routines List */}
                    <Reorder.Group
                        values={items}
                        onReorder={(newOrder) => setItems(newOrder)}
                        className="space-y-4"
                    >
                        {items.map((routine) => (
                            <DraggableRoutineListItem
                                key={routine.id}
                                routine={routine}
                                items={items}
                                router={router}
                                setDeleteModal={setDeleteModal}
                                updateRoutine={updateRoutine}
                                user={user}
                            />
                        ))}
                    </Reorder.Group>

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


function DraggableRoutineListItem({ routine, items, router, setDeleteModal, updateRoutine, user }: any) {
    const controls = useDragControls();

    return (
        <Reorder.Item
            value={routine}
            style={{ listStyle: 'none' }}
            dragListener={false}
            dragControls={controls}
            onDragEnd={async () => {
                const updates = items.map((r: any, i: number) => updateRoutine(user!.uid, String(r.id), { order: i }));
                await Promise.all(updates);
            }}
        >
            <motion.div
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
            >
                <SwipeableRow onDelete={() => setDeleteModal({ isOpen: true, id: String(routine.id) })}>
                    <div className="bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)] p-4 flex items-center gap-4">
                        <div
                            className="text-[var(--color-text-muted)] cursor-grab active:cursor-grabbing p-2 -m-2 touch-none"
                            onPointerDown={(e) => controls.start(e)}
                        >
                            <GripVertical size={20} />
                        </div>

                        <div
                            onClick={() => router.push(`/routines/${routine.id}`)}
                            className="w-12 h-12 rounded-xl bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)] cursor-pointer"
                        >
                            <Calendar size={24} />
                        </div>
                        <div
                            onClick={() => router.push(`/routines/${routine.id}`)}
                            className="flex-1 cursor-pointer"
                        >
                            <p className="font-bold text-white">{routine.name}</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                                {routine.exerciseIds.length} ejercicios
                            </p>
                        </div>

                        <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                    </div>
                </SwipeableRow>
            </motion.div>
        </Reorder.Item>
    );
}
