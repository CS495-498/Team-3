// bsu-portal-example/src/app/api/upload-asset-to-cs/uploadAndPublishAsset.js

export async function uploadAndPublishAsset(formData, fetchFunc = fetch) {

    try {
        // Step 1: Upload
        const uploadResponse = await fetchFunc("https://api.contentstack.io/v3/assets", {
            method: "POST",
            headers: {
            api_key: process.env.CONTENTSTACK_API_KEY,
            authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
            },
            body: formData,
        });

        if (!uploadResponse.ok) {
            return {
            error: await uploadResponse.text(),
            status: uploadResponse.status,
            };
        }

        const uploadedAsset = await uploadResponse.json();
        const assetUid = uploadedAsset?.asset?.uid;

        if (!assetUid) {
            return { error: "No asset UID returned from upload.", status: 500 };
        }

        // Step 2: Publish
        const publishResponse = await fetchFunc(
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
                environments: ["preview"],
                },
            }),
            }
        );

        if (!publishResponse.ok) {
            return {
            error: "Asset uploaded but publish failed",
            details: await publishResponse.text(),
            status: publishResponse.status,
            };
        }

        const publishResult = await publishResponse.json();

        return {
            message: "Asset uploaded and published successfully.",
            asset: uploadedAsset.asset,
            publish: publishResult,
            status: 200,
        };
    } catch (err) {
        return { error: err.message, status: 500 };
    }
}
