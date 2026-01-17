'use client';

import { Exercise } from '@/lib/db';
import { useExercises } from '@/hooks/useFirestore';
import { getUserSessions } from '@/lib/firestore';
import { useAuth } from '@/context/AuthContext';
import { useLiveQuery } from 'dexie-react-hooks'; // Leaving for now if other things need it, but likely not
import { useRouter } from 'next/navigation';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, Share2, Trophy, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface StatsPageProps {
    params: Promise<{ id: string }>;
}

interface SessionRecord {
    date: number;
    dateStr: string;
    maxWeight: number;
    reps: number;
    oneRepMax?: number; // Added
}

export default function StatsPage({ params }: StatsPageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const { exercises } = useExercises();
    const exercise = exercises.find(e => String(e.id) === id);

    const [sessionRecords, setSessionRecords] = useState<SessionRecord[]>([]);

    useEffect(() => {
        if (!user || !id) return;

        async function fetchRecords() {
            // Get last 50 sessions? Or all? Let's get 50 for now.
            const sessions = await getUserSessions(user!.uid, 50);
            const allSessions = sessions
                .filter(s => s.state === 'completed')
                .sort((a, b) => (a.startTime || 0) - (b.startTime || 0)); // Sort old to new for chart

            const records: SessionRecord[] = [];

            for (const session of allSessions) {
                const entry = session.entries.find(e => String(e.exerciseId) === String(id));
                if (entry && entry.sets.length > 0) {
                    const completedSets = entry.sets.filter(s => s.isCompleted);
                    if (completedSets.length > 0) {
                        const bestSet = completedSets.reduce((best, s) => {
                            const s1RM = s.weight * (1 + s.reps / 30);
                            const best1RM = best.weight * (1 + best.reps / 30);
                            return s1RM > best1RM ? s : best;
                        }, completedSets[0]);

                        const oneRepMax = Math.round(bestSet.weight * (1 + bestSet.reps / 30));

                        records.push({
                            date: session.startTime,
                            dateStr: new Date(session.startTime).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
                            maxWeight: bestSet.weight,
                            reps: bestSet.reps,
                            oneRepMax: oneRepMax
                        });
                    }
                }
            }
            setSessionRecords(records);
        }

        fetchRecords();
    }, [user, id]);

    // TOP 5: Sort by 1RM desc
    const top5 = sessionRecords
        ? [...sessionRecords]
            .sort((a, b) => (b.oneRepMax || 0) - (a.oneRepMax || 0))
            .slice(0, 5)
        : [];

    const chartData = sessionRecords || [];
    const currentMax = top5[0]?.oneRepMax || 0;

    if (!exercise) {
        return (
            <div className="min-h-screen flex items-center justify-center text-[var(--color-text-muted)]">
                Cargando...
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--color-background)]">
                {/* Header */}
                <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                    <div className="flex items-center justify-between p-4">
                        <button onClick={() => router.back()} className="p-2 -ml-2">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="font-bold text-lg">{exercise.name}</h1>
                        <div className="w-10" />
                    </div>
                </header>

                <div className="p-4 space-y-6">
                    {/* Current Max */}
                    {currentMax > 0 && (
                        <div className="text-center">
                            <p className="text-sm text-[var(--color-text-muted)] mb-1">Mejor 1RM Estimado</p>
                            <p className="text-4xl font-bold text-[var(--color-primary)]">{currentMax} <span className="text-lg">kg</span></p>
                        </div>
                    )}

                    {/* Chart 1RM */}
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)]">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Progreso 1RM Estimado</span>
                        </div>

                        {chartData.length > 0 ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="color1RM" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00ff80" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00ff80" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="dateStr" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#11221a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${value} kg`, '1RM Est.']}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="oneRepMax"
                                            stroke="#00ff80"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#color1RM)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl text-sm">
                                Completa una sesión con este ejercicio
                            </div>
                        )}
                    </div>

                    {/* Chart Raw Weight */}
                    <div className="bg-[var(--color-surface)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)]">
                        <div className="flex items-center gap-2 mb-4 text-[var(--color-text-muted)]">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Progreso Peso Real</span>
                        </div>

                        {chartData.length > 0 ? (
                            <div className="h-48">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorRaw" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="dateStr" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#11221a', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            formatter={(value: any) => [`${value} kg`, 'Peso']}
                                            labelFormatter={(label) => label}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="maxWeight"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRaw)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)] border border-dashed border-[#1f3a2f] rounded-xl text-sm">
                                Completa una sesión para ver datos
                            </div>
                        )}
                    </div>

                    {/* TOP 5 */}
                    {top5.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Trophy size={18} className="text-[var(--color-primary)]" />
                                <h2 className="font-bold">Top 5 Mejores</h2>
                            </div>

                            <div className="space-y-2">
                                {top5.map((record, idx) => (
                                    <div
                                        key={record.date}
                                        className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex items-center gap-4"
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                                            idx === 1 ? 'bg-gray-400/20 text-gray-300' :
                                                idx === 2 ? 'bg-orange-600/20 text-orange-400' :
                                                    'bg-[#1f3a2f] text-[var(--color-text-muted)]'
                                            }`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white">{record.maxWeight} kg</p>
                                            <p className="text-xs text-[var(--color-text-muted)]">{record.reps} reps</p>
                                        </div>
                                        <p className="text-sm text-[var(--color-text-muted)]">
                                            {new Date(record.date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty State */}
                    {(!sessionRecords || sessionRecords.length === 0) && (
                        <div className="text-center py-8 text-[var(--color-text-muted)]">
                            <p>Aún no hay registros de este ejercicio.</p>
                            <p className="text-sm mt-1">Completa una sesión para ver tu progreso.</p>
                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}
