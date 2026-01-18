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
        console.log(`[Auth] ${msg}`);
        setDebugLogs(prev => [`${new Date().toLocaleTimeString()} ${msg}`, ...prev]);
    };

    useEffect(() => {
        addLog("Init AuthProvider");

        // Listen for auth state changes
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            addLog(`Auth Changed: ${currentUser ? currentUser.uid : 'null'}`);
            setUser(currentUser);
            setLoading(false);
        });

        // Check for redirect result (legacy/mobile flow)
        getRedirectResult(auth)
            .then((result) => {
                if (result) {
                    addLog(`Redirect Success: ${result.user.uid}`);
                    setUser(result.user);
                } else {
                    addLog("Redirect Result: null");
                }
            })
            .catch((err) => {
                addLog(`Redirect Error: ${err.message}`);
                setAuthError(err.message);
            });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        // Default to Popup for stability unless explicitly mobile AND secure
        // But user reported redirect fails everywhere. 
        // Let's try to trust the platform default via a simple toggle or just use Popup by default
        // as requested by the user's latest "it works" comment for popup.
        await signInWithGooglePopup();
    };

    const signInWithGoogleRedirect = async () => {
        try {
            addLog("Starting Redirect...");
            await signInWithRedirect(auth, googleProvider);
        } catch (error: any) {
            addLog(`Redirect Start Error: ${error.message}`);
            setAuthError(error.message);
        }
    };

    const signInWithGooglePopup = async () => {
        try {
            addLog("Starting Popup...");
            await signInWithPopup(auth, googleProvider);
        } catch (error: any) {
            addLog(`Popup Error: ${error.message}`);
            setAuthError(error.message);
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
