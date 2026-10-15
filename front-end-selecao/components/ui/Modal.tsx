// components/Modal.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: ReactNode;
    backdropClass?: string;
}

export default function Modal({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    size = 'md',
    footer,
    backdropClass = 'bg-black/20 backdrop-blur-sm'
}: ModalProps) {
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`fixed inset-0 ${backdropClass} flex items-center justify-center p-4 z-50`}
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className={`bg-white rounded-2xl shadow-xl w-full max-h-[90vh] overflow-hidden flex flex-col ${sizeClasses[size]}`}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-gray-600 mt-1">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content - Scrollable */}
                        <div className="overflow-y-auto flex-1">
                            {children}
                        </div>

                        {/* Footer - Optional */}
                        {footer && (
                            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}