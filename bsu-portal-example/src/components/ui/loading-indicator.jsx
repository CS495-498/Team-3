"use client";

import React, { useEffect, useState } from "react";
import Stack from "@/lib/cstack";

let cachedLogoUrl = null;
let logoPromise = null;

const fetchLoadingLogo = async () => {
    if (cachedLogoUrl) return cachedLogoUrl;
    if (!logoPromise) {
        logoPromise = Stack.getElementByType("site_settings", "en-us")
            .then((result) => {
                const entry = Array.isArray(result?.[0]) ? result[0][0] : result?.[0];
                const logoField = entry?.loading_logo;
                const url = Array.isArray(logoField) ? logoField[0]?.url : logoField?.url;
                cachedLogoUrl = url || null;
                return cachedLogoUrl;
            })
            .catch(() => null);
    }
    return logoPromise;
};

export default function LoadingIndicator({ label = "Loading...", className = "" }) {
    const [logoUrl, setLogoUrl] = useState(cachedLogoUrl);

    useEffect(() => {
        let isMounted = true;
        if (!cachedLogoUrl) {
            fetchLoadingLogo().then((url) => {
                if (isMounted && url) setLogoUrl(url);
            });
        }
        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div className={`min-h-[60vh] w-full flex items-center justify-center ${className}`}>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
                {logoUrl ? (
                    <img
                        src={logoUrl}
                        alt=""
                        className="w-18 h-18"
                        aria-hidden="true"
                    />
                ) : (
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <span className="text-sm">{label}</span>
            </div>
        </div>
    );
}
