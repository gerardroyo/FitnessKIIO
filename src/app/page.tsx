'use client';

import { useEffect, useState } from 'react';
import { Routine } from '@/lib/db'; // Keep interface
import { useActiveSession, useRoutines } from '@/hooks/useFirestore';
import { saveSession } from '@/lib/firestore';
import { MobileLayout } from '@/components/MobileLayout';
import { ActiveWorkoutView } from '@/components/ActiveWorkoutView';
import { DashboardView } from '@/components/DashboardView';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { X, Calendar, Dumbbell } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const [showNoRoutinesModal, setShowNoRoutinesModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter(); // Need router for redirect

  // Use Firestore Hooks
  const { session, loading: sessionLoading } = useActiveSession();
  const { routines, loading: routinesLoading } = useRoutines();

  // Combined loading state
  const isLoading = sessionLoading || routinesLoading;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const startFreeWorkout = async () => {
    if (!user) return;
    try {
      await saveSession(user.uid, {
        name: 'Entrenamiento Libre',
        startTime: Date.now(),
        state: 'active',
        durationSeconds: 0,
        entries: []
      });
      setShowNoRoutinesModal(false);
    } catch (e) {
      console.error("Error starting session:", e);
    }
  };

  const handleStartWorkout = async () => {
    if (!user || session) return;

    // If multiple routines, show selector
    if (routines && routines.length > 1) {
      setShowRoutineSelector(true);
    } else if (routines && routines.length === 1) {
      // Only one routine, use it directly
      await startSessionWithRoutine(routines[0]);
    } else {
      // No routines - Show Warning Modal instead of direct start
      setShowNoRoutinesModal(true);
    }
  };

  const startSessionWithRoutine = async (routine: Routine) => {
    if (!user) return;

    // Pre-populate entries with routine exercises
    // routine.exerciseIds are numbers or strings. 
    // If they are from Firestore, they are strings.
    const entries = routine.exerciseIds.map(exerciseId => ({
      exerciseId: String(exerciseId), // Ensure string
      sets: []
    }));

    try {
      await saveSession(user.uid, {
        name: routine.name,
        routineId: Number(routine.id) ? undefined : String(routine.id), // Store string ID if possible
        startTime: Date.now(),
        state: 'active',
        durationSeconds: 0,
        entries
      });
      setShowRoutineSelector(false);
    } catch (e) {
      console.error("Error starting routine session:", e);
    }
  };

  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-gray-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center overflow-hidden border border-[var(--color-primary)]/20 animate-pulse">
            <img src="/icon-512.png" alt="Loading..." className="w-full h-full object-cover" />
          </div>
          <p className="text-sm font-medium text-[var(--color-primary)] animate-pulse">FitnessKIIO</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <MobileLayout>
        {!session ? (
          <DashboardView onStart={handleStartWorkout} />
        ) : (
          <ActiveWorkoutView session={session} />
        )}

        {/* Routine Selector Modal */}
        {showRoutineSelector && routines && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-end">
            <div className="bg-[var(--color-background)] w-full max-h-[70vh] rounded-t-3xl overflow-hidden">
              <div className="sticky top-0 bg-[var(--color-background)] p-4 border-b border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                <h2 className="font-bold text-lg">Elegir Rutina</h2>
                <button onClick={() => setShowRoutineSelector(false)}>
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 space-y-3 overflow-y-auto max-h-[55vh]">
                {routines.map((routine) => (
                  <button
                    key={routine.id}
                    onClick={() => startSessionWithRoutine(routine)}
                    className="w-full bg-[var(--color-surface)] rounded-xl p-4 flex items-center gap-4 active:scale-98 transition-transform border border-[rgba(255,255,255,0.05)]"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                      <Calendar size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="font-bold text-white">{routine.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{routine.exerciseIds.length} ejercicios</p>
                    </div>
                  </button>
                ))}

                {/* Free Training Option */}
                <button
                  onClick={async () => {
                    if (user) {
                      await saveSession(user.uid, {
                        name: 'Entrenamiento Libre',
                        startTime: Date.now(),
                        state: 'active',
                        durationSeconds: 0,
                        entries: []
                      });
                      setShowRoutineSelector(false);
                    }
                  }}
                  className="w-full bg-[var(--color-surface)] rounded-xl p-4 flex items-center gap-4 active:scale-98 transition-transform border border-dashed border-[var(--color-primary)]/30"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#1f3a2f]/50 flex items-center justify-center text-[var(--color-text-muted)]">
                    <Dumbbell size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-white">Entrenamiento Libre</p>
                    <p className="text-xs text-[var(--color-text-muted)]">Sin rutina predefinida</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}
      </MobileLayout>

      {/* No Routines Warning Modal */}
      <AnimatePresence>
        {showNoRoutinesModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50"
              onClick={() => setShowNoRoutinesModal(false)}
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
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 mx-auto mb-4 flex items-center justify-center">
                    <Dumbbell className="text-orange-500" size={24} />
                  </div>

                  <h2 className="font-bold text-xl mb-2">No tienes rutinas</h2>
                  <p className="text-[var(--color-text-muted)] text-sm mb-6">
                    Para sacar el máximo partido a la app, te recomendamos crear una rutina personalizada. ¿Qué prefieres hacer?
                  </p>

                  <div className="space-y-3">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => router.push('/routines')}
                      className="w-full bg-[var(--color-primary)] text-black font-bold p-4 rounded-xl"
                    >
                      Crear Rutina (Recomendado)
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={startFreeWorkout}
                      className="w-full bg-[var(--color-surface)] border border-[rgba(255,255,255,0.1)] text-white font-bold p-4 rounded-xl"
                    >
                      Entrenamiento Libre
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowNoRoutinesModal(false)}
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
    </ProtectedRoute >
  );
}

