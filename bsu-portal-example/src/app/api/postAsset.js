export default async function postAsset(file, title, description, parentUid, tags) {
  try {
    const formData = new FormData();
    formData.append("asset[upload]", file);
    if (title) formData.append("asset[title]", title);
    if (description) formData.append("asset[description]", description);
    if (parentUid) formData.append("asset[parent_uid]", parentUid);
    if (tags) formData.append("asset[tags]", tags);

    const response = await fetch("/api/upload-asset-to-cs", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) throw new Error(`HTTP error! ${response.status}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Upload error:", error);
    return null;
  }
}
