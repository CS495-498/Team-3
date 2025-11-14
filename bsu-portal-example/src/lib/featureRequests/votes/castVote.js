export async function castVote(requestId, voteType) {
    const res = await fetch(`/api/feature-requests/${requestId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vote: voteType }),
    });

    if (!res.ok) throw new Error("Vote failed");

    return await res.json();
}
