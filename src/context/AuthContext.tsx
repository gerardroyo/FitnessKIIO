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
    debugInfo: string; // Added for debugging
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('Init...');

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log('Auth Changed:', user?.email);
            setDebugInfo(prev => prev + `\nAuth: ${user ? user.email : 'null'}`);
            setUser(user);
            setLoading(false);
        });

        // Check for redirect result
        setDebugInfo(prev => prev + '\nChecking Redirect...');
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    console.log('Redirect Success:', result.user.email);
                    setDebugInfo(prev => prev + `\nRedirect OK: ${result.user.email}`);
                } else {
                    console.log('Redirect: No result');
                    setDebugInfo(prev => prev + '\nRedirect: null');
                }
            })
            .catch((error) => {
                console.error('Redirect Error:', error);
                setAuthError(error.message);
                setDebugInfo(prev => prev + `\nRedirect Err: ${error.code}`);
            });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            setDebugInfo(prev => prev + '\nStarting Sign in (Popup)...');
            await setPersistence(auth, browserLocalPersistence);
            // Popup gives immediate feedback.
            await signInWithPopup(auth, googleProvider); // Changed from signInWithRedirect
        } catch (error: any) {
            console.error('Error starting Google sign in:', error);
            setAuthError(error.message);
            setDebugInfo(prev => prev + `\nSign In Err: ${error.message} (${error.code})`); // Updated debug info
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
        <AuthContext.Provider value={{ user, loading, authError, debugInfo, signInWithGoogle, signOut }}>
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
