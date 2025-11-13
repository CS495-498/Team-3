/*
 * @param {Array<Object>} array - Array of video objects.
 * @param {Array<string>} fields - Fields to extract.
 * @returns {Array<Object>} Simplified array for Contentstack API updates.
*/
export default function extractFields(array, fields) {
  return array.map((item) => {
    const obj = {};

    for (const field of fields) {
      const value = item[field];

      // Handle asset references
      if (value?.uid) {
        obj[field] = value.uid;
      } else if (value !== null && value !== undefined && value !== "") {
        obj[field] = value;
      }
    }

    // Always include date_posted if available
    if (item.date_posted) {
      obj.date_posted = item.date_posted;
    }

    return obj;
  });
}
