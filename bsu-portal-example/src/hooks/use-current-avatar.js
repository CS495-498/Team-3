'use client'
import React, { useEffect, useState } from 'react'

export function useCurrentAvatar(user) {
    const [signedAvatarUrl, setSignedAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const res = await fetch(`/api/profiles/${user.id}`);
                if (!res.ok) {
                    console.error("Failed to fetch profile");
                    return;
                }

                const data = await res.json();

                if (data.signed_avatar_url) {
                    setSignedAvatarUrl(data.signed_avatar_url);
                }
            } catch (err) {
                console.error("Error fetching avatar:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchAvatar();
    }, [user]);
    return { signedAvatarUrl, loading }
}
