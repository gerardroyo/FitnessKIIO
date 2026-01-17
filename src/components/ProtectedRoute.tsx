'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400">Verificando sesión...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Show a simple message while redirecting to avoid complete blank screen
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-gray-400">
                Redirigiendo al inicio de sesión...
            </div>
        );
    }

    return <>{children}</>;
}
