export async function addComment(requestId, content) {
    const res = await fetch(`/api/feature-requests/${requestId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add comment");
    }

    return await res.json();
}