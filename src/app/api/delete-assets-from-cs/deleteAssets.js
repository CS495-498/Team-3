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
        return {
          status: deleteResponse.status,
          error: `Failed to delete asset ${assetUid}`,
          details: await deleteResponse.text(),
        };
      }
    }

    return {
      status: 200,
      deletedAssetUids: normalizedAssetUids,
      message: "Assets deleted successfully.",
    };
  } catch (err) {
    return { status: 500, error: err.message };
  }
}
