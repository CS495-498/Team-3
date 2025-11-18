import extractFields  from "./extractFields.js";
/**
 * Extracts key video fields and appends one new video.
 *
 * @param {Object} entry - Contentstack entry object containing videos.
 * @param {Object} newVideo - New video object to append.
 * @returns {Array<Object>} Updated array of simplified videos.
 */



export default function appendDemoWebsite(entry, newDemos) {
  const existingDemos = Array.isArray(entry?.demos) ? entry.demos : [];

  const simplifiedDemos = extractFields(existingDemos, [
    "link",
    "image",
    "title",
    "description",
    "se_name",
  ]);

  return [...simplifiedDemos, newDemos];
}


