/*
 * @param {Array<Object>} array - Array of demo objects.
 * @returns {Array<Object>} Simplified array valid for Contentstack updates.
*/
export default function extractDemoWebsiteFields(array) {
  return array.map((item) => {
    // Normalize any image reference — MUST return STRING UID
    const normalizeImage = (img) => {
      if (!img) return null;

      // If it's an asset object with a UID
      if (typeof img === "object" && img.uid) return img.uid;

      // If already a raw UID string
      if (typeof img === "string") return img;

      return null;
    };

    return {
      title: item.title || "",
      description: item.description || "",
      link: {
        title: item.link?.title || item.title || "",
        href: item.link?.href || item.url || ""
      },
      // image must be a STRING UID, not an object
      image: normalizeImage(item.image) || normalizeImage(item.thumbnail)
    };
  });
}
