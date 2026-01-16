"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/Supabase/client.js";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const supabase = createClient();

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const [checking, setChecking] = useState(true);
    const [hasSession, setHasSession] = useState(false);
    const [message, setMessage] = useState("");

    useEffect(() => {
        let ignore = false;

        async function checkRecoverySession() {
            setMessage("");

            // Only users who arrived via the reset email link (or already have a valid session)
            // should have a session here.
            const { data, error } = await supabase.auth.getSession();

            if (ignore) return;

            if (error) {
                setMessage(error.message);
                setHasSession(false);
                setChecking(false);
                return;
            }

            if (!data?.session) {
                setMessage(
                    "This password update link is missing or expired. Please request a new reset email."
                );
                setHasSession(false);
                setChecking(false);
                return;
            }

            setHasSession(true);
            setChecking(false);
        }

        checkRecoverySession();
        return () => {
            ignore = true;
        };
    }, [supabase]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage("");

        if (password.length < 8) {
            setMessage("Password must be at least 8 characters.");
            return;
        }
        if (password !== confirm) {
            setMessage("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // This only succeeds if the recovery session exists
            const { error } = await supabase.auth.updateUser({ password });

            if (error) {
                setMessage(error.message);
                return;
            }

            setMessage("Password updated! Redirecting to login...");
            await supabase.auth.signOut();

            setTimeout(() => {
                router.push("/login");
            }, 900);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen w-screen bg-white dark:bg-gray-900 items-center justify-center px-6">
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow">
                <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100">
                    Update Password
                </h1>

                {checking ? (
                    <div className="mt-6 text-center text-gray-600 dark:text-gray-300">
                        Validating reset link…
                    </div>
                ) : hasSession ? (
                    <form className="space-y-4 mt-6" onSubmit={handleUpdate}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                New password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Confirm password
                            </label>
                            <input
                                type="password"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#88563b]"
                                autoComplete="new-password"
                                disabled={loading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#88563b] hover:bg-[#714830] text-white font-semibold py-2 rounded-md transition disabled:opacity-70"
                        >
                            {loading ? "Updating..." : "Update password"}
                        </button>

                        {message && (
                            <p className="mt-2 text-center text-sm text-red-600 dark:text-red-400">
                                {message}
                            </p>
                        )}
                    </form>
                ) : (
                    <div className="mt-6 text-center">
                        {message && (
                            <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
                        )}
                        <button
                            onClick={() => router.push("/login/forgot-password")}
                            className="mt-4 text-[#88563b] font-semibold underline text-sm"
                        >
                            Request a new reset email
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
