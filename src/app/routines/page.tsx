'use client';

import { db, Routine } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Check, X, Calendar, ChevronRight, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function RoutinesPage() {
    const router = useRouter();
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    const routines = useLiveQuery(() => db.routines.toArray());

    const handleCreate = async () => {
        if (newName.trim()) {
            const id = await db.routines.add({
                name: newName.trim(),
                exerciseIds: []
            });
            setNewName('');
            setIsCreating(false);
            router.push(`/routines/${id}`);
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: number) => {
        e.stopPropagation();
        if (window.confirm('¿Eliminar esta rutina?')) {
            await db.routines.delete(id);
        }
    };

    return (
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
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border-2 border-[var(--color-primary)] space-y-3">
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Nombre de la rutina..."
                            autoFocus
                            className="w-full bg-transparent outline-none text-white text-lg placeholder:text-[var(--color-text-muted)]"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => { setIsCreating(false); setNewName(''); }} className="px-4 py-2 text-[var(--color-text-muted)]">
                                Cancelar
                            </button>
                            <button onClick={handleCreate} className="px-4 py-2 bg-[var(--color-primary)] text-black rounded-lg font-bold">
                                Crear
                            </button>
                        </div>
                    </div>
                )}

                {/* Routines List */}
                {routines?.map((routine) => (
                    <div
                        key={routine.id}
                        onClick={() => router.push(`/routines/${routine.id}`)}
                        className="bg-[var(--color-surface)] rounded-xl border border-[rgba(255,255,255,0.05)] p-4 flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
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
                        <button
                            onClick={(e) => handleDelete(e, routine.id)}
                            className="p-2 text-[var(--color-text-muted)] hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>
                        <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                    </div>
                ))}

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
    );
}
