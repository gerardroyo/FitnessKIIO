'use client';

import { useEffect, useState } from 'react';
import { seedDatabase, db, Routine } from '@/lib/db';
import { useActiveSession } from '@/hooks/use-workout';
import { MobileLayout } from '@/components/MobileLayout';
import { ActiveWorkoutView } from '@/components/ActiveWorkoutView';
import { DashboardView } from '@/components/DashboardView';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Calendar, Dumbbell } from 'lucide-react';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [showRoutineSelector, setShowRoutineSelector] = useState(false);
  const session = useActiveSession();
  const routines = useLiveQuery(() => db.routines.toArray());

  useEffect(() => {
    seedDatabase().then(() => setIsClient(true));
  }, []);

  const handleStartWorkout = async () => {
    const active = await db.sessions.where('state').equals('active').first();
    if (active) return;

    // If multiple routines, show selector
    if (routines && routines.length > 1) {
      setShowRoutineSelector(true);
    } else if (routines && routines.length === 1) {
      // Only one routine, use it directly
      await startSessionWithRoutine(routines[0]);
    } else {
      // No routines, start empty session
      await db.sessions.add({
        name: 'Entrenamiento Libre',
        startTime: Date.now(),
        state: 'active',
        durationSeconds: 0,
        entries: []
      });
    }
  };

  const startSessionWithRoutine = async (routine: Routine) => {
    // Pre-populate entries with routine exercises
    const entries = routine.exerciseIds.map(exerciseId => ({
      exerciseId,
      sets: []
    }));

    await db.sessions.add({
      name: routine.name,
      routineId: routine.id,
      startTime: Date.now(),
      state: 'active',
      durationSeconds: 0,
      entries
    });
    setShowRoutineSelector(false);
  };

  if (!isClient) return null;

  return (
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
                  await db.sessions.add({
                    name: 'Entrenamiento Libre',
                    startTime: Date.now(),
                    state: 'active',
                    durationSeconds: 0,
                    entries: []
                  });
                  setShowRoutineSelector(false);
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
  );
}

