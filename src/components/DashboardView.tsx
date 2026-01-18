import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { deleteSession, getUserSessions } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { Calendar, Plus, Trophy, Activity, History, Dumbbell, Notebook, User, Flame, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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

    return (
        <div className="flex flex-col min-h-screen relative pb-24">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 pt-8 flex justify-between items-start"
            >
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[var(--color-text-muted)] bg-clip-text text-transparent">
                        Mi Progreso
                    </h1>
                    <p className="text-[var(--color-text-muted)]">Consistencia es la clave</p>
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
                            className="p-2 rounded-lg bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                            title={item.title}
                        >
                            <item.icon size={20} />
                        </motion.button>
                    ))}
                </div>
            </motion.header>

            <div className="px-4 space-y-6 flex-1 overflow-y-auto">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                            <Trophy size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">SESIONES</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            <AnimatedNumber value={totalSessions} />
                        </p>
                    </motion.div>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ delay: 0.1 }}
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2 text-orange-500">
                            <Flame size={16} fill={streak > 0 ? "currentColor" : "none"} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">RACHA</span>
                        </div>
                        <p className="text-2xl font-bold text-white">
                            <AnimatedNumber value={streak} /> <span className="text-xs font-normal text-[var(--color-text-muted)]">días</span>
                        </p>
                    </motion.div>
                </div>

                {/* Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]"
                >
                    {/* Filters - Attached to Chart */}
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">Tiempo de Entreno</span>
                        <div className="flex gap-1">
                            {['1S', '1M', '3M', '1A', 'ALL'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setTimeRange(tab as any)}
                                    className={cn(
                                        "px-2 py-1 text-[10px] font-bold rounded-md transition-colors",
                                        timeRange === tab ? "bg-[#2d4a3e] text-white" : "text-[var(--color-text-muted)]"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Total Duration for Range */}
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold font-mono">
                            <AnimatedNumber value={totalMinutes} />
                            <span className="text-lg text-[var(--color-text-muted)] ml-1">min</span>
                        </span>
                    </div>

                    <div className="h-48 w-full [&_.recharts-wrapper]:!outline-none">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorChart" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ff80" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00ff80" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis hide domain={['dataMin', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#11221a', border: 'none', borderRadius: '8px', color: '#fff', outline: 'none' }}
                                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                        itemStyle={{ color: '#00ff80' }}
                                        formatter={(value: any) => [`${value} min`, 'Tiempo']}
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
                            <div className="h-full flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl text-sm">
                                Completa tu primer entreno para ver datos
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* History List */}
                <div>
                    <div className="flex justify-between items-center mb-4 mt-2">
                        <div className="flex items-center gap-2">
                            <History size={18} className="text-[var(--color-primary)]" />
                            <h3 className="text-lg font-bold">Historial</h3>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="space-y-3">
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
                            className="space-y-3 pb-24"
                        >
                            <AnimatePresence mode="popLayout">
                                {history && history.map((session) => (
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
                                                className="p-4 flex justify-between items-center cursor-pointer"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                                                        <Calendar size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-white">{session.name}</p>
                                                        <p className="text-xs text-[var(--color-text-muted)]">
                                                            {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} • {Math.round((session.durationSeconds || 0) / 60)} min
                                                        </p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="text-[var(--color-text-muted)]" />
                                            </div>
                                        </SwipeableRow>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-4 right-4 z-20">
                <motion.button
                    initial={{ y: 100 }}
                    animate={{ y: 0 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 200, damping: 20 }}
                    onClick={onStart}
                    className="w-full bg-[var(--color-primary)] text-black font-bold py-4 rounded-[var(--radius-button)] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,128,0.3)]"
                >
                    <Plus strokeWidth={3} />
                    Empezar Entreno
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
