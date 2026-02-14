import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";
import { withLogging } from '@/utils/withLogging';

async function handlePost(req, { params }) {
    const { id } = await params;
    const supabase = await createClient();

    // Get logged-in user
    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) redirect("/login");

    const { vote } = await req.json();

    if (!["up", "down", "remove"].includes(vote)) {
        return NextResponse.json(
            { error: "Vote must be 'up', 'down', or 'remove'" },
            { status: 400 }
        );
    }

    try {
        if (vote === "remove") {
            const { error: delErr } = await supabase
                .from("votes")
                .delete()
                .eq("user_id", user.id)
                .eq("req_id", id);

            if (delErr) throw delErr;
        } else {
            // UPSERT vote (up = true, down = false)
            const { error: upErr } = await supabase
                .from("votes")
                .upsert(
                    {
                        user_id: user.id,
                        req_id: id,
                        Upvoted: vote === "up" ? true : false,
                    },
                    { onConflict: "user_id,req_id" }
                );

            if (upErr) throw upErr;
        }

        const { data: votes, error: countErr } = await supabase
            .from("votes")
            .select("Upvoted")
            .eq("req_id", id);

        if (countErr) throw countErr;

        const upCount = votes.filter(v => v.Upvoted === true).length;
        const downCount = votes.filter(v => v.Upvoted === false).length;

        const total = upCount - downCount;

        // Update feature_requests table
        const { error: updateErr } = await supabase
            .from("feature_requests")
            .update({ number_of_votes: total })
            .eq("id", id);

        if (updateErr) throw updateErr;

        return NextResponse.json({ number_of_votes: total }, { status: 200 });

    } catch (err) {
        console.error("Vote error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const POST = withLogging(handlePost);
