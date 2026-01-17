// Database Interfaces
// Keeping these as shared types for now

export interface Exercise {
    id: number | string;
    name: string;
    muscleGroup: string;
    equipmentType: 'barbell' | 'dumbbell' | 'machine' | 'bodyweight' | 'cable';
    defaultRestSeconds: number;
    targetSets: number;
    targetRepsRange: string;
}

export interface Routine {
    id: number | string;
    name: string;
    exerciseIds: (number | string)[];
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
    exerciseId: string; // Enforce string for Firestore
    sets: SetEntry[];
}

export interface WorkoutSession {
    id: number | string;
    routineId?: string; // String ID
    name: string;
    startTime: number;
    endTime?: number;
    durationSeconds: number;
    state: 'active' | 'completed';
    notes?: string;
    entries: ExerciseEntry[];
}

export interface BodyWeightRecord {
    id?: number | string;
    date: number;
    weight: number;
    note?: string;
}
