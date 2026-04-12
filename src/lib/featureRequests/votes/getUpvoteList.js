export async function getUpvoteList(requestID) {
    const res = await fetch(`/api/feature-requests/${requestID}/vote-list`);

    if (!res.ok) throw new Error("Upvote List Retrieval Failed");

    return await res.json();
}