
import {
    collection,
    doc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    Timestamp,
    limit,
    getDoc,
    setDoc
} from 'firebase/firestore';
import { firestore } from './firebase';
import { Exercise, Routine, WorkoutSession, BodyWeightRecord } from './db';

// --- Type Conversions ---
// Firestore stores dates as Timestamp, we use number (millis) in app
const convertTimestamp = (ts: any): number => {
    if (ts instanceof Timestamp) return ts.toMillis();
    return ts || Date.now();
};

// --- Exercises ---
export const getUserExercises = async (userId: string): Promise<Exercise[]> => {
    const q = query(collection(firestore, `users/${userId}/exercises`), orderBy('name'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as unknown as Exercise));
};

export const addUserExercise = async (userId: string, exercise: Omit<Exercise, 'id'>) => {
    const docRef = await addDoc(collection(firestore, `users/${userId}/exercises`), exercise);
    return docRef.id;
};

export const updateExercise = async (userId: string, exerciseId: string, updates: Partial<Exercise>) => {
    const docRef = doc(firestore, `users/${userId}/exercises`, exerciseId);
    await updateDoc(docRef, updates as any);
};

// --- Routines ---
// Storing routines with exerciseIds (strings in Firestore, but we need to map them)
export const getUserRoutines = async (userId: string): Promise<Routine[]> => {
    const q = query(collection(firestore, `users/${userId}/routines`));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as unknown as Routine));
};

export const addUserRoutine = async (userId: string, routine: Omit<Routine, 'id'>) => {
    const docRef = await addDoc(collection(firestore, `users/${userId}/routines`), routine);
    return docRef.id;
};

export const updateRoutine = async (userId: string, routineId: string, updates: Partial<Routine>) => {
    const docRef = doc(firestore, `users/${userId}/routines`, routineId);
    await updateDoc(docRef, updates as any);
};

export const deleteRoutine = async (userId: string, routineId: string) => {
    const docRef = doc(firestore, `users/${userId}/routines`, routineId);
    await deleteDoc(docRef);
};

// --- Sessions ---
export const getUserSessions = async (userId: string, limitCount = 20): Promise<WorkoutSession[]> => {
    const q = query(
        collection(firestore, `users/${userId}/sessions`),
        orderBy('startTime', 'desc'),
        limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            startTime: convertTimestamp(data.startTime),
            endTime: data.endTime ? convertTimestamp(data.endTime) : undefined
        } as unknown as WorkoutSession;
    });
};

export const getActiveSession = async (userId: string): Promise<WorkoutSession | null> => {
    const q = query(
        collection(firestore, `users/${userId}/sessions`),
        where('state', '==', 'active'),
        limit(1)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        startTime: convertTimestamp(data.startTime)
    } as unknown as WorkoutSession;
};

export const getSession = async (userId: string, sessionId: string): Promise<WorkoutSession | null> => {
    const docRef = doc(firestore, `users/${userId}/sessions`, sessionId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        id: docSnap.id,
        ...data,
        startTime: convertTimestamp(data.startTime)
    } as unknown as WorkoutSession;
};

export const saveSession = async (userId: string, session: Omit<WorkoutSession, 'id'>) => {
    // Convert millis to Dates if needed, or store as numbers. Firestore can handle numbers.
    // Ensure deep objects like 'entries' are plain objects.
    const docRef = await addDoc(collection(firestore, `users/${userId}/sessions`), session);
    return docRef.id;
};

export const updateSession = async (userId: string, sessionId: string, updates: Partial<WorkoutSession>) => {
    const docRef = doc(firestore, `users/${userId}/sessions`, sessionId);
    await updateDoc(docRef, updates as any);
};

export const deleteSession = async (userId: string, sessionId: string): Promise<void> => {
    const docRef = doc(firestore, `users/${userId}/sessions`, sessionId);
    await deleteDoc(docRef);
};

// --- Weight ---
export const getWeightRecords = async (userId: string): Promise<BodyWeightRecord[]> => {
    const q = query(collection(firestore, `users/${userId}/weight_records`), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            date: convertTimestamp(data.date)
        } as unknown as BodyWeightRecord;
    });
};

export const addWeightRecord = async (userId: string, record: Omit<BodyWeightRecord, 'id'>) => {
    const docRef = await addDoc(collection(firestore, `users/${userId}/weight_records`), {
        ...record,
        date: Timestamp.fromMillis(record.date)
    });
    return docRef.id;
};

export const deleteWeightRecord = async (userId: string, recordId: string) => {
    await deleteDoc(doc(firestore, `users/${userId}/weight_records`, recordId));
};

// --- Seeding ---
export const seedDefaultExercises = async (userId: string) => {
    const existing = await getUserExercises(userId);
    if (existing.length > 0) return;

    const defaults = [
        { name: 'Press de Banca Plano', muscleGroup: 'Pecho', equipmentType: 'barbell', defaultRestSeconds: 120, targetSets: 4, targetRepsRange: '8-10' },
        { name: 'Press Militar con Barra', muscleGroup: 'Hombro', equipmentType: 'barbell', defaultRestSeconds: 90, targetSets: 3, targetRepsRange: '10' },
        { name: 'Aperturas con Mancuernas', muscleGroup: 'Pecho', equipmentType: 'dumbbell', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '12' },
        { name: 'Elevaciones Laterales', muscleGroup: 'Hombro', equipmentType: 'dumbbell', defaultRestSeconds: 60, targetSets: 4, targetRepsRange: '15' },
        { name: 'Press Francés', muscleGroup: 'Tríceps', equipmentType: 'barbell', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '10-12' },
        { name: 'Extensiones de Tríceps en Polea', muscleGroup: 'Tríceps', equipmentType: 'cable', defaultRestSeconds: 60, targetSets: 3, targetRepsRange: '12-15' },
    ];

    const batch = [];
    for (const ex of defaults) {
        await addUserExercise(userId, ex as any);
    }
};
