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
    debugLogs: string[];
    signInWithGoogle: () => Promise<void>;
    signInWithGoogleRedirect: () => Promise<void>;
    signInWithGooglePopup: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setDebugLogs(prev => [`[${time}] ${msg}`, ...prev]);
        console.log(`[AuthDebug] ${msg}`);
    };

    const redirectCheckRef = useRef(false);

    useEffect(() => {
        const isSecure = window.isSecureContext;
        addLog(`AuthProvider mounted. Secure: ${isSecure}. URL: ${window.location.href}`);

        let redirectCheckDone = false;
        let authStateKnown = false;

        const checkDone = () => {
            if (redirectCheckDone && authStateKnown) {
                setLoading(false);
            }
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            addLog(`Auth state changed: ${user ? `User ${user.uid}` : "No user"}`);
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
            addLog("Checking getRedirectResult...");
            getRedirectResult(auth)
                .then((result) => {
                    addLog(`Redirect result: ${result ? `Success ${result.user.uid}` : "No result"}`);
                })
                .catch((error) => {
                    addLog(`Error in redirect result: ${error.message}`);
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
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        addLog(`Sign in requested. Mobile: ${isMobile}`);
        if (isMobile) {
            await signInWithGoogleRedirect();
        } else {
            await signInWithGooglePopup();
        }
    };

    const signInWithGoogleRedirect = async () => {
        try {
            addLog("Starting Google Redirect...");
            await setPersistence(auth, browserLocalPersistence);
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            addLog(`Error starting Google redirect: ${error.message}`);
            setAuthError(error.message);
            throw error;
        }
    };

    const signInWithGooglePopup = async () => {
        try {
            addLog("Starting Google Popup...");
            await setPersistence(auth, browserLocalPersistence);
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            addLog(`Error starting Google popup: ${error.message}`);
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
        <AuthContext.Provider value={{ user, loading, authError, debugLogs, signInWithGoogle, signInWithGoogleRedirect, signInWithGooglePopup, signOut }}>
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
