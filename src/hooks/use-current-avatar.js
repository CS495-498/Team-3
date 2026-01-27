import { useEffect, useState } from "react";

export function useCurrentAvatar(user, activePersona) {
    const [signedAvatarUrl, setSignedAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);

                if (activePersona) {
                    if (activePersona.avatar_url) {
                        setSignedAvatarUrl(activePersona.avatar_url);
                    } else {
                        setSignedAvatarUrl(null);
                    }
                    return;
                }

                const res = await fetch(`/api/profiles/${user.id}`);
                if (!res.ok) return;

                const data = await res.json();
                setSignedAvatarUrl(data?.signed_avatar_url ?? null);
            } catch (err) {
                console.error("Error fetching avatar:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAvatar();
    }, [user?.id, activePersona?.id, activePersona?.avatar_url]);

    return { signedAvatarUrl, loading };
}
