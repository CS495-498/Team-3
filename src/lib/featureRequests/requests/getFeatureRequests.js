import { getCommentCounts } from "@/lib/featureRequests/requests/getCommentCounts";
import { getProfiles } from "@/lib/featureRequests/requests/getProfiles";

export async function getFeatureRequests() {
    const res = await fetch("/api/feature-requests");
    const requests = await res.json();

    const commentCounts = await getCommentCounts(requests);

    const uniqueUserIds = [...new Set(requests.map(r => r.user_id))];
    const profiles = await getProfiles(uniqueUserIds);

    return requests.map((req) => ({
        ...req,
        commentCount: commentCounts[req.id] ?? 0,
        username: profiles[req.user_id] ?? "Anonymous",
    }));
}
