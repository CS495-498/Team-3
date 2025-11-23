"use client";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useState } from "react";

export default function EditFeatureRequestModal({ isOpen, closeModal, item }) {
    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog
                    className="fixed inset-0 z-50"
                    open={isOpen}
                    onClose={() => setIsOpen(false)}
                >
                    <motion.div
                        className="fixed inset-0 bg-black/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        aria-hidden="true"
                    />

                    <div className="fixed inset-0 flex items-center justify-center p-6">
                        <motion.div
                            className="w-full max-w-lg mx-auto"
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        >
                            <Dialog.Panel className="w-full rounded-2xl bg-white dark:bg-gray-700 shadow-2xl p-8">
                                <h4 className="font-bold text-2xl mb-4 text-gray-900 dark:text-gray-100">
                                    Edit Feature Request
                                </h4>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);

                                        const updatedItem = {
                                            title: formData.get("title"),
                                            description: formData.get("description")
                                        }

                                        onSave(updatedItem);
                                    }}
                                    className="space-y-5"
                                >
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                            Title
                                        </label>
                                        <input
                                            name="title"
                                            defaultValue={item?.title || ""}
                                            required
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            rows={4}
                                            name="content"
                                            defaultValue={item?.content || ""}
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 outline-none transition resize-none"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="px-5 py-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="text-white bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 focus:ring-4 focus:outline-none focus:ring-purple-300 font-medium rounded-md text-sm px-4 py-2 transition"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </motion.div>
                    </div>
                </Dialog>
            )}
        </AnimatePresence>
    );
}