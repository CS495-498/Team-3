"use client";

import React from "react";

export default function LoadingIndicator({ label = "Loading...", className = "" }) {
    return (
        <div className={`min-h-[60vh] w-full flex items-center justify-center ${className}`}>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm">{label}</span>
            </div>
        </div>
    );
}
