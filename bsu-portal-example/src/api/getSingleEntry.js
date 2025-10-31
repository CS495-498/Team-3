export default async function fetchSingleEntry(content_type_uid, entry_uid, _version) {
    try {
        const response = await fetch(
            `https://api.contentstack.io/v3/content_types/${content_type_uid}/entries/${entry_uid}?versions=${_version}`,
            {
                method: "GET",
                headers: {
                    "api_key": process.env.CONTENTSTACK_API_KEY,
                    "authorization": process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
                    "Content-Type": "application/json",
                },
            }
        );

        if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Fetch error:", error);
        return null;
    }
}