import Dexie, { type EntityTable } from 'dexie';

export interface Exercise {
    id: number;
    name: string;
    muscleGroup: string;
    equipmentType: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable';
    defaultRestSeconds: number;
    targetSets: number;
    targetRepsRange: string;
}

export interface Routine {
    id: number;
    name: string;
    exerciseIds: number[];
}

export interface SetEntry {
    setNumber: number;
    weight: number;
    reps: number;
    completedAt: number;
    rir?: number;
    isCompleted: boolean;
}

export interface ExerciseEntry {
    exerciseId: number;
    sets: SetEntry[];
}

export interface WorkoutSession {
    id: number;
    routineId?: number;
    name: string; // "Empuje - Pecho/Hombro"
    startTime: number;
    endTime?: number;
    durationSeconds: number;
    state: 'active' | 'completed';
    notes?: string;
    entries: ExerciseEntry[];
}

export interface BodyWeightRecord {
    id?: number;
    date: number;
    weight: number;
    note?: string;
}

// Database Declaration
const db = new Dexie('GymTrackerDB') as Dexie & {
    exercises: EntityTable<Exercise, 'id'>,
    routines: EntityTable<Routine, 'id'>,
    sessions: EntityTable<WorkoutSession, 'id'>,
    bodyWeight: EntityTable<BodyWeightRecord, 'id'>
};

db.version(1).stores({
    exercises: '++id, name, muscleGroup',
    routines: '++id, name',
    sessions: '++id, startTime, state, routineId'
});

db.version(2).stores({
    bodyWeight: '++id, date'
});

export { db };

// Seeding Function
export async function seedDatabase() {
    const count = await db.exercises.count();
    if (count > 0) return; // Already seeded

    const exercisesData: Omit<Exercise, 'id'>[] = [
        { name: 'Press de Banca Plano', muscleGroup: 'Pecho', equipmentType: 'barbell', defaultRestSeconds: 120, targetSets: 4, targetRepsRange: '8-10' },
        { name: 'Press Militar con Barra', muscleGroup: 'Hombro', equipmentType: 'barbell', defaultRestSeconds: 90, targetSets: 3, targetRepsRange: '10' },
        { name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', equipmentType: 'dumbbell', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '12' },
        { name: 'Elevaciones Laterales', muscleGroup: 'Hombro', equipmentType: 'dumbbell', defaultRestSeconds: 60, targetSets: 4, targetRepsRange: '15' },
        { name: 'Press Francés', muscleGroup: 'Tríceps', equipmentType: 'barbell', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '10-12' },
        { name: 'Extensiones de Tríceps en Polea', muscleGroup: 'Tríceps', equipmentType: 'cable', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '12-15' },
    ];

    const ids = await db.exercises.bulkAdd(exercisesData as any);
    // ids is usually the last inserted ID in Dexie for bulkAdd? No, bulkAdd returns lastKey. 
    // We need to fetch them back to be sure of IDs or trust auto-increment 1..6

    // Create Routine
    await db.routines.add({
        name: 'Empuje - Pecho/Hombro',
        exerciseIds: [1, 2, 3, 4, 5, 6] // Assuming IDs 1-6
    } as any);

    console.log('Database seeded!');
}
