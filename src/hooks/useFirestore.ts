
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    where,
    limit
} from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { Exercise, Routine, WorkoutSession, BodyWeightRecord } from '@/lib/db';
import { seedDefaultExercises } from '@/lib/firestore';

export function useExercises() {
    const { user } = useAuth();
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setExercises([]);
            setLoading(false); // Fix: stop loading if no user
            return;
        }

        const q = query(collection(firestore, `users/${user.uid}/exercises`), orderBy('name'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as unknown as Exercise[];
            setExercises(data);
            setLoading(false);

            if (data.length === 0) {
                seedDefaultExercises(user.uid);
            }
        });

        return () => unsubscribe();
    }, [user]);

    return { exercises, loading };
}

export function useRoutines() {
    const { user } = useAuth();
    const [routines, setRoutines] = useState<Routine[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRoutines([]);
            setLoading(false); // Fix: stop loading if no user
            return;
        }

        const q = query(collection(firestore, `users/${user.uid}/routines`));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as unknown as Routine[];
            setRoutines(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { routines, loading };
}

export function useActiveSession() {
    const { user } = useAuth();
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSession(null);
            setLoading(false); // Fix: stop loading if no user
            return;
        }

        const q = query(
            collection(firestore, `users/${user.uid}/sessions`),
            where('state', '==', 'active'),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setSession(null);
            } else {
                const doc = snapshot.docs[0];
                const data = doc.data();
                setSession({
                    id: doc.id,
                    ...data,
                    startTime: data.startTime?.toMillis?.() || data.startTime || Date.now()
                } as unknown as WorkoutSession);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    return { session, loading };
}

export function useWeightRecords() {
    const { user } = useAuth();
    const [records, setRecords] = useState<BodyWeightRecord[]>([]);

    useEffect(() => {
        if (!user) {
            setRecords([]);
            return;
        }

        const q = query(
            collection(firestore, `users/${user.uid}/weight_records`),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toMillis?.() || doc.data().date
            })) as unknown as BodyWeightRecord[];
            setRecords(data);
        });

        return () => unsubscribe();
    }, [user]);

    return records;
}
