import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/Supabase/server";

export async function POST(req, { params }) {
  const { id } = params;
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  // Parse body
  const body = await req.json();
  const { vote } = body; // "up" or "down"

  if (!vote || !["up", "down"].includes(vote)) {
    return NextResponse.json(
        { error: "Invalid vote type" },
        { status: 400 }
    );
  }

  try {
    // 1. Upsert vote (user can change their vote)
    const { error: voteError } = await supabase
        .from("votes")
        .upsert(
            {
              user_id: user.id,
              request_id: Number(id),
              vote,
            },
            { onConflict: "user_id,request_id" }
        );

    if (voteError) throw voteError;

    // 2. Recount votes for this request
    const { data: votes, error: fetchError } = await supabase
        .from("votes")
        .select("vote")
        .eq("request_id", Number(id));

    if (fetchError) throw fetchError;

    const up = votes.filter(v => v.vote === "up").length;
    const down = votes.filter(v => v.vote === "down").length;

    const total = up - down;

    // 3. Update total votes in feature_requests table
    const { error: updateError } = await supabase
        .from("feature_requests")
        .update({ number_of_votes: total })
        .eq("id", Number(id));

    if (updateError) throw updateError;

    return NextResponse.json(
        { number_of_votes: total },
        { status: 200 }
    );
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
        { error: error.message || "Failed to cast vote" },
        { status: 500 }
    );
  }
}
