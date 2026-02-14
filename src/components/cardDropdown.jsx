"use client";

import * as React from "react";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
    useFloating,
    offset,
    flip,
    shift,
    autoUpdate,
} from "@floating-ui/react";

export default function CardDropdown({ onEdit, onDelete }) {
    const { refs, floatingStyles } = useFloating({
        placement: "bottom-end",
        middleware: [offset(8), flip(), shift({ padding: 12 })],
        whileElementsMounted: autoUpdate,
    });

    return (
        <Menu as="div" className="inline-block text-left">
            <MenuButton
                ref={refs.setReference}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
            >
                <MoreHorizontal className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </MenuButton>

            <MenuItems
                // Portal prevents clipping by modal/list overflow containers
                portal
                ref={refs.setFloating}
                style={floatingStyles}
                className="z-[9999] w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg p-1 focus:outline-none"
            >
                <MenuItem>
                    {({ active }) => (
                        <button
                            type="button"
                            onClick={onEdit}
                            className={`${
                                active ? "bg-gray-100 dark:bg-gray-800" : ""
                            } flex w-full items-center gap-2 px-3 py-2 rounded-md`}
                        >
                            <Pencil className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                            Edit
                        </button>
                    )}
                </MenuItem>

                <MenuItem>
                    {({ active }) => (
                        <button
                            type="button"
                            onClick={onDelete}
                            className={`${
                                active ? "bg-red-50 dark:bg-red-900/20" : ""
                            } flex w-full items-center gap-2 px-3 py-2 rounded-md text-red-600`}
                        >
                            <Trash2 className="h-4 w-4 text-red-600" />
                            Delete
                        </button>
                    )}
                </MenuItem>
            </MenuItems>
        </Menu>
    );
}
