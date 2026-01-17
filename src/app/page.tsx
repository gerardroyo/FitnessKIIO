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

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const { user } = useAuth();

  // Use Firestore Hooks
  const { session, loading: sessionLoading } = useActiveSession();
  const { routines, loading: routinesLoading } = useRoutines();

  // Combined loading state
  const isLoading = sessionLoading || routinesLoading;

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStartWorkout = async () => {
    if (!user || session) return;

    // If multiple routines, show selector
    if (routines && routines.length > 1) {
      setShowRoutineSelector(true);
    } else if (routines && routines.length === 1) {
      // Only one routine, use it directly
      await startSessionWithRoutine(routines[0]);
    } else {
      // No routines, start empty session
      try {
        await saveSession(user.uid, {
          name: 'Entrenamiento Libre',
          startTime: Date.now(),
          state: 'active',
          durationSeconds: 0,
          entries: []
        });
      } catch (e) {
        console.error("Error starting session:", e);
      }
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
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Iniciando...</p>
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
    </ProtectedRoute>
  );
}

