import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Calendar, Plus, Trophy, Activity, History, Trash2, Dumbbell, Notebook, User, Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardViewProps {
    onStart: () => void;
}

export function DashboardView({ onStart }: DashboardViewProps) {
    const router = useRouter();
    const [timeRange, setTimeRange] = useState<'1S' | '1M' | '3M' | '1A' | 'ALL'>('ALL');

    const history = useLiveQuery(async () => {
        const sessions = await db.sessions
            .where('state')
            .equals('completed')
            .reverse()
            .toArray();

        // Enrich with volume calculation
        return sessions.map(session => {
            const volume = session.entries.reduce((acc, entry) => {
                return acc + entry.sets.reduce((sAcc, set) => sAcc + (set.isCompleted ? set.weight * set.reps : 0), 0);
            }, 0);
            return { ...session, volume };
        });
    });

    const handleDelete = async (e: React.MouseEvent, sessionId: number) => {
        e.stopPropagation();
        if (window.confirm('¿Borrar esta sesión permanentemente?')) {
            await db.sessions.delete(sessionId);
        }
    };

    const chartData = (() => {
        if (!history) return [];

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

        return [...filtered].reverse().map(s => ({
            date: new Date(s.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }),
            volume: s.volume,
            duration: Math.round((s.durationSeconds || 0) / 60),
            rawDate: s.startTime
        }));
    })();

    const totalSessions = history?.length || 0;
    const lastSession = history?.[0];

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
            <header className="p-6 pt-8 flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-[var(--color-text-muted)] bg-clip-text text-transparent">
                        Mi Progreso
                    </h1>
                    <p className="text-[var(--color-text-muted)]">Consistencia es la clave</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => router.push('/routines')}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Mis rutinas"
                    >
                        <Notebook size={20} />
                    </button>
                    <button
                        onClick={() => router.push('/exercises')}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Ver ejercicios"
                    >
                        <Dumbbell size={20} />
                    </button>
                    <button
                        onClick={() => router.push('/profile')}
                        className="p-2 rounded-lg bg-[var(--color-surface)] border border-[rgba(255,255,255,0.05)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
                        title="Mi Perfil"
                    >
                        <User size={20} />
                    </button>
                </div>
            </header>

            <div className="px-4 space-y-6 flex-1 overflow-y-auto">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                    <div
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2 text-[var(--color-primary)]">
                            <Trophy size={16} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">SESIONES</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{totalSessions}</p>
                    </div>
                    <div
                        onClick={() => router.push('/consistency')}
                        className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] active:scale-95 transition-transform cursor-pointer"
                    >
                        <div className="flex items-center gap-2 mb-2 text-orange-500">
                            <Flame size={16} fill={streak > 0 ? "currentColor" : "none"} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">RACHA</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{streak} <span className="text-xs font-normal text-[var(--color-text-muted)]">días</span></p>
                    </div>
                </div>

                {/* Chart Section */}
                <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
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

                    {/* Last Session Duration */}
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-3xl font-bold font-mono">
                            {lastSession ? Math.floor((lastSession.durationSeconds || 0) / 60) : '0'}
                            <span className="text-lg text-[var(--color-text-muted)] ml-1">min</span>
                        </span>
                    </div>

                    <div className="h-48 w-full">
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
                                        contentStyle={{ backgroundColor: '#11221a', border: 'none', borderRadius: '8px', color: '#fff' }}
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
                </div>

                {/* History List */}
                <div>
                    <div className="flex justify-between items-center mb-4 mt-2">
                        <div className="flex items-center gap-2">
                            <History size={18} className="text-[var(--color-primary)]" />
                            <h3 className="text-lg font-bold">Historial</h3>
                        </div>
                    </div>

                    <div className="space-y-3 pb-24">
                        {history && history.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => router.push(`/session/${session.id}`)}
                                className="bg-[var(--color-surface)] p-4 rounded-xl flex justify-between items-center active:scale-98 transition-transform border border-[rgba(255,255,255,0.05)] cursor-pointer hover:border-[var(--color-primary)]/30"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#1f3a2f] flex items-center justify-center text-[var(--color-primary)]">
                                        <Calendar size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-white">{session.name}</p>
                                        <p className="text-xs text-[var(--color-text-muted)]">
                                            {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} • {Math.floor((session.durationSeconds || 0) / 60)} min
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => handleDelete(e, session.id)}
                                        className="p-2 text-[var(--color-text-muted)] hover:text-red-500 hover:bg-[rgba(255,0,0,0.1)] rounded-lg transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Floating Action Button */}
            <div className="fixed bottom-6 left-4 right-4 z-20">
                <button
                    onClick={onStart}
                    className="w-full bg-[var(--color-primary)] text-black font-bold py-4 rounded-[var(--radius-button)] flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(0,255,128,0.3)] active:scale-95 transition-transform"
                >
                    <Plus strokeWidth={3} />
                    Nueva Sesión
                </button>
            </div>
        </div>
    );
}
