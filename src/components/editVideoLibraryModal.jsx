"use client";
import { Dialog } from "@headlessui/react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import React from "react";

export default function EditVideoModal({ isOpen, closeModal, onSave, item }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const updatedVideo = {
            title: formData.get("title"),
            description: formData.get("description"),
            link: formData.get("link") || "",
            video_file: formData.get("video_file")?.size > 0 ? formData.get("video_file") : null,
            date_posted: formData.get("date_posted") || "",
            se_name: formData.get("se_name") || "",
            thumbnail: formData.get("thumbnail")?.size > 0 ? formData.get("thumbnail") : null,
        };

        onSave(updatedVideo);
        closeModal();
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

                    {/* Modal Panel */}
                    <div className="fixed inset-0 flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                            className="w-full max-w-3xl mx-auto"
                        >
                            <Dialog.Panel className="w-full rounded-xl bg-white dark:bg-gray-800 p-8 shadow-2xl">
                                {/* Header */}
                                <div className="flex justify-between items-center mb-6">
                                    <Dialog.Title className="font-bold text-2xl">
                                        Edit Video
                                    </Dialog.Title>
                                    <button onClick={closeModal}>
                                        <X className="h-6 w-6 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
                                    </button>
                                </div>

                                {/* Form */}
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    {/* Row 1: Title + Date */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                Title
                                            </label>
                                            <input
                                                name="title"
                                                defaultValue={item?.title || ""}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                Date Posted
                                            </label>
                                            <input
                                                name="date_posted"
                                                type="date"
                                                defaultValue={item?.date_posted ? new Date(item.date_posted).toISOString().slice(0, 10) : ""}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="flex-1">
                                            <div>
                                                <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                    Video File
                                                </label>
                                                <input
                                                    name="video_file"
                                                    type="file"
                                                    accept="video/*"
                                                    className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"/>
                                                <small className="text-gray-600">File will remain unchanged if left blank.</small>
                                            </div>
                                        </div>
                                        <div className="relative flex items-center justify-center w-12">
                                            {/* Divider aligned with input center */}
                                            <div className="absolute top-1/2 transform -translate-y-1/3 left-0 right-0 border-t border-gray-300 dark:border-gray-600"></div>
                                            <span className="relative px-2 text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800">
                                                or
                                            </span>
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                Video URL
                                            </label>
                                            <input
                                                name="link"
                                                type="url"
                                                defaultValue={item?.video_url || ""}
                                                placeholder="https://youtube.com/watch?v=VIDEO"
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>
                                    </div>


                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                SE Name
                                            </label>
                                            <input
                                                name="se_name"
                                                defaultValue={item?.se_name || ""}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-200 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                rows={3}
                                                defaultValue={item?.description || ""}
                                                className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-2 focus:ring-2 focus:ring-indigo-500 outline-none transition resize-none"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium dark:text-gray-200">
                                                Thumbnail
                                            </label>
                                            {item?.thumbnail?.url && (
                                                <img
                                                    src={item.thumbnail.url}
                                                    alt="Current thumbnail"
                                                    className="w-[1/4] h-20 object-cover rounded-lg mb-2 border border-gray-300 dark:border-gray-700"
                                                />
                                            )}
                                            <input
                                                name="thumbnail"
                                                type="file"
                                                accept="image/*"
                                                className="w-full text-sm text-gray-700 dark:text-gray-200
                          file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                          file:text-sm file:font-medium file:bg-gray-400 file:text-white
                          hover:file:bg-gray-500 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700
                          rounded-lg px-2 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500
                          outline-none transition"
                                            />
                                        </div>
                                        <small className="text-gray-600">File will remain unchanged if left blank.</small>
                                    </div>

                                    {/* Footer Buttons */}
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
