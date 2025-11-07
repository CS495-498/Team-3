import { NextResponse } from "next/server";

// Upload asset and immediately publish it to Contentstack
export async function POST(req) {
  try {
    const formData = await req.formData();

    // Step 1: Upload the asset
    const uploadResponse = await fetch("https://api.contentstack.io/v3/assets", {
      method: "POST",
      headers: {
        api_key: process.env.CONTENTSTACK_API_KEY,
        authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
      },
      body: formData,
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

    // Step 2: Publish the uploaded asset
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
            locales: ["en-us"], // adjust locale(s) if needed
            environments: ["preview"], // or your target environment name(s)
          },
        }),
      }
    );

    if (!publishResponse.ok) {
      const text = await publishResponse.text();
      console.error("Asset publish failed:", text);
      return NextResponse.json(
        { error: "Asset uploaded but publish failed", details: text },
        { status: publishResponse.status }
      );
    }

    const publishResult = await publishResponse.json();

    return NextResponse.json({
      message: "Asset uploaded and published successfully.",
      asset: uploadedAsset.asset,
      publish: publishResult,
    });
  } catch (err) {
    console.error("Server upload/publish failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
