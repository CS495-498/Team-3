export async function getCommentCounts(requests) {
    const ids = requests.map((r) => r.id);

    const res = await fetch("/api/feature-requests/comment-counts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
    });

    if (!res.ok) return {};
    return await res.json(); // { [id]: number }
}
