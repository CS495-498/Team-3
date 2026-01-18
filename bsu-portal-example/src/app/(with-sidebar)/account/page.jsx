'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/Supabase/client.js'
import SuccessToast from "@/components/ui/success-toast.jsx";
import {useCurrentAvatar} from "@/hooks/use-current-avatar.js";


export default function Page() {
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("Account Updated Successfully");
    const { signedAvatarUrl } = useCurrentAvatar(user);
    const emptyProfile = {
        full_name: '',
        username: '',
        avatar_url: '',
    }
    const [profile, setProfile] = useState(emptyProfile)

    // Fetch profile on mount
    useEffect(() => {
        const fetchProfile = async () => {

            setLoading(true)
            const {data: { user }, error: userError,} = await supabase.auth.getUser()

            if (userError || !user) {
                console.error('No logged-in user:', userError)
                setLoading(false)
                return
            }
            setUser(user)

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('full_name, username, avatar_url')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                if (data) {
                    setProfile({
                        full_name: data.full_name ?? '',
                        username: data.username ?? '',
                        avatar_url: data.avatar_url ?? '',
                    })
                } else {
                    setProfile(emptyProfile)
                }
                setLoading(false)

            } catch (err) {
                console.error('Error loading user data:', err)
                alert('Error loading user data!')
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [])

    // Update profile
    const updateProfile = async () => {
        if (loading || !user) {
            console.warn("User not ready yet.")
        }
        else {
            try {
                setLoading(true)

                const updates = {
                    id: user.id,
                    full_name: profile.full_name?.trim() || null,
                    username: profile.username?.trim() || null,
                    updated_at: new Date().toISOString(),
                }

                const { error } = await supabase.from('profiles').upsert(updates)
                if (error) throw error

            } catch (err) {
                console.error('Error updating profile:', err)
                alert('Error updating profile.')
            } finally {
                setShowToast(true)
                setLoading(false)
                setTimeout(() => {
                    setShowToast(false);
                }, 3000);
            }
        }
    }

    const handleDeleteAccount = async () => {
        if (!confirm("Delete your account permanently? This cannot be undone.")) return;

        try {
            await fetch("/api/profiles/me", { method: "DELETE" });
            localStorage.setItem("toastMessage", "Account deleted");
            await supabase.auth.signOut();
            window.location.href = "/login";
        } catch {
            alert("Error deleting account.");
        }
    };



    const handleAvatarUpdate = async (e) => {
        const file = e.target.files[0];
        if (!file) return alert("No file selected");

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return alert("Not authenticated");

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            return alert("No auth session found");
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("username", profile.username || "");
        formData.append("full_name", profile.full_name || "");

        const res = await fetch(`/api/profiles/${user.id}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${session.access_token}`,
            },
            body: formData,
        });

        const updatedProfile = await res.json();

        if (!res.ok) {
            return alert(updatedProfile?.error || "Upload failed");
        }

        setProfile(updatedProfile);
    };



    // Controlled input handler
    const handleChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center">
            <SuccessToast
                message={toastMessage}
                isOpen={showToast}
                onClose={() => setShowToast(false)}
            />
            {/* Banner */}
            <div className="w-full h-44 bg-gradient-to-r from-purple-600 to-purple-700 dark:from-purple-700 dark:to-purple-800 relative">
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center">

                    <div className="relative group w-36 h-36 mb-4">
                        {/* Avatar image / circle */}
                        <div
                            className="w-36 h-36 rounded-full border-4 border-white dark:border-gray-900 shadow-xl overflow-hidden">
                            {
                                <img
                                    src={signedAvatarUrl ? signedAvatarUrl : "/DefaultProfile.png"}
                                    className="w-full h-full object-cover"
                                />
                            }
                        </div>

                        {/* Hover overlay */}
                        <div
                            className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-sm font-medium transition-opacity cursor-pointer">
                            Change Avatar
                        </div>

                        {/* Invisible file input on top */}
                        <input
                            type="file"
                            accept="image/*"
                            id="Avatar"
                            onChange={handleAvatarUpdate}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                    </div>


                    <h1 className="text-gray-900 text-3xl font-bold dark:text-white drop-shadow">
                        {profile.full_name || "Full Name"}
                    </h1>

                    <p className="text-gray-900 dark:text-white/90 drop-shadow text-lg">
                        @{profile.username || "username"}
                    </p>

                </div>
            </div>

            <div className="mt-24 w-full max-w-xl px-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-6">

                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">
                        Edit Profile
                    </h2>

                    <div className="space-y-4">
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
                <div className="mt-6 w-full max-w-xl px-6">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-red-200 dark:border-red-900">
                        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                            Danger Zone
                        </h3>

                        <button
                            onClick={handleDeleteAccount}
                            className="mt-4 w-full py-2.5 rounded-lg font-medium
            bg-red-600 text-white hover:bg-red-700
            transition-all shadow-md"
                        >
                            Delete My Account
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}