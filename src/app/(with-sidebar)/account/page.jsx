"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/Supabase/client.js";
import SuccessToast from "@/components/ui/success-toast.jsx";
import { useCurrentAvatar } from "@/hooks/use-current-avatar.js";
import { Button } from "@/components/ui/button.jsx";
import { Trash2 } from "lucide-react";



import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.jsx";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet.jsx";
import { Menu } from "lucide-react";

import {
    getUserAndProfile,
    updateProfile as updateProfileAction,
    switchPersona as switchPersonaAction,
    createPersona as createPersonaAction,
    deleteAccount as deleteAccountAction,
    uploadAvatar,
    deletePersona as deletePersonaAction,
} from "@/lib/profileActions.js";

export default function Page() {
    const supabase = createClient();

    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage] = useState("Account Updated Successfully");

    const [newPersonaName, setNewPersonaName] = useState("");
    const [newPersonaRole, setNewPersonaRole] = useState("User");
    const [addingPersona, setAddingPersona] = useState(false);
    const [personas, setPersonas] = useState([]);
    const [activePersona, setActivePersona] = useState(null);
    const [openSheet, setOpenSheet] = useState(null);

    const emptyProfile = { full_name: "", username: "", avatar_url: "" };
    const [profile, setProfile] = useState(emptyProfile);

    const { signedAvatarUrl } = useCurrentAvatar(user, activePersona);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const data = await getUserAndProfile(supabase);
                setUser(data.user);
                setProfile(data.profile);
                setPersonas(data.personas);
                setActivePersona(data.activePersona);
            } catch (err) {
                console.error("Account loadData failed:", err);
                alert(err?.message || "Error loading user data");
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const updateProfile = async () => {
        if (!user) return;
        try {
            setLoading(true);
            await updateProfileAction(supabase, user.id, profile);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (err) {
            console.error("updateProfile failed:", err);
            alert(err?.message || "Error updating profile");
        } finally {
            setLoading(false);
        }
    };

    const switchPersona = async personaId => {
        if (!user) return;
        try {
            setLoading(true);
            const finalPersonaId = personaId === "" || personaId === "original" ? null : personaId;
            await switchPersonaAction(supabase, user.id, finalPersonaId);
            setActivePersona(finalPersonaId ? personas.find(p => p.id === finalPersonaId) || null : null);
        } catch (err) {
            console.error("switchPersona failed:", err);
            alert(err?.message || "Error switching persona");
        } finally {
            setLoading(false);
        }
    };

    const createPersona = async () => {
        if (!newPersonaName.trim() || !user) return;

        try {
            setAddingPersona(true);
            const persona = await createPersonaAction(
                supabase,
                user.id,
                newPersonaName
            );
            setPersonas(prev => [...prev, persona]);
            setActivePersona(persona);
            setNewPersonaName("");
        } catch (err) {
            console.error("createPersona failed:", err);
            alert(err?.message || "Failed to create persona");
        } finally {
            setAddingPersona(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!confirm("Delete your account permanently? This cannot be undone."))
            return;

        try {
            await deleteAccountAction();
            await supabase.auth.signOut();
            window.location.href = "/login";
        } catch (err) {
            console.error("deleteAccount failed:", err);
            alert(err?.message || "Error deleting account");
        }
    };

    const handleDeletePersona = async (activePersona) => {
        if (!confirm(`Delete your persona, ${activePersona.full_name}, permanently? This cannot be undone.`))
            return;

        try {
            await deletePersonaAction(activePersona.id);

            setPersonas(prev => prev.filter(p => p.id !== activePersona.id));

            setActivePersona(null);

            setOpenSheet(null);        } catch (err) {
            console.error("deletePersona failed:", err);
            alert(err?.message || "Error deleting persona");
        }
    }
    const handleAvatarUpdate = async e => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const updatedProfile = await uploadAvatar({
                supabase,
                file,
                profile,
            });
            setProfile(updatedProfile);
        } catch (err) {
            console.error("uploadAvatar failed:", err);
            alert(err?.message || "Avatar upload failed");
        }
    };

    const handleChange = (field, value) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };




    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <SuccessToast
                message={toastMessage}
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />
            
            {/* Menu Button */}
            <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => setOpenSheet('settings')}>
                            Account Settings
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenSheet('personas')}>
                            Personas
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setOpenSheet('delete')} className="text-red-600 dark:text-red-400">
                            Delete Account
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="w-full h-32 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 relative">
                <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="relative group w-24 h-24 mb-2">
                        <div className="w-24 h-24 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden">
                            <img
                                src={signedAvatarUrl ? signedAvatarUrl : "/DefaultProfile.png"}
                                className="w-full h-full object-cover"
                                alt="Profile"
                            />
                        </div>
                        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity cursor-pointer">
                            Change Avatar
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            id="Avatar"
                            onChange={handleAvatarUpdate}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>
                    <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {activePersona ? activePersona.full_name : (profile.full_name || "Full Name")}
                    </h1>
                    <h2 className="text-med opacity-80 text-gray-700 dark:text-gray-300">
                        {activePersona ? activePersona.username : "@"+(profile.username || "Username")}
                    </h2>
                    <p className="text-sm opacity-80 text-gray-700 dark:text-gray-300">
                        {/*{activePersona ? (activePersona.role || "User") : "Original Account"}*/}
                    </p>
                </div>
            </div>

            {/* Account Settings Sheet */}
            <Sheet open={openSheet === 'settings'} onOpenChange={(open) => !open && setOpenSheet(null)}>
                <SheetContent side="left" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Account Settings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 px-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={profile.full_name ?? ""}
                                onChange={(e) => handleChange("full_name", e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                    px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                                Username
                            </label>
                            <input
                                type="text"
                                value={profile.username ?? ""}
                                onChange={(e) => handleChange("username", e.target.value)}
                                className="mt-1 block w-full rounded-lg border border-gray-300 dark:border-gray-700
                                    bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
                                    px-3 py-2 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-600 outline-none"
                            />
                        </div>
                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg text-white font-medium text-center
                                bg-gradient-to-r from-purple-600 to-purple-700
                                hover:from-purple-700 hover:to-purple-800
                                dark:from-purple-700 dark:to-purple-800 dark:hover:from-purple-800 dark:hover:to-purple-900
                                transition-all shadow-md disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Update Profile"}
                        </button>
                    </div>
                </SheetContent>
            </Sheet>

            <Sheet open={openSheet === 'personas'} onOpenChange={(open) => !open && setOpenSheet(null)}>
                <SheetContent side="left" className="w-full sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Personas</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4 px-4">
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                                Active Persona
                            </label>
                            <select
                                value={activePersona?.id ?? "original"}
                                onChange={(e) => switchPersona(e.target.value)}
                                className="w-full rounded-lg px-3 py-2 bg-white dark:bg-gray-700
        border border-gray-300 dark:border-gray-600
        text-sm text-gray-900 dark:text-gray-100"
                            >

                                <option value="original">
                                    Original Account
                                </option>

                                {personas.map(p => (
                                    <option key={p.id} value={p.id}>
                                        {p.full_name}
                                    </option>
                                ))}
                            </select>
                            {activePersona && (
                                <button
                                    type="button"
                                    onClick={() => handleDeletePersona(activePersona)}
                                    className="p-2 rounded-md text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                                    title="Delete persona"
                                >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                            )}
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 block">
                                Create New Persona
                            </label>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="New persona name"
                                    value={newPersonaName}
                                    onChange={(e) => setNewPersonaName(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2
                                        border border-gray-300 dark:border-gray-600
                                        bg-white dark:bg-gray-700
                                        text-sm text-gray-900 dark:text-gray-100"
                                />
                                <select
                                    value={newPersonaRole}
                                    onChange={(e) => setNewPersonaRole(e.target.value)}
                                    className="w-full rounded-lg px-3 py-2 bg-white dark:bg-gray-700
                                        border border-gray-300 dark:border-gray-600
                                        text-sm text-gray-900 dark:text-gray-100"
                                >
                                    <option value="User">User</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Viewer">Viewer</option>
                                </select>
                                <button
                                    onClick={createPersona}
                                    disabled={addingPersona || !newPersonaName.trim()}
                                    className="w-full py-2 rounded-lg text-sm font-medium
                                        bg-purple-600 text-white
                                        hover:bg-purple-700
                                        disabled:opacity-50"
                                >
                                    {addingPersona ? "Creating..." : "Create Persona"}
                                </button>
                            </div>
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            {/* Delete Account Sheet */}
            <Sheet open={openSheet === 'delete'} onOpenChange={(open) => !open && setOpenSheet(null)}>
                <SheetContent side="left" className="w-full sm:max-w-md px-4">
                    <SheetHeader>
                        <SheetTitle className="text-red-600 dark:text-red-400">Danger Zone</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            Deleting your account will permanently remove all your data. This action cannot be undone.
                        </p>
                        <button
                            onClick={handleDeleteAccount}
                            className="w-full py-2.5 rounded-lg font-medium
                                bg-red-600 text-white hover:bg-red-700
                                transition-all shadow-md"
                        >
                            Delete My Account
                        </button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    )
}