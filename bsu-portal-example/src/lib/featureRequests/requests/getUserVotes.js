export async function getUserVotes() {
    const res = await fetch("/api/votes");
    const data = await res.json();

    const formatted = {};
    data.forEach(v => {
        formatted[v.req_id] = v.Upvoted ? "up" : "down";
    });

    return formatted;
}