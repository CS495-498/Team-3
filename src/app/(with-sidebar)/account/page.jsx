"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/Supabase/client.js";
import { CURRENT_USER_UPDATED_EVENT } from "@/context/UserContext.jsx";
import SuccessToast from "@/components/ui/success-toast.jsx";
import {
    AVATAR_UPDATED_EVENT,
    useCurrentAvatar,
} from "@/hooks/use-current-avatar.js";
import { Button } from "@/components/ui/button.jsx";
import { Camera, PencilLine, ShieldCheck, Trash2 } from "lucide-react";

export default function Page() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage] = useState("Account Updated Successfully");
    const [canUsePersonas, setCanUsePersonas] = useState(false);

    const [newPersonaName, setNewPersonaName] = useState("");
    const [addingPersona, setAddingPersona] = useState(false);
    const [personas, setPersonas] = useState([]);
    const [activePersona, setActivePersona] = useState(null);
    const [editingField, setEditingField] = useState(null);

    const emptyProfile = { full_name: "", username: "", avatar_url: "", role: "" };
    const [profile, setProfile] = useState(emptyProfile);

    const { signedAvatarUrl } = useCurrentAvatar(user, activePersona);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                const res = await fetch("/api/profiles/me");
                if (!res.ok) throw new Error("Failed to load user");
 
                const data = await res.json();

                setUser({ id: data.id });
                setProfile({
                    full_name: data.full_name ?? "",
                    username: data.username ?? "",
                    avatar_url: data.avatar_url ?? "",
                    role: data.role ?? "",
                });
                setCanUsePersonas(Boolean(data.canUsePersonas));
                setPersonas(data.personas ?? []);
                setActivePersona(data.activePersona ?? null);
            } catch (err) {
                console.error("Account load failed:", err);
                alert(err?.message || "Error loading user data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const updateProfile = async () => {
        try {
            setLoading(true);

            const res = await fetch("/api/profiles/me", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(profile),
            });

            if (!res.ok) {
                let message = "Update failed";

                try {
                    const data = await res.json();
                    message = data?.error || message;
                } catch {
                }

                throw new Error(message);
            }

            window.dispatchEvent(new Event(CURRENT_USER_UPDATED_EVENT));
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
            console.error("updateProfile failed:", err);
            alert(err?.message || "Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    const switchPersona = async (personaId) => {
        try {
            setLoading(true);
            const finalPersonaId =
                personaId === "" || personaId === "original"
                    ? null
                    : personaId;

            const res = await fetch("/api/personas/switch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ personaId: finalPersonaId }),
            });

            if (!res.ok) throw new Error("Failed to switch persona");

            const nextActivePersona =
                finalPersonaId
                    ? personas.find((persona) => persona.id === finalPersonaId) ?? null
                    : null;

            setActivePersona(nextActivePersona);
            window.dispatchEvent(new Event(CURRENT_USER_UPDATED_EVENT));
        } catch (err) {
            console.error("switchPersona failed:", err);
            alert(err?.message || "Error switching persona");
        } finally {
            setLoading(false);
        }
    };

    const createPersona = async () => {
        if (!newPersonaName.trim()) return;

        try {
            setAddingPersona(true);

            const res = await fetch("/api/personas", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: newPersonaName }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to create persona");
            }

            const persona = await res.json();

            setPersonas((prev) => [...prev, persona]);
            setActivePersona(persona);
            setNewPersonaName("");
            window.dispatchEvent(new Event(CURRENT_USER_UPDATED_EVENT));
        } catch (err) {
            console.error("createPersona failed:", err);
            alert(err?.message || "Failed to create persona");
        } finally {
            setAddingPersona(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Delete your account permanently? This cannot be undone.")) {
            return;
        }

        try {
            const res = await fetch("/api/profiles/me", { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");

            await supabase.auth.signOut();
            window.location.href = "/login";
        } catch (err) {
            console.error("deleteAccount failed:", err);
            alert(err?.message || "Error deleting account");
        }
    };

    const handleDeletePersona = async (persona) => {
        if (!confirm(`Delete your persona, ${persona.full_name}, permanently?`)) {
            return;
        }

        try {
            const res = await fetch(`/api/personas/${persona.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete persona");

            setPersonas((prev) => prev.filter((item) => item.id !== persona.id));
            if (activePersona?.id === persona.id) {
                setActivePersona(null);
            }
            window.dispatchEvent(new Event(CURRENT_USER_UPDATED_EVENT));
        } catch (err) {
            console.error("deletePersona failed:", err);
            alert(err?.message || "Error deleting persona");
        }
    };

    const handleAvatarUpdate = async (event) => {
        const input = event?.target;
        const file = input?.files?.[0];
        if (!file) return;

        try {
            if (!user?.id) {
                throw new Error("Your session is unavailable. Refresh the page and try again.");
            }

            const formData = new FormData();
            formData.append("file", file);
            formData.append("username", profile.username || "");
            formData.append("full_name", profile.full_name || "");

            const res = await fetch(`/api/profiles/${user.id}`, {
                method: "PUT",
                body: formData,
            });

            if (!res.ok) throw new Error("Upload failed");

            const data = await res.json();

            if (activePersona) {
                setActivePersona(data);
                setPersonas((prev) =>
                    prev.map((persona) =>
                        persona.id === data.id ? { ...persona, ...data } : persona
                    )
                );
            } else {
                setProfile((prev) => ({
                    ...prev,
                    avatar_url: data.avatar_url ?? prev.avatar_url,
                    full_name: data.full_name ?? prev.full_name,
                    username: data.username ?? prev.username,
                }));
            }

            window.dispatchEvent(new Event(CURRENT_USER_UPDATED_EVENT));
            window.dispatchEvent(new Event(AVATAR_UPDATED_EVENT));
        } catch (err) {
            console.error("uploadAvatar failed:", err);
            alert(err?.message || "Avatar upload failed");
        } finally {
            if (input) {
                input.value = "";
            }
        }
    };

    const handleChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }));
    };

    const handleInlineSave = async (field) => {
        await updateProfile();
        setEditingField((current) => (current === field ? null : current));
    };

    const displayName = activePersona?.full_name || profile.full_name || "Your Account";
    const displayUsername = activePersona?.username || profile.username || "username";
    const displayRole = activePersona
        ? "persona"
        : (profile.role || "member");

    return (
        <div className="min-h-screen bg-slate-100 px-4 py-8 dark:bg-slate-950 sm:px-6 lg:px-10">
            <SuccessToast
                message={toastMessage}
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />

            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="h-32 bg-[radial-gradient(circle_at_top_left,_#7c3aed,_#4f46e5_55%,_#111827)]" />
                    <div className="px-6 pb-6">
                        <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg dark:border-slate-900 dark:bg-slate-800">
                                    <img
                                        src={signedAvatarUrl || "/DefaultProfile.png"}
                                        className="h-full w-full object-cover"
                                        alt="Profile"
                                    />
                                    <label className="absolute inset-x-0 bottom-0 flex cursor-pointer items-center justify-center gap-1 bg-black/60 px-2 py-2 text-xs font-medium text-white">
                                        <Camera className="h-3.5 w-3.5" />
                                        Change
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAvatarUpdate}
                                            className="hidden"
                                        />
                                    </label>
                                </div>

                                <div className="pt-2">
                                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300">
                                        Account Settings
                                    </p>
                                    <h1 className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                                        {displayName}
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        @{displayUsername}
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                    <ShieldCheck className="h-4 w-4" />
                                    {profile.role || "member"}
                                </span>
                                {activePersona && (
                                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                                        <ShieldCheck className="h-4 w-4" />
                                        persona
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <div className="space-y-6">
                    <div className="w-full">
                        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                        Account Overview
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                        Review your default account details.
                                    </p>
                                </div>
                            </div>

                            <dl className="space-y-4 text-sm">
                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <dt className="text-slate-500 dark:text-slate-400">Full Name</dt>
                                            {editingField === "full_name" ? (
                                                <input
                                                    type="text"
                                                    value={profile.full_name ?? ""}
                                                    onChange={(event) => handleChange("full_name", event.target.value)}
                                                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/30"
                                                    autoFocus
                                                />
                                            ) : (
                                                <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                                                    {profile.full_name || "Not set"}
                                                </dd>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (editingField === "full_name") {
                                                    handleInlineSave("full_name");
                                                } else {
                                                    setEditingField("full_name");
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <PencilLine className="h-3.5 w-3.5" />
                                            {editingField === "full_name" ? "Save" : "Edit"}
                                        </button>
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <dt className="text-slate-500 dark:text-slate-400">Username</dt>
                                            {editingField === "username" ? (
                                                <input
                                                    type="text"
                                                    value={profile.username ?? ""}
                                                    onChange={(event) => handleChange("username", event.target.value)}
                                                    className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/30"
                                                    autoFocus
                                                />
                                            ) : (
                                                <dd className="mt-1 font-medium text-slate-900 dark:text-slate-100">
                                                    @{profile.username || "username"}
                                                </dd>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (editingField === "username") {
                                                    handleInlineSave("username");
                                                } else {
                                                    setEditingField("username");
                                                }
                                            }}
                                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            <PencilLine className="h-3.5 w-3.5" />
                                            {editingField === "username" ? "Save" : "Edit"}
                                        </button>
                                    </div>
                                </div>

                            </dl>
                            <div className="mt-4 flex items-center justify-between gap-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                                <div>
                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                        Delete account
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Permanently removes your profile and any associated personas.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleDeleteAccount}
                                    className="shrink-0 rounded-xl bg-red-600 text-white hover:bg-red-700"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </section>

                        {canUsePersonas && (
                            <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                            Personas
                                        </h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">
                                            Switch into alternate personas for testing or role-based workflows.
                                        </p>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-sm text-indigo-700 dark:border-indigo-500/40 dark:bg-indigo-500/10 dark:text-indigo-200">
                                        {personas.length} persona{personas.length === 1 ? "" : "s"}
                                    </span>
                                </div>

                                <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                                    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Active Persona
                                        </label>
                                        <select
                                            value={activePersona?.id ?? "original"}
                                            onChange={(event) => switchPersona(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/30"
                                        >
                                            <option value="original">Original Account</option>
                                            {personas.map((persona) => (
                                                <option key={persona.id} value={persona.id}>
                                                    {persona.full_name}
                                                </option>
                                            ))}
                                        </select>

                                        {activePersona && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => handleDeletePersona(activePersona)}
                                                className="mt-4 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-500/30 dark:hover:bg-red-500/10"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete Active Persona
                                            </Button>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-700">
                                        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            Create New Persona
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="New persona name"
                                            value={newPersonaName}
                                            onChange={(event) => setNewPersonaName(event.target.value)}
                                            className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:ring-indigo-500/30"
                                        />

                                        <Button
                                            onClick={createPersona}
                                            disabled={addingPersona || !newPersonaName.trim()}
                                            className="mt-4 w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {addingPersona ? "Creating..." : "Create Persona"}
                                        </Button>
                                    </div>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
