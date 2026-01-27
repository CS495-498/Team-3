import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserAndProfile(supabase: SupabaseClient) {
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        throw new Error("No authenticated user");
    }

    const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url, active_persona_id")
        .eq("id", user.id)
        .single();

    if (profileError) {
        throw new Error(profileError.message);
    }

    const { data: personas, error: personasError } = await supabase
        .from("personas")
        .select("*")
        .eq("owner_id", user.id);

    if (personasError) {
        throw new Error(personasError.message);
    }

    const activePersona =
        profileData?.active_persona_id && personas
            ? personas.find(p => p.id === profileData.active_persona_id) ?? null
            : null;
    return {
        user,
        profile: {
            full_name: profileData?.full_name ?? "",
            username: profileData?.username ?? "",
            avatar_url: profileData?.avatar_url ?? "",
        },
        personas: personas ?? [],
        activePersona,
    };
}



export async function updateProfile(
    supabase: SupabaseClient,
    userId: string,
    profile: { full_name: string; username: string }
) {
    const updates = {
        id: userId,
        full_name: profile.full_name?.trim() || null,
        username: profile.username?.trim() || null,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(updates);
    if (error) throw error;
}



export async function switchPersona(
    supabase: SupabaseClient,
    userId: string,
    personaId: string | null
) {
    const { error } = await supabase
        .from("profiles")
        .update({ active_persona_id: personaId })
        .eq("id", userId);

    if (error) throw error;
}



export async function createPersona(
    supabase: SupabaseClient,
    userId: string,
    displayName: string
) {
    const trimmed = displayName.trim();
    if (!trimmed) {
        throw new Error("Persona name cannot be empty");
    }

    const { data, error } = await supabase
        .from("personas")
        .insert({
            owner_id: userId,
            full_name: trimmed,
            username: null,
            avatar_url: null,
        })
        .select()
        .single();
    if (error) throw error;

    const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({ active_persona_id: data.id })
        .eq("id", userId);

    if (profileUpdateError) {
        throw new Error(profileUpdateError.message);
    }

    return data;
}




export async function deleteAccount() {
    const res = await fetch("/api/profiles/me", { method: "DELETE" });
    if (!res.ok) {
        throw new Error("Failed to delete account");
    }
}


export async function uploadAvatar({
                                       supabase,
                                       file,
                                       profile,
                                   }: {
    supabase: SupabaseClient;
    file: File;
    profile: { username?: string; full_name?: string };
}) {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) throw new Error("Not authenticated");

    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
        throw new Error("No auth session");
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

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data?.error || "Upload failed");
    }

    return data;
}
