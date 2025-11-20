"use client";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React, { useState } from "react";

export default function EditModal({ isOpen, closeModal, onSave, item }) {
    const [preview, setPreview] = useState(item?.image || null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPreview(URL.createObjectURL(file));
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <Dialog
                    className="fixed inset-0 z-50"
                    open={isOpen}
                    onClose={closeModal}
                >
                    {/* Backdrop */}
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
                            className="w-full max-w-xl mx-auto"
                        >
                            <Dialog.Panel className="w-full max-h-[90vh] rounded-xl bg-white dark:bg-gray-800 p-6 md:p-8 shadow-2xl overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title className="font-bold text-2xl dark:text-gray-100">
                                        Edit Item
                                    </Dialog.Title>
                                    <button onClick={closeModal}>
                                        <X className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                                    </button>
                                </div>

                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target);

                                        const updatedItem = {
                                            title: formData.get("title"),
                                            description: formData.get("description"),
                                            link: formData.get("link") || "",
                                            image:
                                                formData.get("image")?.size > 0
                                                    ? formData.get("image")
                                                    : null,
                                        };

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
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                            Description
                                        </label>
                                        <textarea
                                            name="description"
                                            rows={4}
                                            defaultValue={item?.description || ""}
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                            Link
                                        </label>
                                        <input
                                            name="link"
                                            defaultValue={item?.link.href || ""}
                                            type="url"
                                            placeholder="https://example.com"
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium dark:text-gray-200 mb-2">
                                            Thumbnail
                                        </label>

                                        {item?.image && (
                                            <img
                                                src={item.image.url}
                                                alt="Current Thumbnail"
                                                className="mb-2 w-32 h-32 object-cover rounded-md border border-gray-300 dark:border-gray-700"
                                            />
                                        )}

                                        <input
                                            name="image"
                                            type="file"
                                            accept="image/*"
                                            className="w-full text-sm text-gray-700 dark:text-gray-200
                                                    file:mr-4 file:py-2 file:px-4
                                                    file:rounded-lg file:border-0
                                                    file:text-sm file:font-medium
                                                    file:bg-gray-400 file:text-white
                                                    hover:file:bg-gray-500
                                                    bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                                                    rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                                                    outline-none transition"
                                        />
                                        <small className="text-gray-600">File will remain unchanged if left blank.</small>
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
