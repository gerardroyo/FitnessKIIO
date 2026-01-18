'use client';

import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';

// Componente para los anillos de pulso cardíaco
function PulseRing({ delay, duration }: { delay: number; duration: number }) {
    return (
        <motion.div
            className="absolute inset-0 rounded-full border-2 border-emerald-500"
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{
                scale: [0.8, 2.5, 3.5],
                opacity: [0.6, 0.3, 0],
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: "easeOut",
            }}
            style={{
                width: '120px',
                height: '120px',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
            }}
        />
    );
}

export default function LoadingScreen() {
    // Configuración de los anillos - simula un latido cardíaco
    const pulseRings = [
        { delay: 0, duration: 2 },
        { delay: 0.3, duration: 2 },  // Segundo latido más rápido (lub-dub)
        { delay: 1.2, duration: 2 },
        { delay: 1.5, duration: 2 },
    ];

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Contenedor principal con los pulsos */}
            <div className="relative flex items-center justify-center">
                {/* Anillos de pulso cardíaco */}
                {pulseRings.map((ring, index) => (
                    <PulseRing key={index} delay={ring.delay} duration={ring.duration} />
                ))}

                {/* Glow central estático */}
                <div className="absolute w-32 h-32 bg-emerald-500/10 blur-2xl rounded-full" />

                {/* Logo principal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.5,
                        ease: "easeOut"
                    }}
                    className="relative z-10"
                >
                    <motion.div
                        animate={{
                            scale: [1, 1.08, 1, 1.05, 1], // Simula latido lub-dub
                        }}
                        transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            ease: "easeInOut",
                            times: [0, 0.15, 0.3, 0.45, 1] // Timing del latido
                        }}
                        className="relative bg-emerald-900/40 p-6 rounded-2xl border border-emerald-500/40 backdrop-blur-sm shadow-lg shadow-emerald-500/20"
                    >
                        <Dumbbell className="w-16 h-16 text-emerald-500" />
                    </motion.div>
                </motion.div>
            </div>

            {/* Texto y loading dots */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center relative z-10"
            >
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
                    FitnessKIIO
                </h1>
                <motion.div
                    className="mt-3 flex justify-center gap-1.5"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-2 rounded-full bg-emerald-500"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.4, 1, 0.4]
                            }}
                            transition={{
                                duration: 0.8,
                                repeat: Infinity,
                                delay: i * 0.15
                            }}
                        />
                    ))}
                </motion.div>
            </motion.div>
        </div>
    );
}
