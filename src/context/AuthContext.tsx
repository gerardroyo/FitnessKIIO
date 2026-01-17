'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    signInWithPopup, // Revert to Popup
    getRedirectResult, // Added
    setPersistence,
    browserLocalPersistence,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    authError: string | null;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            console.error('Error starting Google sign in:', error);
            setAuthError(error.message);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await firebaseSignOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, authError, signInWithGoogle, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
