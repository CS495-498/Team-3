import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";
import requireAuthWithPermission from "@/utils/auth/requireAuthWithPermission";
import PERMISSIONS from "@/config/permissions";
import { withLogging } from '@/utils/withLogging';

async function handlePost(req, { params }) {
    const { id } = await params;
    const supabase = await createClient();

    // Get logged-in user
     const { error, profile } = await requireAuthWithPermission(
  
    PERMISSIONS.COMMENT_VOTE_FEATURE_REQUESTS
  );

  if (error) return error;

    const { vote } = await req.json();

    if (!["up", "remove"].includes(vote)) {
        return NextResponse.json(
            { error: "Vote must be 'up' or 'remove'" },
            { status: 400 }
        );
    }

    try {
        if (vote === "remove") {
            const { error: delErr } = await supabase
                .from("votes")
                .delete()
                .eq("user_id", profile.id)
                .eq("req_id", id);

            if (delErr) throw delErr;
        } else {
            // UPSERT vote (up = true)
            const { error: upErr } = await supabase
                .from("votes")
                .upsert(
                    {
                        user_id: profile.id,
                        req_id: id,
                        Upvoted: vote === "up",
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

        const total = votes.length;


        return NextResponse.json({ number_of_votes: total }, { status: 200 });

    } catch (err) {
        console.error("Vote error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const POST = withLogging(handlePost);
