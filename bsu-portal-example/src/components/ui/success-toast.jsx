"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function SuccessToast({ message, isOpen, onClose }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, y: -15, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed top-5 right-5 z-50 flex items-center gap-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg px-6 py-2 min-w-[220px] max-w-sm"
                >
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 bg-white/20 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <p className="text-sm font-medium leading-snug">{message || "Success!"}</p>

                    <button
                        className="ml-auto p-1 rounded-full hover:bg-white/20 transition"
                        onClick={onClose}
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
