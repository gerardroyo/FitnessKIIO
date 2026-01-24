'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Mail } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const { user, loading, signInWithGoogle, authError } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    const [isSigningIn, setIsSigningIn] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGoogleSignIn = async () => {
        try {
            setError(null);
            setIsSigningIn(true);
            await signInWithGoogle();
        } catch (error: any) {
            console.error('Login failed:', error);
            setError(error.message || 'Error al iniciar sesión');
            setIsSigningIn(false);
        }
    };

    if (user) return null;

    return (
        <div className="relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden bg-[#0a0f0a] px-6 py-12">

            {/* Ambient green glows */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--color-primary)]/10 rounded-full blur-[150px] -translate-y-1/2" />
            <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-[var(--color-primary)]/5 rounded-full blur-[120px]" />

            {/* Top Section - Logo and Tagline */}
            <div className="relative z-10 flex flex-col items-center pt-8">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-8"
                >
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                        className="relative w-24 h-24 rounded-3xl overflow-hidden"
                        style={{
                            boxShadow: '0 10px 40px -10px rgba(0, 255, 128, 0.3), 0 0 20px rgba(0, 255, 128, 0.1)'
                        }}
                    >
                        <Image
                            src="/icon.png"
                            alt="FitnessKIIO Logo"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </motion.div>

                {/* Brand Name */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="flex flex-col items-center mb-16"
                >
                    <h1 className="text-[2rem] font-bold tracking-tight">
                        <span className="text-white">Fitness</span>
                        <span className="text-[var(--color-primary)] italic font-bold">KIIO</span>
                    </h1>
                    {/* Green underline */}
                    <div className="w-8 h-[3px] bg-[var(--color-primary)] rounded-full mt-3" />
                </motion.div>

                {/* Tagline */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                >
                    <p className="text-zinc-400 text-lg">
                        Consistencia es la clave.
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-600 font-medium">
                        Tu compañero personal
                    </p>
                </motion.div>
            </div>

            {/* Middle Section - Buttons */}
            <div className="relative z-10 w-full max-w-xs flex flex-col items-center">

                {/* Error Message */}
                {(authError || error) && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 text-center"
                    >
                        {authError || error}
                    </motion.div>
                )}

                {/* Google Sign In Button - Main CTA */}
                <motion.button
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 40px rgba(0, 255, 128, 0.6)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="relative w-full h-14 bg-[var(--color-primary)] hover:opacity-90 rounded-full font-semibold text-black flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-20 border-2 border-[var(--color-primary)]/50"
                    style={{
                        boxShadow: '0 0 30px rgba(0, 255, 128, 0.4), 0 0 60px rgba(0, 255, 128, 0.2), inset 0 1px 0 rgba(255,255,255,0.2)'
                    }}
                >
                    {isSigningIn ? (
                        <motion.div
                            className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                    ) : (
                        <>
                            {/* Google G Logo - Multicolor */}
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            </div>
                            <span className="text-base font-semibold">Continuar con Google</span>
                        </>
                    )}
                </motion.button>
            </div>

            {/* Footer */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="relative z-10"
            >
                <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-700 font-medium">
                    v1.1
                </p>
            </motion.div>
        </div>
    );
}
