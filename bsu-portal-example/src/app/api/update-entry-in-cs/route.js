import { NextResponse } from "next/server";

export async function PUT(req) {
  try {
    const { entryUid, videos } = await req.json();

    const response = await fetch(
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

    const text = await response.text();
    if (!response.ok) throw new Error(text);

    return NextResponse.json(JSON.parse(text));
  } catch (error) {
    console.error("Server update failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
