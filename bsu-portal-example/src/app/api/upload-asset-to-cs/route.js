import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("asset[upload]");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided. Expected field: asset[upload]" },
        { status: 400 }
      );
    }

    const uploadForm = new FormData();
    uploadForm.append("asset[upload]", file);
    uploadForm.append("asset[title]", file.name);

    // Upload to Contentstack
    const uploadResponse = await fetch("https://api.contentstack.io/v3/assets", {
      method: "POST",
      headers: {
        api_key: process.env.CONTENTSTACK_API_KEY,
        authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
      },
      body: uploadForm,
    });

    if (!uploadResponse.ok) {
      const text = await uploadResponse.text();
      return NextResponse.json({ error: text }, { status: uploadResponse.status });
    }

    const uploadedAsset = await uploadResponse.json();
    const assetUid = uploadedAsset?.asset?.uid;

    if (!assetUid) {
      throw new Error("No asset UID returned from upload.");
    }

    // Publish the asset
    const publishResponse = await fetch(
      `https://api.contentstack.io/v3/assets/${assetUid}/publish`,
      {
        method: "POST",
        headers: {
          api_key: process.env.CONTENTSTACK_API_KEY,
          authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          asset: {
            locales: ["en-us"],
            environments: [process.env.CONTENTSTACK_ENVIRONMENT],
          },
        }),
      }
    );

    if (!publishResponse.ok) {
      const text = await publishResponse.text();
      return NextResponse.json(
        { error: "Asset uploaded but publish failed", details: text },
        { status: publishResponse.status }
      );
    }

    return NextResponse.json({
      message: "Asset uploaded and published successfully.",
      asset: uploadedAsset.asset,
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
