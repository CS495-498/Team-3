export async function deleteAssets(assetUids, fetchFunc = fetch) {
  try {
    if (!Array.isArray(assetUids)) {
      return { status: 500, error: "Missing assetUids array" };
    }

    const normalizedAssetUids = [...new Set(assetUids.filter(Boolean))];

    if (!normalizedAssetUids.length) {
      return {
        status: 204,
        deletedAssetUids: [],
        message: "No assets to delete.",
      };
    }

    const deletedAssetUids = [];
    const skippedAssetUids = [];

    for (const assetUid of normalizedAssetUids) {
      const deleteResponse = await fetchFunc(
        `https://api.contentstack.io/v3/assets/${assetUid}`,
        {
          method: "DELETE",
          headers: {
            api_key: process.env.CONTENTSTACK_API_KEY,
            authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
          },
        }
      );

      if (!deleteResponse.ok) {
        const details = await deleteResponse.text();

        // Asset deletion is idempotent for our pipeline: if it is already gone,
        // keep the successful entry update instead of surfacing a hard failure.
        if (deleteResponse.status === 404) {
          skippedAssetUids.push(assetUid);
          continue;
        }

        return {
          status: deleteResponse.status,
          error: `Failed to delete asset ${assetUid}`,
          details,
        };
      }

      deletedAssetUids.push(assetUid);
    }

    return {
      status: 200,
      deletedAssetUids,
      skippedAssetUids,
      message: skippedAssetUids.length
        ? "Assets deleted successfully. Some assets were already missing."
        : "Assets deleted successfully.",
    };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}
