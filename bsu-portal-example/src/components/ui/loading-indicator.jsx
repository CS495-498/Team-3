"use client";

import React from "react";

export default function LoadingIndicator({ label = "Loading...", className = "" }) {
    return (
        <div className={`min-h-[60vh] w-full flex items-center justify-center ${className}`}>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                <img
                    src="/spinning_logo.webp"
                    alt=""
                    className="w-15 h-15"
                    aria-hidden="true"
                />
                <span className="text-sm">{label}</span>
            </div>
        </div>
    );
}
