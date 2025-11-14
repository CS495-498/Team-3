'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/Supabase/client.js'

export default function Page() {
    const supabase = createClient()

    // State
    const [loading, setLoading] = useState(true)
    const [user] = useState(null)
    const emptyProfile = {
        full_name: '',
        username: '',
        website: '',
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
                        website: data.website ?? '',
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
    }, [user, supabase])

    // Update profile
    const updateProfile = async () => {
        try {
            setLoading(true)

            const updates = {
                id: user.id,
                full_name: profile.full_name?.trim() || null,
                username: profile.username?.trim() || null,
                website: profile.website?.trim() || null,
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

    // Controlled input handler
    const handleChange = (field, value) => {
        setProfile((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center">
            {/* Profile Banner */}
            <div className="w-full h-64 bg-gradient-to-r from-indigo-500 to-purple-500 relative">
                <div className="absolute bottom-[-60px] left-1/2 transform -translate-x-1/2 text-center">
                    <img
                        src={
                            // profile.avatar_url ||
                            'https://api.dicebear.com/8.x/adventurer/svg?seed=User'
                        }
                        alt="Avatar"
                        className="w-32 h-32 rounded-full border-4 border-white mx-auto"
                    />
                    <h2 className="text-2xl font-semibold mt-3 text-gray-800">
                        {profile.full_name}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {profile.username}
                    </p>
                </div>
            </div>

            {/* Profile Info + Form */}
            <div className="mt-10 w-full max-w-4xl grid md:grid-cols-2 gap-6 px-6">
                {/* Introduction Card */}
                <div className="bg-white p-6 rounded-2xl shadow-md">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">
                        Introduction
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Hello, I’m {profile.full_name }. I love building
                        websites and learning web development.
                    </p>
                    <ul className="space-y-2 text-gray-600 text-sm">
                        <li>
                            <strong>Full name:</strong> {profile.full_name}
                        </li>
                        {profile.website && (
                            <li>
                                <strong>Website:</strong> {profile.website}
                            </li>
                        )}
                        <li>
                            <strong>Location:</strong> New York, USA
                        </li>
                    </ul>
                </div>

                {/* Edit Profile Form */}
                <div className="bg-white p-6 rounded-2xl shadow-md">
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
                        <div>
                            <label className="text-sm text-gray-600">Website</label>
                            <input
                                type="url"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring focus:ring-indigo-300"
                                value={profile.website ?? ''}
                                onChange={(e) =>
                                    handleChange('website', e.target.value)
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
