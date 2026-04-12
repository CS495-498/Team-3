// updateAndPublishVideos.js

import extractFields from "../helper/extractFields.js";

export async function updateAndPublishVideos(entryUid, videos, fetchFunc = fetch) {
  try {
    const normalizedVideos = Array.isArray(videos)
      ? extractFields(videos, [
          "video_url",
          "video_file",
          "thumbnail",
          "title",
          "description",
          "se_name",
        ])
      : videos;

    // Step 1: Update the entry
    const updateResponse = await fetchFunc(
      `https://api.contentstack.io/v3/content_types/video_library/entries/${entryUid}`,
      {
        method: "PUT",
        headers: {
          api_key: process.env.CONTENTSTACK_API_KEY,
          authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry: { videos: normalizedVideos } }),
      }
    );

    const updateText = await updateResponse.text();
    if (!updateResponse.ok) {
      return { status: updateResponse.status, error: updateText };
    }

    const updatedEntry = JSON.parse(updateText);

    // Step 2: Publish
    const publishResponse = await fetchFunc(
      `https://api.contentstack.io/v3/content_types/video_library/entries/${entryUid}/publish`,
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
      message: "Videos updated and published successfully.",
    };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}
