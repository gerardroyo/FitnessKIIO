'use client';

import { db, BodyWeightRecord } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, User, Plus, Trash2, Calendar, TrendingUp } from 'lucide-react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function ProfilePage() {
    const router = useRouter();
    const [weightInput, setWeightInput] = useState('');
    const [isAdding, setIsAdding] = useState(false);

    const weightRecords = useLiveQuery(
        () => db.bodyWeight.orderBy('date').reverse().toArray()
    );

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
        if (!weight || isNaN(weight)) return;

        await db.bodyWeight.add({
            date: Date.now(),
            weight: weight
        });

        setWeightInput('');
        setIsAdding(false);
    };

    const handleDelete = async (id?: number) => {
        if (!id) return;
        if (confirm('¿Eliminar este registro?')) {
            await db.bodyWeight.delete(id);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-background)] pb-20">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-[var(--color-background)]/90 backdrop-blur-md border-b border-[rgba(255,255,255,0.05)]">
                <div className="flex items-center justify-between p-4">
                    <button onClick={() => router.back()} className="p-2 -ml-2">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">Perfil y Peso</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="p-4 space-y-6">
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
                        {weightRecords?.map((record) => (
                            <div key={record.id} className="bg-[var(--color-surface)] p-4 rounded-xl border border-[rgba(255,255,255,0.05)] flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-lg text-white">{record.weight} kg</p>
                                    <p className="text-xs text-[var(--color-text-muted)]">
                                        {new Date(record.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleDelete(record.id)}
                                    className="p-2 text-[var(--color-text-muted)] hover:text-red-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {(!weightRecords || weightRecords.length === 0) && (
                            <p className="text-[var(--color-text-muted)] text-sm italic">No hay registros aún.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
