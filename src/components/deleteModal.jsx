"use client";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

export default function DeleteModal({ isOpen, closeModal, onDeleteConfirm }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog className="fixed inset-0 z-50" open={isOpen} onClose={closeModal}>
                    {/* Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-md"
                        >
                            <Dialog.Panel className="w-full rounded-xl bg-white dark:bg-gray-800 p-8 shadow-2xl text-center">
                                <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-3" />
                                <Dialog.Title className="font-bold text-xl mb-2">
                                    Confirm Deletion
                                </Dialog.Title>
                                <p className="text-gray-600 dark:text-gray-300 mb-6">
                                    Are you sure you want to delete this item? This action cannot be undone.
                                </p>

                                {/* Buttons */}
                                <div className="flex justify-center gap-3">
                                    <button
                                        onClick={closeModal}
                                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onDeleteConfirm}
                                        className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}
