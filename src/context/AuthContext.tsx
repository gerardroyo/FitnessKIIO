'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,

    signInWithRedirect,
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
    authError: string | null; // Added
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null); // Added

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        // Check for redirect result
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log('Redirect Sign-in Successful:', result.user.email);
                }
            })
            .catch((error) => {
                console.error('Redirect Sign-in Error:', error);
                setAuthError(error.message);
            });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            await signInWithRedirect(auth, googleProvider);
        } catch (error) {
            console.error('Error starting Google sign in:', error);
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
