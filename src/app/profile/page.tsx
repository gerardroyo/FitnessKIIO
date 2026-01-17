'use client';

import { useWeightRecords } from '@/hooks/useFirestore';
import { addWeightRecord, deleteWeightRecord } from '@/lib/firestore';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, User, Plus, Trash2, Calendar, TrendingUp, LogOut } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { AnimatePresence, motion } from 'framer-motion';
import { ConfirmModal } from '@/components/ConfirmModal';
import { SwipeableRow } from '@/components/SwipeableRow';

export default function ProfilePage() {
    const router = useRouter();
    const { user, signOut } = useAuth();
    const [weightInput, setWeightInput] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [deleteWeightModal, setDeleteWeightModal] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null
    });

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Use Firestore Hook
    const weightRecords = useWeightRecords();

    const chartData = weightRecords
        ? [...weightRecords].reverse().map(r => ({
            ...r,
            dateStr: new Date(r.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
        }))
        : [];

    const currentWeight = weightRecords?.[0]?.weight || 0;
    const startWeight = weightRecords?.[weightRecords.length - 1]?.weight || 0;
    const difference = currentWeight && startWeight ? (currentWeight - startWeight).toFixed(1) : '0';

    const handleAddWeight = async () => {
        const weight = parseFloat(weightInput);
        if (!weight || isNaN(weight) || !user) return;

        try {
            await addWeightRecord(user.uid, {
                date: Date.now(),
                weight: weight
            });
            setWeightInput('');
            setIsAdding(false);
        } catch (error) {
            console.error("Error adding weight:", error);
        }
    };

    const handleDeleteClick = (id?: string | number) => {
        if (!id) return;
        setDeleteWeightModal({ isOpen: true, id: String(id) });
    };

    const handleConfirmDelete = async () => {
        if (!deleteWeightModal.id || !user) return;
        try {
            await deleteWeightRecord(user.uid, deleteWeightModal.id);
        } catch (error) {
            console.error("Error deleting weight:", error);
        }
    };

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-background)] pb-20">
                {/* Header */}
                {/* Header */}
                <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg">Perfil</h1>
                        <button onClick={handleLogoutClick} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors">
                            <LogOut size={24} />
                        </button>
                    </div>
                </header>

                <div className="p-4 space-y-6">
                    {/* User Info Card */}
                    <div className="bg-[var(--color-surface)] p-6 rounded-2xl border border-[rgba(255,255,255,0.05)] flex items-center gap-4">
                        {user?.photoURL ? (
                            <img
                                src={user.photoURL}
                                alt={user.displayName || 'Usuario'}
                                className="w-16 h-16 rounded-full border-2 border-[var(--color-primary)]"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] border-2 border-[var(--color-primary)]">
                                <User size={32} />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold text-white truncate">
                                {user?.displayName || 'Usuario Fitness'}
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)] truncate">
                                {user?.email}
                            </p>
                        </div>
                    </div>
                    {/* Stats Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] text-center">
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Peso Actual</p>
                            <p className="text-3xl font-bold text-white">{currentWeight || '-'} <span className="text-sm text-[var(--color-text-muted)]">kg</span></p>
                        </div>
                        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] text-center">
                            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Cambio Total</p>
                            <p className={`text-3xl font-bold ${Number(difference) > 0 ? 'text-green-400' : Number(difference) < 0 ? 'text-red-400' : 'text-white'}`}>
                                {Number(difference) > 0 ? '+' : ''}{difference} <span className="text-sm text-[var(--color-text-muted)]">kg</span>
                            </p>
                        </div>
                    </div>

                    {/* Chart */}
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)]">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Tendencia</span>
                        </div>

                        {chartData.length > 0 ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorBodyWeight" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="dateStr" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#11221a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${value} kg`, 'Peso']}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="weight"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorBodyWeight)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl text-sm">
                                Registra tu peso para ver la gráfica
                            </div>
                        )}
                    </div>

                    {/* Add Weight Button */}
                    {!isAdding ? (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="w-full bg-[var(--color-primary)] text-black font-bold py-4 rounded-xl flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Registrar Peso
                        </button>
                    ) : (
                        <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-primary)] animate-in fade-in slide-in-from-bottom-2">
                            <p className="text-sm font-bold mb-2">Nuevo Registro</p>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        value={weightInput}
                                        onChange={(e) => setWeightInput(e.target.value)}
                                        placeholder="0.0"
                                        autoFocus
                                        className="w-full bg-[#1f3a2f] text-white p-3 rounded-lg border-none focus:ring-1 focus:ring-[var(--color-primary)] text-lg font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">kg</span>
                                </div>
                                <button
                                    onClick={handleAddWeight}
                                    disabled={!weightInput}
                                    className="bg-[var(--color-primary)] text-black font-bold px-6 rounded-lg disabled:opacity-50"
                                >
                                    Guardar
                                </button>
                                <button
                                    onClick={() => setIsAdding(false)}
                                    className="bg-[#1f3a2f] text-white px-4 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* History List */}
                    <div>
                        <h3 className="font-bold mb-3 flex items-center gap-2">
                            <Calendar size={18} />
                            Historial
                        </h3>
                        <div className="space-y-2">
                            <AnimatePresence mode="popLayout">
                                {weightRecords?.map((record) => (
                                    <motion.div
                                        key={record.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                    >
                                        <SwipeableRow onDelete={() => handleDeleteClick(record.id)}>
                                            <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                                                <div>
                                                    <p className="font-bold text-lg text-white">{record.weight} kg</p>
                                                    <p className="text-xs text-[var(--color-text-muted)]">
                                                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </SwipeableRow>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {(!weightRecords || weightRecords.length === 0) && (
                                <p className="text-[var(--color-text-muted)] text-sm italic">No hay registros aún.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Weight Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteWeightModal.isOpen}
                onClose={() => setDeleteWeightModal({ isOpen: false, id: null })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar registro?"
                message="Este registro de peso se eliminará permanentemente."
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
            {/* Logout Confirmation Modal */}
            <AnimatePresence>
                {showLogoutModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", duration: 0.5 }}
                            className="relative w-full max-w-sm bg-[var(--color-surface)] rounded-2xl p-6 border border-[rgba(255,255,255,0.1)] shadow-2xl overflow-hidden"
                        >
                            {/* Decorative Glow */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500/20 rounded-full blur-3xl pointer-events-none" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[var(--color-primary)]/10 rounded-full blur-3xl pointer-events-none" />

                            <div className="flex flex-col items-center text-center relative z-10">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 text-red-500">
                                    <LogOut size={32} />
                                </div>

                                <h2 className="text-xl font-bold text-white mb-2">¿Cerrar Sesión?</h2>
                                <p className="text-[var(--color-text-muted)] text-sm mb-6">
                                    Tendrás que volver a iniciar sesión con Google para acceder a tus entrenamientos.
                                </p>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => setShowLogoutModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-[var(--color-text-muted)] bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmLogout}
                                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 shadow-lg shadow-red-500/20 transition-all active:scale-95"
                                    >
                                        Sí, Cerrar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </ProtectedRoute>
    );
}
