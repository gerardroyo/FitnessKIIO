
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { firestore } from './firebase';

export interface UserSettings {
    customCategories?: string[];
    // Add other settings here
}

export const getUserSettings = async (userId: string): Promise<UserSettings> => {
    const docRef = doc(firestore, `users/${userId}/settings/general`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        return snap.data() as UserSettings;
    }
    return {};
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>) => {
    const docRef = doc(firestore, `users/${userId}/settings/general`);
    // Use setDoc with merge to ensure document exists
    await setDoc(docRef, settings, { merge: true });
};
