'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/Supabase/client.js'

export default function Page() {
    const supabase = createClient()

    // State
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const emptyProfile = {
        full_name: '',
        username: '',
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
                    .select('full_name, username')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                if (data) {
                    setProfile({
                        full_name: data.full_name ?? '',
                        username: data.username ?? '',
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

                alert('Profile updated successfully!')
            } catch (err) {
                console.error('Error updating profile:', err)
                alert('Error updating profile.')
            } finally {
                setLoading(false)
            }
        }
    }

    // Controlled input handler
    const handleChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center">
            {/* Profile Banner */}
            <div className="w-full h-40 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                <div className="absolute bottom-[5px] left-79 transform -translate-x-1/2 flex items-center gap-5 text-left">
                    <img
                        src={
                            // profile.avatar_url ||
                            'https://avatar.iran.liara.run/public/4'
                        }
                        alt="Avatar"
                        className="w-37 h-37 rounded-full border-7 border-white-600 mx-auto"
                    />
                    <div className="flex flex-col gap-3">
                        <h2 className="text-5xl font-bold text-shadow-lg text-white">
                            {profile.full_name}
                        </h2>
                        <p className="bottom-[50px] text-white text-shadow-lg text-2xl">
                            {profile.username}
                        </p>
                    </div>
                </div>
            </div>

            {/* Profile Info + Form */}
            <div className="mt-16 w-full flex justify-center px-6">
                {/* Edit Profile Form */}
                <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-xl">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                        Edit Profile
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-gray-600">Full Name</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-300"
                                value={profile.full_name ?? ''}
                                onChange={(e) =>
                                    handleChange('full_name', e.target.value)
                                }
                            />
                        </div>
                        <div>
                            <label className="text-sm text-gray-600">Username</label>
                            <input
                                type="text"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-300"
                                value={profile.username ?? ''}
                                onChange={(e) =>
                                    handleChange('username', e.target.value)
                                }
                            />
                        </div>
                        <button
                            onClick={updateProfile}
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition"
                        >
                            {loading ? 'Saving...' : 'Update Profile'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}