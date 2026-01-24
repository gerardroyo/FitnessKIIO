'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-[#0a0f0a] z-50 flex flex-col items-center justify-center p-4 overflow-hidden">

            {/* Ambient Glow */}
            <div className="absolute w-[500px] h-[500px] bg-[var(--color-primary)]/5 blur-[120px] rounded-full opacity-50 pointer-events-none" />

            {/* Logo Container */}
            <div className="relative z-10 flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
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
                            priority
                        />
                    </motion.div>
                </motion.div>

                {/* Loading Text */}
                <h1 className="text-2xl font-bold text-white tracking-tight mb-4">
                    Fitness<span className="text-[var(--color-primary)] italic">KIIO</span>
                </h1>

                {/* Loading Dots */}
                <motion.div
                    className="flex justify-center gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {[0, 1, 2].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)]"
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.3, 1, 0.3]
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                delay: i * 0.2,
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    );
}
