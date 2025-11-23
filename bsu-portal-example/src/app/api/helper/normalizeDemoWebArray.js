import extractFields from "./extractFields.js";

/**
 * Normalize demo website entries into Contentstack-safe format.
 *
 * @param {Array<Object>} demos - Raw demo objects from UI or Contentstack.
 * @returns {Array<Object>} Normalized demo array for CS PUT operations.
 */
export default function normalizeDemoWebArray(demos) {
    if (!Array.isArray(demos)) return [];

    // First flatten the objects into the expected structure
    const flattened = demos.map((demo) => ({
        title: demo.title || "",
        description: demo.description || "",
        se_name: demo.se_name || "",
        date_posted: demo.date_posted || null,
        // keep the asset object for now; extractFields will convert uid → string
        image: demo.image?.uid ? demo.image : demo.image || null,
        // link MUST retain nested object shape for Contentstack
        link: {
            title: demo.link?.title || "",
            href: demo.link?.href || ""
        }
    }));

    // Extract safe top-level fields (and asset UID conversions)
    const stripped = extractFields(flattened, [
        "title",
        "description",
        "se_name",
        "image"
    ]);

    // Merge link + date_posted back (extractFields removes nested structures)
    return stripped.map((demo, i) => ({
        ...demo,
        link: flattened[i].link,
        date_posted: flattened[i].date_posted
    }));
}
