import { getCommentCounts } from "@/lib/featureRequests/requests/getCommentCounts";

export async function getFeatureRequests() {
    const res = await fetch("/api/feature-requests");
    if (!res.ok) return [];

    const requests = await res.json();

    const commentCounts = await getCommentCounts(requests);

    return requests.map((req) => ({
        ...req,
        commentCount: commentCounts[req.id] ?? 0,
        username: req.username || req.profiles?.username || "Anonymous",
        full_name: req.full_name || req.profiles?.full_name || "",
        voter_usernames: req.voter_usernames || [],
        voter_full_names: req.voter_full_names || [],
    }));
}
