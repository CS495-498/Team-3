// updateAndPublishAlert.js

export async function updateAndPublishAlert(entryUid, alerts, fetchFunc = fetch) {
  try {
    // Step 1: Update the entry
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

    // Step 2: Publish the entry
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
      message: "Alerts updated and published successfully.",
    };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}
