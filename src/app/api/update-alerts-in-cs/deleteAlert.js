export async function deleteNotification(entryUid, alerts, fetchFunc = fetch) {
    try {
        // -----------------------------
        // VALIDATION
        // -----------------------------
        if (!entryUid) {
            return { status: 500, error: "Missing entryUid" };
        }

        if (!Array.isArray(alerts)) {
            return { status: 500, error: "Missing alerts array" };
        }

        // -----------------------------
        // STEP 1: UPDATE ENTRY
        // -----------------------------
        const updateResponse = await fetchFunc(
            `https://api.contentstack.io/v3/content_types/homepage/entries/${entryUid}`,
            {
                method: "PUT",
                headers: {
                    api_key: process.env.CONTENTSTACK_API_KEY,
                    authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ entry: { alerts } }),
            }
        );

        const updateText = await updateResponse.text();
        if (!updateResponse.ok) {
            return { status: updateResponse.status, error: updateText };
        }

        const updatedEntry = JSON.parse(updateText);

        // -----------------------------
        // STEP 2: PUBLISH ENTRY
        // -----------------------------
        const publishResponse = await fetchFunc(
            `https://api.contentstack.io/v3/content_types/homepage/entries/${entryUid}/publish`,
            {
                method: "POST",
                headers: {
                    api_key: process.env.CONTENTSTACK_API_KEY,
                    authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    entry: {
                        environments: ["preview"],
                        locales: ["en-us"],
                    },
                }),
            }
        );

        const publishText = await publishResponse.text();

        if (!publishResponse.ok) {
            return {
                status: publishResponse.status,
                error: "Publish failed",
                details: publishText,
            };
        }

        return {
            status: 200,
            entry: updatedEntry.entry,
            message: "Alert deleted and entry published successfully.",
        };
    } catch (err) {
        return { status: 500, error: err.message };
    }
}