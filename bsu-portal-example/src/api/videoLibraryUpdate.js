// /src/api/videoLibraryUpdate.js
export default async function videoEntryUpdate(base_url, content_type_uid, entry_uid, update_data) {
    try {

        // Pass api, management token in headers
        const cstackHeaders = new Headers();
        headers.append("api_key", process.env.CONTENTSTACK_API_KEY);
        headers.append("authorization", process.env.CONTENTSTACK_MANAGEMENT_TOKEN);
        headers.append("Content-Type", "application/json");

        // Convert update_data to JSON string
        const raw = JSON.stringify({update_data});

        const response = await fetch(
            `https://${base_url}/v3/content_types/${content_type_uid}/entries/${entry_uid}`,
            {
                method: "PUT",
                headers: cstackHeaders,
                body: raw,
                redirect: "follow"
            },
        );

        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}