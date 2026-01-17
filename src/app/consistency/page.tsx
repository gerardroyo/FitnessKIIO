'use client';

import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon, Clock, Trophy, Flame, AlertTriangle } from 'lucide-react';

export default function ConsistencyPage() {
    const router = useRouter();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const history = useLiveQuery(async () => {
        return await db.sessions.where('state').equals('completed').toArray();
    });

    // Calendar Logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay();
        return day === 0 ? 6 : day - 1; // Convert to Mon=0 ... Sun=6
    };

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    // Stats Logic
    const getSessionsForDate = (day: number) => {
        if (!history) return [];
        const target = new Date(year, month, day).toDateString();
        return history.filter(s => new Date(s.startTime).toDateString() === target);
    };

    const getDayIntensity = (day: number) => {
        const sessions = getSessionsForDate(day);
        if (sessions.length === 0) return 0;
        const duration = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0) / 60;
        if (duration > 60) return 3;
        if (duration > 30) return 2;
        return 1;
    };

    const selectedSessions = selectedDate ? getSessionsForDate(selectedDate.getDate()) : [];

    const totalSessions = history?.length || 0;
    const { streak, trainedToday, isAtRisk } = calculateStreakDetails(history || []);

    // Fire Evolution Logic
    let fireColor = "text-orange-500";
    let fireIntensity = "bg-orange-500/10";
    let fireText = "Racha Activa";

    if (streak >= 30) {
        fireColor = "text-blue-500 animate-pulse";
        fireIntensity = "bg-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.5)]";
        fireText = "Racha LEGENDARIA";
    } else if (streak >= 7) {
        fireColor = "text-red-500 animate-pulse";
        fireIntensity = "bg-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.4)]";
        fireText = "¡ON FIRE!";
    }

    if (streak === 0) {
        fireColor = "text-gray-500";
        fireIntensity = "bg-gray-500/10";
        fireText = "Sin Racha";
    }

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-10">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">Constancia</h1>
                    <div className="w-10"></div>
                </div>
            </header>

            <div className="p-4 space-y-6">

                {/* Streak Alert (Danger) */}
                {isAtRisk && (
                    <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="bg-red-500 p-2 rounded-full text-white animate-bounce">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-white">¡Tu racha está en peligro!</h3>
                            <p className="text-sm text-gray-300">Entrena hoy para salvar tus {streak} días seguidos.</p>
                        </div>
                    </div>
                )}

                {/* Stats Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center">
                        <div className="bg-[var(--color-primary)]/10 p-2 rounded-full mb-2 text-[var(--color-primary)]">
                            <Activity size={20} />
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Total Sesiones</p>
                        <p className="text-2xl font-bold">{totalSessions}</p>
                    </div>
                    <div className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className={`p-2 rounded-full mb-2 ${fireIntensity} transition-all duration-500`}>
                            <Flame size={20} className={`${fireColor} transition-all duration-500`} fill={streak > 0 ? "currentColor" : "none"} />
                        </div>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">{fireText}</p>
                        <p className="text-2xl font-bold">{streak} <span className="text-sm font-normal text-[var(--color-text-muted)]">días</span></p>
                    </div>
                </div>

                {/* Calendar */}
                <div className="bg-[var(--color-surface)] rounded-2xl p-4 border border-[rgba(255,255,255,0.05)]">
                    {/* Month Nav */}
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={prevMonth} className="p-2 hover:bg-[#1f3a2f] rounded-lg transition-colors">
                            <ChevronLeft size={20} />
                        </button>
                        <h2 className="font-bold capitalize">{monthName}</h2>
                        <button onClick={nextMonth} className="p-2 hover:bg-[#1f3a2f] rounded-lg transition-colors">
                            <ChevronRight size={20} />
                        </button>
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-7 gap-2 text-center mb-2 text-xs font-bold text-[var(--color-text-muted)]">
                        <div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div>
                    </div>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                        ))}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const intensity = getDayIntensity(day);
                            const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month && selectedDate?.getFullYear() === year;

                            let bgClass = "bg-[#1f3a2f]/30 hover:bg-[#1f3a2f]";
                            if (intensity === 1) bgClass = "bg-[#00ff80]/30 hover:bg-[#00ff80]/40";
                            if (intensity === 2) bgClass = "bg-[#00ff80]/60 hover:bg-[#00ff80]/70";
                            if (intensity === 3) bgClass = "bg-[#00ff80] hover:bg-[#00ff80]/90 text-black";

                            if (isSelected) bgClass = "ring-2 ring-white z-10 " + bgClass;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDate(new Date(year, month, day))}
                                    className={`aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all ${bgClass}`}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Date Details */}
                <div className="animate-in fade-in slide-in-from-bottom-4">
                    <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                        <CalendarIcon size={20} className="text-[var(--color-primary)]" />
                        {selectedDate
                            ? selectedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
                            : 'Selecciona un día'}
                    </h3>

                    {selectedDate && selectedSessions.length === 0 && (
                        <div className="text-[var(--color-text-muted)] bg-[var(--color-surface)] p-6 rounded-xl border border-[rgba(255,255,255,0.05)] text-center text-sm">
                            <p>No hay entrenamientos registrados este día.</p>
                            <p className="mt-2 text-xs opacity-60">¡El descanso también es parte del proceso! 😴</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {selectedSessions.map(session => (
                            <div key={session.id} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)]">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="font-bold text-lg">{session.name}</p>
                                    <div className="flex items-center gap-1 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-2 py-1 rounded-lg">
                                        <Clock size={12} />
                                        {Math.round((session.durationSeconds || 0) / 60)} min
                                    </div>
                                </div>
                                <div className="text-sm text-[var(--color-text-muted)]">
                                    <p>{session.entries.length} Ejercicios completados</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function calculateStreakDetails(sessions: any[]) {
    if (!sessions.length) return { streak: 0, trainedToday: false, isAtRisk: false };

    const sorted = [...sessions].sort((a, b) => b.startTime - a.startTime);
    const today = new Date().setHours(0, 0, 0, 0);
    const lastSessionDate = new Date(sorted[0].startTime).setHours(0, 0, 0, 0);

    const diffDays = (today - lastSessionDate) / (1000 * 60 * 60 * 24);

    // Streaks logic:
    // If diff == 0 (trained today) -> Streak is active, not at risk.
    // If diff == 1 (trained yesterday) -> Streak is active, BUT at risk if not trained today.
    // If diff > 1 -> Streak broken (0).

    if (diffDays > 1) return { streak: 0, trainedToday: false, isAtRisk: false };

    let streak = 1;
    let currentDate = lastSessionDate;

    for (let i = 1; i < sorted.length; i++) {
        const sessionDate = new Date(sorted[i].startTime).setHours(0, 0, 0, 0);
        if (sessionDate === currentDate) continue;
        if (currentDate - sessionDate === 1000 * 60 * 60 * 24) {
            streak++;
            currentDate = sessionDate;
        } else {
            break;
        }
    }

    const trainedToday = diffDays === 0;
    const isAtRisk = diffDays === 1; // Streak is alive but needs training today to increment

    return { streak, trainedToday, isAtRisk };
}
