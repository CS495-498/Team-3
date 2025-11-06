import { NextResponse } from "next/server";

// Handles multipart form data uploads to Contentstack
export async function POST(req) {
  try {
    const formData = await req.formData();

    // Forward upload to Contentstack
    const response = await fetch("https://api.contentstack.io/v3/assets", {
      method: "POST",
      headers: {
        api_key: process.env.CONTENTSTACK_API_KEY,
        authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json({ error: text }, { status: response.status });
    }

    const uploadedAsset = await response.json();
    return NextResponse.json(uploadedAsset);
  } catch (err) {
    console.error("Server upload failed:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
