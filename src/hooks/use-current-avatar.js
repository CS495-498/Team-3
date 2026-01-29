import { useEffect, useState } from "react";
import { createClient } from "@/utils/Supabase/client";

const supabase = createClient();

export function useCurrentAvatar(user, activePersona) {
    const [signedAvatarUrl, setSignedAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user?.id) return;

            // ---- PERSONA ----
            if (activePersona) {
                if (!activePersona.avatar_url) {
                    setSignedAvatarUrl(null);
                    return;
                }

                setLoading(true);

                const { data, error } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(activePersona.avatar_url, 60 * 60);

                if (!error) {
                    setSignedAvatarUrl(data.signedUrl);
                } else {
                    console.error("Persona avatar sign error:", error);
                    setSignedAvatarUrl(null);
                }

                setLoading(false);
                return;
            }

            // ---- PROFILE ----
            setLoading(true);

            const res = await fetch(`/api/profiles/${user.id}`);
            if (!res.ok) {
                setLoading(false);
                return;
            }

            const data = await res.json();
            setSignedAvatarUrl(data?.signed_avatar_url ?? null);
            setLoading(false);
        };

        fetchAvatar();
    }, [user?.id, activePersona?.id, activePersona?.avatar_url]);

    return { signedAvatarUrl, loading };
}
