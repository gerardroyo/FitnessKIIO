import { useLiveQuery } from "dexie-react-hooks";
import { db, type WorkoutSession } from "@/lib/db";

export function useActiveSession() {
    return useLiveQuery(async () => {
        const active = await db.sessions
            .where('state')
            .equals('active')
            .first();
        return active;
    });
}

export function useExercises(ids?: number[]) {
    return useLiveQuery(async () => {
        if (!ids || ids.length === 0) return [];
        return await db.exercises.bulkGet(ids);
    }, [ids]);
}
