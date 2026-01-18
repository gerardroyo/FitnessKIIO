'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import {
    User,
    signInWithRedirect,
    signInWithPopup,
    getRedirectResult,
    setPersistence,
    browserLocalPersistence,
    signOut as firebaseSignOut,
    onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import LoadingScreen from '@/components/LoadingScreen';

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

    const redirectCheckRef = useRef(false);

    useEffect(() => {
        console.log("AuthProvider mounted. URL:", window.location.href);

        let redirectCheckDone = false;
        let authStateKnown = false;

        const checkDone = () => {
            if (redirectCheckDone && authStateKnown) {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            console.log("Auth state changed:", user ? `User ${user.uid}` : "No user");
            setUser(user);
            authStateKnown = true;
            // If we have a user, we are definitely done loading
            if (user) {
                setLoading(false);
            } else {
                checkDone();
            }
        });

        // Check for redirect errors only once
        if (!redirectCheckRef.current) {
            redirectCheckRef.current = true;
            getRedirectResult(auth)
                .then((result) => {
                    console.log("Redirect result:", result ? `Success ${result.user.uid}` : "No result");
                })
                .catch((error) => {
                    console.error('Error in redirect result:', error);
                    setAuthError(error.message);
                })
                .finally(() => {
                    redirectCheckDone = true;
                    checkDone();
                });
        } else {
            redirectCheckDone = true;
            checkDone();
        }

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        try {
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

            // Set persistence to local (default, but explicit ensures consistency)
            await setPersistence(auth, browserLocalPersistence);

            if (isMobile) {
                // Mobile: Redirect to avoid popup blockers and PWA context issues
                await signInWithRedirect(auth, googleProvider);
            } else {
                // Desktop: Popup is preferred for UX and dev reliability
                await signInWithPopup(auth, googleProvider);
            }
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

    if (loading) {
        return <LoadingScreen />;
    }

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
