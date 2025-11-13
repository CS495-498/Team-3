import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const { entryUid, videos } = await req.json();

    // Step 1: Update the entry in Contentstack
    const updateResponse = await fetch(
      `https://api.contentstack.io/v3/content_types/video_library/entries/${entryUid}`,
      {
        method: "PUT",
        headers: {
          api_key: process.env.CONTENTSTACK_API_KEY,
          authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ entry: { videos } }),
      }
    );

    const updateText = await updateResponse.text();
    if (!updateResponse.ok) throw new Error(updateText);

    const updatedEntry = JSON.parse(updateText);

    // Step 2: Publish the entry
    const publishResponse = await fetch(
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
    if (!publishResponse.ok) throw new Error(publishText);

    // Step 3: Return the final (published) entry
    return NextResponse.json({
      entry: updatedEntry.entry,
      message: "Entry updated and published successfully.",
    });
  } catch (error) {
    console.error("Server update/publish failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
