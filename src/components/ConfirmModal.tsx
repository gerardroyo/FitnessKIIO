'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    variant = 'danger'
}: ConfirmModalProps) {
    const variantColors = {
        danger: 'bg-red-500',
        warning: 'bg-orange-500',
        info: 'bg-[var(--color-primary)]'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
                    >
                        <div className="bg-[var(--color-background)] w-full max-w-sm rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.1)] pointer-events-auto">
                            <div className="p-6 text-center">
                                {/* Icon */}
                                <div className={`w-12 h-12 rounded-full ${variantColors[variant]} mx-auto mb-4 flex items-center justify-center`}>
                                    <AlertTriangle className="text-white" size={24} />
                                </div>

                                <h2 className="font-bold text-xl mb-2">{title}</h2>
                                <p className="text-[var(--color-text-muted)] text-sm mb-6">{message}</p>

                                <div className="space-y-3">
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                        className={`w-full ${variant === 'danger' ? 'bg-red-500' : variantColors[variant]} text-white font-bold p-4 rounded-xl`}
                                    >
                                        {confirmText}
                                    </motion.button>

                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={onClose}
                                        className="w-full text-[var(--color-text-muted)] p-2"
                                    >
                                        {cancelText}
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
