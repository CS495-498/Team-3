export async function getCommentCounts(requests) {
    const counts = {};

    await Promise.all(
        requests.map(async (req) => {
            const res = await fetch(`/api/feature-requests/${req.id}/comments`);
            const data = await res.json();
            counts[req.id] = data.length || 0;
        })
    );

    return counts;
}
