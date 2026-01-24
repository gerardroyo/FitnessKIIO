import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteSession, getUserSessions } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Plus, Trophy, Activity, History, Dumbbell, Notebook, User, Flame, ChevronRight, AlertTriangle } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedNumber } from './AnimatedNumber';
import { HistoryItemSkeleton } from './Skeleton';
import { ConfirmModal } from './ConfirmModal';
import { SwipeableRow } from './SwipeableRow';

interface DashboardViewProps {
    onStart: () => void;
}

export function DashboardView({ onStart }: DashboardViewProps) {
    const router = useRouter();
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState<'1S' | '1M' | '3M' | '1A' | 'ALL'>('ALL');
    const [history, setHistory] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; sessionId: string | null }>({
        isOpen: false,
        sessionId: null
    });

    useEffect(() => {
        if (!user) return;
        setIsLoading(true);
        async function fetchHistory() {
            const sessions = await getUserSessions(user!.uid, 100);
            const completed = sessions.filter(s => s.state === 'completed');

            const enriched = completed.map(session => {
                const volume = session.entries.reduce((acc, entry) => {
                    return acc + entry.sets.reduce((sAcc, set) => sAcc + (set.isCompleted ? set.weight * set.reps : 0), 0);
                }, 0);
                return { ...session, volume };
            });
            setHistory(enriched);
            setIsLoading(false);
        }
        fetchHistory();
    }, [user]);

    const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, sessionId });
    };

    const handleConfirmDelete = async () => {
        if (!user || !deleteModal.sessionId) return;
        await deleteSession(user.uid, deleteModal.sessionId);
        setHistory(prev => prev.filter(s => s.id !== deleteModal.sessionId));
    };

    const { filteredHistory, chartData } = (() => {
        if (!history) return { filteredHistory: [], chartData: [] };

        const now = new Date();
        let cutoffDate: Date | null = null;

        switch (timeRange) {
            case '1S': cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
            case '1M': cutoffDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()); break;
            case '3M': cutoffDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()); break;
            case '1A': cutoffDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()); break;
            default: cutoffDate = null;
        }

        const filtered = cutoffDate
            ? history.filter(s => s.startTime >= cutoffDate!.getTime())
            : history;

        // Group by date
        const grouped = filtered.reduce((acc, s) => {
            const dateStr = new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
            if (!acc[dateStr]) {
                acc[dateStr] = { date: dateStr, durationSeconds: 0, rawDate: s.startTime };
            }
            acc[dateStr].durationSeconds += (s.durationSeconds || 0);
            return acc;
        }, {} as Record<string, any>);

        const data = Object.values(grouped)
            .sort((a: any, b: any) => a.rawDate - b.rawDate)
            .map((item: any) => ({
                ...item,
                duration: Math.round(item.durationSeconds / 60)
            }));

        return { filteredHistory: filtered, chartData: data };
    })();

    const totalDuration = filteredHistory.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);
    const totalMinutes = Math.round(totalDuration / 60);

    const totalSessions = history?.length || 0;

    // Streak Calculation
    const streak = (() => {
        if (!history || history.length === 0) return 0;
        const sorted = [...history].sort((a, b) => b.startTime - a.startTime);
        const today = new Date().setHours(0, 0, 0, 0);
        const lastSessionDate = new Date(sorted[0].startTime).setHours(0, 0, 0, 0);

        const diffDays = (today - lastSessionDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 1) return 0;

        let s = 1;
        let currentDate = lastSessionDate;
        for (let i = 1; i < sorted.length; i++) {
            const sessionDate = new Date(sorted[i].startTime).setHours(0, 0, 0, 0);
            if (sessionDate === currentDate) continue;
            if (currentDate - sessionDate === 1000 * 60 * 60 * 24) {
                s++;
                currentDate = sessionDate;
            } else {
                break;
            }
        }
        return s;
    })();

    // Streak Risk Calculation (copied from Consistency page logic or simplified)
    const isAtRisk = (() => {
        if (!history || history.length === 0) return false;
        const sorted = [...history].sort((a, b) => b.startTime - a.startTime);
        const today = new Date().setHours(0, 0, 0, 0);
        const lastSessionDate = new Date(sorted[0].startTime).setHours(0, 0, 0, 0);
        const diffDays = (today - lastSessionDate) / (1000 * 60 * 60 * 24);

        // At risk if trained yesterday (diff=1) but not today (diff!=0)
        // If diff=0, trained today, safe.
        // If diff > 1, streak lost, already 0.
        return diffDays === 1;
    })();

    return (
        <div className="flex flex-col min-h-screen relative pb-32 px-4 pt-6 bg-[var(--color-background)]">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-between items-start mb-8"
            >
                <div className="pl-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[var(--color-text-muted)] bg-clip-text text-transparent">
                        Mi Progreso
                    </h1>
                    <p className="text-[var(--color-text-muted)] font-medium">Consistencia es la clave</p>
                </div>
                <div className="flex gap-2">
                    {[
                        { icon: Notebook, path: '/routines', title: 'Mis rutinas' },
                        { icon: Dumbbell, path: '/exercises', title: 'Ver ejercicios' },
                        { icon: User, path: '/profile', title: 'Mi Perfil' }
                    ].map((item, idx) => (
                        <motion.button
                            key={item.path}
                            onClick={() => router.push(item.path)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="p-2.5 rounded-xl bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors shadow-sm"
                            title={item.title}
                        >
                            <item.icon size={20} />
                        </motion.button>
                    ))}
                </div>
            </motion.header>

            <div className="space-y-8 flex-1">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2 shadow-sm hover:border-[rgba(255,255,255,0.1)]"
                    >
                        <div className="flex items-center gap-2 text-[var(--color-primary)]">
                            <Trophy size={18} />
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">SESIONES</span>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">
                            <AnimatedNumber value={totalSessions} />
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-5 rounded-2xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2 shadow-sm hover:border-[rgba(255,255,255,0.1)]"
                    >
                        <div className="flex items-center gap-2 text-orange-500">
                            <Flame size={18} fill={streak > 0 ? "currentColor" : "none"} />
                            <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">RACHA</span>
                        </div>
                        <p className="text-3xl font-bold text-white tracking-tight">
                            <AnimatedNumber value={streak} /> <span className="text-sm font-medium text-[var(--color-text-muted)] ml-1">días</span>
                        </p>
                    </motion.div>
                </div>

                {/* Streak Alert (Danger) */}
                {isAtRisk && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-4"
                    >
                        <div className="bg-red-500/20 p-2 rounded-xl text-red-500 shrink-0">
                            <AlertTriangle size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-sm mb-1">¡Racha en peligro!</h3>
                            <p className="text-xs text-red-200/80 leading-relaxed">Entrena hoy para no perder tus {streak} días.</p>
                        </div>
                    </motion.div>
                )}

                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--color-surface)] rounded-2xl p-5 border border-[rgba(255,255,255,0.05)] shadow-sm"
                >
                    {/* Filters - Attached to Chart */}
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tiempo de Entreno</span>
                        <div className="bg-[#1f3a2f]/50 p-1 rounded-lg flex gap-1">
                            {['1S', '1M', '3M', '1A', 'ALL'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTimeRange(tab as any)}
                                    className={cn(
                                        "px-2.5 py-1 text-[10px] font-bold rounded-md transition-all",
                                        timeRange === tab ? "bg-[var(--color-primary)] text-black shadow-sm" : "text-[var(--color-text-muted)] hover:text-white"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Total Duration for Range */}
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-3xl font-bold font-mono tracking-tight flex items-baseline">
                            {Math.floor(totalMinutes / 60) > 0 ? (
                                <>
                                    <AnimatedNumber value={Math.floor(totalMinutes / 60)} />
                                    <span className="text-base text-[var(--color-text-muted)] ml-1 mr-1 font-sans font-medium">h</span>
                                    <AnimatedNumber value={totalMinutes % 60} />
                                    <span className="text-base text-[var(--color-text-muted)] ml-1 font-sans font-medium">min</span>
                                </>
                            ) : (
                                <>
                                    <AnimatedNumber value={totalMinutes} />
                                    <span className="text-base text-[var(--color-text-muted)] ml-1 font-sans font-medium">min</span>
                                </>
                            )}
                        </span>
                    </div>

                    <div className="h-52 w-full [&_.recharts-wrapper]:!outline-none">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ff80" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#00ff80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        itemStyle={{ color: '#00ff80', fontSize: '12px', fontWeight: 'bold' }}
                                        formatter={(value: any) => [formatDuration(value * 60), 'Tiempo']}
                                        labelFormatter={(label) => label}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="duration"
                                        stroke="#00ff80"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorChart)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl text-sm mx-2">
                                Completa tu primer entreno para ver datos
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* History List */}
                <div className="pt-2">
                    <div className="flex justify-between items-center mb-4 px-1">
                        <div className="flex items-center gap-2">
                            <div className="bg-[var(--color-primary)]/10 p-1.5 rounded-lg">
                                <History size={16} className="text-[var(--color-primary)]" />
                            </div>
                            <h3 className="text-lg font-bold">Historial Reciente</h3>
                        </div>
                        <button onClick={() => router.push('/consistency')} className="text-xs text-[var(--color-primary)] font-bold hover:underline font-sans">
                            Ver todo
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <HistoryItemSkeleton key={i} />
                            ))}
                        </div>
                    ) : (
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.05
                                    }
                                }
                            }}
                            className="space-y-4"
                        >
                            <AnimatePresence mode="popLayout">
                                {history && history.slice(0, 5).map((session) => (
                                    <motion.div
                                        key={session.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                        exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                    >
                                        <SwipeableRow
                                            onDelete={() => {
                                                setDeleteModal({ isOpen: true, sessionId: session.id });
                                            }}
                                        >
                                            <div
                                                onClick={() => router.push(`/session/${session.id}`)}
                                                className="p-4 flex justify-between items-center cursor-pointer bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] rounded-2xl active:scale-[0.98] transition-transform"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-[#1f3a2f]/50 flex items-center justify-center text-[var(--color-primary)] border border-[rgba(0,255,128,0.1)]">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white text-base mb-0.5">{session.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-2">
                                                            <span>{new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                                                            <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]" />
                                                            <span>{formatDuration(session.durationSeconds || 0)}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} className="text-[var(--color-text-muted)] opacity-50" />
                                            </div>
                                        </SwipeableRow>
                                    </motion.div>
                                ))}
                                {history && history.length === 0 && (
                                    <div className="text-center py-10 text-[var(--color-text-muted)] opacity-60">
                                        <History size={32} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">No hay sesiones guardadas</p>
                                    </div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-8 left-6 right-6 z-20">
                <motion.button
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -2 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    onClick={onStart}
                    className="w-full bg-[var(--color-primary)] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-[0_8px_30px_rgba(0,255,128,0.25)] border border-[rgba(255,255,255,0.1)]"
                >
                    <Plus strokeWidth={3} size={22} />
                    <span className="text-base tracking-wide">EMPEZAR ENTRENO</span>
                </motion.button>
            </div>

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, sessionId: null })}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar sesión?"
                message="Esta acción no se puede deshacer. ¿Estás seguro de que quieres borrar esta sesión?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                variant="danger"
            />
        </div>
    );
}
