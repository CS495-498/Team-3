
export async function getComments(requestId) {
    const res = await fetch(`/api/feature-requests/${requestId}/comments`);

    if (!res.ok) throw new Error("Failed to load comments");

    return await res.json();
}