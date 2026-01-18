'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Dumbbell } from 'lucide-react';

export default function LoginPage() {
    const { user, loading, signInWithGoogle, signInWithGooglePopup, authError, debugLogs } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    // State to track if redirection has started
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setIsRedirecting(true);
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Login failed:', error);
            setError(error.message || 'Error al iniciar sesión');
            setIsRedirecting(false);
        }
    };

    if (user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] flex flex-col items-center justify-center p-6">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary)]/10 via-transparent to-transparent pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                {/* Logo */}
                <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[var(--color-primary)] to-[#059669] flex items-center justify-center mb-6 shadow-xl shadow-[var(--color-primary)]/20">
                    <Dumbbell size={48} className="text-white" />
                </div>

                {/* App Name */}
                <h1 className="text-4xl font-bold text-white mb-2">FitnessKIIO</h1>
                <p className="text-[var(--color-text-muted)] text-center mb-12">
                    Tu compañero de entrenamiento personal
                </p>

                {/* Login Card */}
                <div className="w-full bg-[var(--color-surface)] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)]">
                    <h2 className="text-xl font-semibold text-white text-center mb-6">
                        Iniciar Sesión
                    </h2>

                    {/* Global Auth Error (from Redirect) */}
                    {authError && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">
                            Error de redirección: {authError}
                        </div>
                    )}

                    {/* Local Error */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 text-sm p-3 rounded-xl mb-4 text-center">
                            {error}
                        </div>
                    )}

                    {/* Google Sign In Button */}
                    <button
                        onClick={handleGoogleSignIn}
                        disabled={isRedirecting}
                        className="w-full bg-white hover:bg-gray-100 disabled:opacity-70 disabled:cursor-wait text-gray-800 font-medium py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98]"
                    >
                        {isRedirecting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-gray-800 border-t-transparent rounded-full animate-spin" />
                                Iniciando sesión...
                            </>
                        ) : (
                            <>
                                {/* Google Icon */}
                                <svg width="20" height="20" viewBox="0 0 24 24">
                                    <path
                                        fill="#4285F4"
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                    />
                                    <path
                                        fill="#34A853"
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                    />
                                    <path
                                        fill="#FBBC05"
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                    />
                                    <path
                                        fill="#EA4335"
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                    />
                                </svg>
                                Continuar con Google
                            </>
                        )}
                    </button>

                    {/* Fallback for issues */}
                    <button
                        onClick={async () => {
                            try {
                                setError(null);
                                setIsRedirecting(true);
                                await signInWithGooglePopup();
                            } catch (error: any) {
                                console.error('Popup Login failed:', error);
                                setError(error.message || 'Error al iniciar sesión con Popup');
                                setIsRedirecting(false);
                            }
                        }}
                        disabled={isRedirecting}
                        className="mt-4 text-xs text-gray-400 underline hover:text-white transition-colors w-full text-center"
                    >
                        ¿Problemas? Prueba el modo alternativo (Popup)
                    </button>
                </div>

                {/* Debug Logs Section */}
                <div className="mt-8 w-full max-w-sm">
                    <details className="bg-black/40 rounded-lg border border-white/10">
                        <summary className="p-3 text-xs text-gray-400 cursor-pointer hover:text-white select-none">
                            Ver registros de depuración
                        </summary>
                        <div className="p-3 max-h-40 overflow-y-auto text-[10px] font-mono text-gray-500 whitespace-pre-wrap flex flex-col gap-1">
                            {!window.isSecureContext && (
                                <div className="text-red-400 font-bold mb-2">
                                    ⚠️ INSECURE CONTEXT detected. Mobile redirects may fail on HTTP.
                                </div>
                            )}
                            {debugLogs.map((log, i) => (
                                <div key={i} className="border-b border-white/5 pb-1 last:border-0">{log}</div>
                            ))}
                            {debugLogs.length === 0 && <div>No logs yet...</div>}
                        </div>
                    </details>
                </div>

                {/* Footer */}
                <p className="text-xs text-[var(--color-text-muted)] mt-8 text-center">
                    Al continuar, aceptas nuestros términos y condiciones
                </p>
            </div>
        </div>
    );
}
