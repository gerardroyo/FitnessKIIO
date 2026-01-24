import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { WorkoutSession, Exercise, Routine } from '@/lib/db'; // Keep interfaces
import { updateSession, updateRoutine, addUserRoutine } from '@/lib/firestore'; // Firestore actions
import { useExercises, useRoutines } from '@/hooks/useFirestore'; // Firestore hooks
import { ChevronLeft, MoreHorizontal, Plus, FileText, X, Dumbbell, Check, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExerciseListCard } from './ExerciseListCard';
import { SwipeableRow } from './SwipeableRow';
import { ConfirmModal } from './ConfirmModal';
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
    const [showNameModal, setShowNameModal] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [deleteExerciseId, setDeleteExerciseId] = useState<string | null>(null);

    // Load data hooks
    const { exercises: allExercises } = useExercises();
    const { routines } = useRoutines();

    // Find current routine
    const routine = routines.find(r => String(r.id) === String(session.routineId));

    // Get exercise IDs from session entries
    const exerciseIds = session.entries.map(e => String(e.exerciseId));

    // Filter exercises used in this session
    const exercises = allExercises
        .filter(e => exerciseIds.includes(String(e.id)))
        .sort((a, b) => exerciseIds.indexOf(String(a.id)) - exerciseIds.indexOf(String(b.id)));

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

    // Calculate progress based ONLY on valid/visible exercises
    const validExerciseIds = exercises.map(e => String(e.id));
    const validEntries = session.entries.filter(e => validExerciseIds.includes(String(e.exerciseId)));

    const completedCount = validEntries.filter(e =>
        e.sets.some(s => s.isCompleted)
    ).length;

    const totalExercises = validEntries.length;
    const progressPercent = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;
    const dashOffset = 175.9 - (175.9 * progressPercent) / 100;

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
        setShowFinishModal(true);
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
        await updateRoutine(user.uid, String(routine.id), { exerciseIds: exerciseIds.map(id => isNaN(Number(id)) ? id : Number(id)) as any });
        await finishSession();
    };

    const confirmCreateRoutine = async () => {
        if (newRoutineName && user) {
            const newRoutineId = await addUserRoutine(user.uid, {
                name: newRoutineName,
                exerciseIds: exerciseIds.map(id => isNaN(Number(id)) ? id : Number(id)) as any
            });
            await updateSession(user.uid, String(session.id), {
                name: newRoutineName,
                routineId: newRoutineId
            });
        }
        setShowNameModal(false);
        await finishSession();
    };

    const openCreateRoutineModal = () => {
        setNewRoutineName(`${session.name} (modificada)`);
        setShowFinishModal(false);
        setShowNameModal(true);
    };

    if (!exercises) return <div className="p-6">Cargando...</div>;

    return (
        <div className="min-h-screen bg-[var(--color-background)] relative">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-[var(--color-background)] fixed top-0 left-0 right-0 z-50 max-w-md mx-auto">
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

            <div className="pt-16 px-4 pb-24 space-y-6">
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
                                <motion.circle
                                    cx="32" cy="32" r="28"
                                    stroke="var(--color-primary)"
                                    strokeWidth="6"
                                    fill="none"
                                    strokeDasharray="175.9"
                                    initial={{ strokeDashoffset: 175.9 }}
                                    animate={{ strokeDashoffset: dashOffset }}
                                    transition={{ duration: 1.5, ease: "circOut" }}
                                />
                            </svg>
                            <span className="absolute text-xs font-bold">{Math.round(progressPercent)}%</span>
                        </div>
                    </div>

                    <div className="mt-4 h-1.5 bg-[#1f3a2f] rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-[var(--color-primary)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercent}%` }}
                            transition={{ duration: 1.5, ease: "circOut" }}
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
                        <Reorder.Group
                            values={exercises}
                            onReorder={async (newOrder) => {
                                // Optimistic update not easily possible without local state for `exercises`
                                // But `exercises` here is derived from `allExercises` + `session.entries` order.
                                // We need to reorder `session.entries`.

                                const newExerciseIds = newOrder.map(e => String(e.id));

                                // Re-sort entries according to new exercise order
                                const newEntries = [...session.entries].sort((a, b) => {
                                    return newExerciseIds.indexOf(String(a.exerciseId)) - newExerciseIds.indexOf(String(b.exerciseId));
                                });

                                // We should strictly update specific entry positions corresponding to the drag, 
                                // but sorting entries by the new exercise visual order is the intended effect.

                                await updateSession(user!.uid, String(session.id), { entries: newEntries });
                            }}
                            className="space-y-4"
                        >
                            {exercises.map((exercise) => (
                                <DraggableActiveExerciseItem
                                    key={exercise!.id}
                                    exercise={exercise}
                                    session={session}
                                    user={user}
                                    setDeleteExerciseId={setDeleteExerciseId}
                                    navigateToExercise={navigateToExercise}
                                />
                            ))}
                        </Reorder.Group>
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
            <AnimatePresence>
                {showNotesModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50"
                            onClick={() => setShowNotesModal(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 bg-[var(--color-background)] rounded-t-3xl overflow-hidden z-50"
                        >
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-[#3a3a3c] rounded-full" />
                            </div>
                            <div className="p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                                <h2 className="font-bold text-lg">Notas de la sesión</h2>
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowNotesModal(false)}>
                                    <X size={24} />
                                </motion.button>
                            </div>
                            <div className="p-4">
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Escribe aquí tus notas... (ej: Hoy me sentía cansado)"
                                    className="w-full h-32 bg-[var(--color-surface)] rounded-xl p-4 text-white placeholder:text-[var(--color-text-muted)] outline-none resize-none border border-[rgba(255,255,255,0.05)]"
                                />
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveNotes}
                                    className="w-full mt-4 bg-[var(--color-primary)] text-black font-bold py-3 rounded-xl"
                                >
                                    Guardar
                                </motion.button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Add Exercise Modal */}
            <AnimatePresence>
                {showAddExerciseModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50"
                            onClick={() => setShowAddExerciseModal(false)}
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
                                <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAddExerciseModal(false)}>
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

            {/* Finish Modal */}
            <AnimatePresence>
                {showFinishModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50"
                            onClick={() => setShowFinishModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-[var(--color-background)] w-full max-w-sm rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)] pointer-events-auto">
                                <div className="p-6 text-center">
                                    <h2 className="font-bold text-xl mb-2">
                                        {hasChanges ? 'Cambios detectados' : '¿Finalizar sesión?'}
                                    </h2>
                                    <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                        {hasChanges
                                            ? 'Has modificado los ejercicios de esta rutina. ¿Qué quieres hacer?'
                                            : 'Has completado ' + completedCount + ' ejercicios. ¿Quieres guardar y finalizar?'}
                                    </p>

                                    <div className="space-y-3">
                                        {hasChanges ? (
                                            <>
                                                {session.routineId && (
                                                    <motion.button
                                                        whileTap={{ scale: 0.97 }}
                                                        onClick={updateExistingRoutine}
                                                        className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl text-left"
                                                    >
                                                        <p className="font-bold text-white">Actualizar rutina existente</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">Guardar los cambios en "{routine?.name}"</p>
                                                    </motion.button>
                                                )}

                                                <motion.button
                                                    whileTap={{ scale: 0.97 }}
                                                    onClick={openCreateRoutineModal}
                                                    className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] p-4 rounded-xl text-left"
                                                >
                                                    <p className="font-bold text-white">Crear nueva rutina</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">Guardar como una rutina nueva</p>
                                                </motion.button>

                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={finishSession}
                                                    className="w-full bg-[var(--color-primary)] text-black font-bold p-4 rounded-xl"
                                                >
                                                    Solo finalizar
                                                </motion.button>
                                            </>
                                        ) : (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={finishSession}
                                                className="w-full bg-[var(--color-primary)] text-black font-bold p-4 rounded-xl"
                                            >
                                                Finalizar Entrenamiento
                                            </motion.button>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowFinishModal(false)}
                                            className="w-full text-[var(--color-text-muted)] p-2"
                                        >
                                            Cancelar
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            {/* Name Modal */}
            <AnimatePresence>
                {showNameModal && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 z-50"
                            onClick={() => setShowNameModal(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                        >
                            <div className="bg-[var(--color-background)] w-full max-w-sm rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)] pointer-events-auto">
                                <div className="p-6">
                                    <h2 className="font-bold text-xl mb-4 text-center">
                                        Nombre de la rutina
                                    </h2>

                                    <input
                                        type="text"
                                        value={newRoutineName}
                                        onChange={(e) => setNewRoutineName(e.target.value)}
                                        className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-white mb-6 focus:outline-none focus:border-[var(--color-primary)]"
                                        placeholder="Ej: Pierna Hipertrofia"
                                        autoFocus
                                    />

                                    <div className="space-y-3">
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={confirmCreateRoutine}
                                            disabled={!newRoutineName.trim()}
                                            className="w-full bg-[var(--color-primary)] text-black font-bold p-4 rounded-xl disabled:opacity-50"
                                        >
                                            Guardar y Finalizar
                                        </motion.button>
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setShowNameModal(false)}
                                            className="w-full text-[var(--color-text-muted)] p-2"
                                        >
                                            Cancelar
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>


            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={!!deleteExerciseId}
                onClose={() => setDeleteExerciseId(null)}
                onConfirm={async () => {
                    if (!deleteExerciseId || !user) return;
                    const newEntries = session.entries.filter(e => String(e.exerciseId) !== String(deleteExerciseId));
                    await updateSession(user.uid, String(session.id), { entries: newEntries });
                    setDeleteExerciseId(null);
                }}
                title="¿Quitar ejercicio?"
                message="Se eliminará este ejercicio y sus series de la sesión actual."
                confirmText="Quitar"
                cancelText="Cancelar"
                variant="warning"
            />
        </div >
    );
}

function DraggableActiveExerciseItem({ exercise, session, user, setDeleteExerciseId, navigateToExercise }: any) {
    const controls = useDragControls();

    const entry = session.entries.find((e: any) => e.exerciseId === exercise!.id);
    const isStarted = !!entry;
    const isCompleted = entry?.sets.every((s: any) => s.isCompleted) && entry?.sets.length >= exercise!.targetSets;

    return (
        <Reorder.Item
            value={exercise}
            style={{ listStyle: 'none' }}
            dragListener={false}
            dragControls={controls}
        >
            <SwipeableRow
                onDelete={() => {
                    setDeleteExerciseId(String(exercise!.id));
                }}
            >
                <div className="flex items-center gap-2">
                    <div
                        className="cursor-grab active:cursor-grabbing text-[var(--color-text-muted)] opacity-50 hover:opacity-100 p-2 -m-2 touch-none"
                        onPointerDown={(e) => controls.start(e)}
                    >
                        <GripVertical size={20} />
                    </div>
                    <div className="flex-1">
                        <ExerciseListCard
                            exercise={exercise!}
                            status={isCompleted ? 'completed' : isStarted ? 'active' : 'pending'}
                            lastLog="80kg x 8"
                            onClick={() => navigateToExercise(exercise!.id)}
                        />
                    </div>
                </div>
            </SwipeableRow>
        </Reorder.Item>
    );
}
