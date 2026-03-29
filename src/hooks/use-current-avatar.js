import { useEffect, useState } from "react";
import { createClient } from "@/utils/Supabase/client";

const supabase = createClient();
export const AVATAR_UPDATED_EVENT = "avatar-updated";

export function useCurrentAvatar(user, activePersona) {
    const [signedAvatarUrl, setSignedAvatarUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const hasActivePersona = Boolean(activePersona);
    const activePersonaId = activePersona?.id ?? null;
    const activePersonaAvatarUrl = activePersona?.avatar_url ?? null;

    useEffect(() => {
        const fetchAvatar = async () => {
            if (!user?.id) return;

            // ---- PERSONA ----
            if (hasActivePersona) {
                if (!activePersonaAvatarUrl) {
                    setSignedAvatarUrl(null);
                    return;
                }

                setLoading(true);

                const { data, error } = await supabase.storage
                    .from("avatars")
                    .createSignedUrl(activePersonaAvatarUrl, 60 * 60);

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

        const handleAvatarUpdated = () => {
            fetchAvatar();
        };

        fetchAvatar();
        window.addEventListener(AVATAR_UPDATED_EVENT, handleAvatarUpdated);

        return () => {
            window.removeEventListener(
                AVATAR_UPDATED_EVENT,
                handleAvatarUpdated
            );
        };
    }, [user?.id, hasActivePersona, activePersonaId, activePersonaAvatarUrl]);

    return { signedAvatarUrl, loading };
}
