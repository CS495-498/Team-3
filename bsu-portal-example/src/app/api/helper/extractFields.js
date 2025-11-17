// extractFields.js
export default function extractFields(videos, fields) {
  return videos.map(video => {
    const simplified = {};

    fields.forEach(field => {
      const value = video[field];

      if (field === "video_file" || field === "thumbnail") {
        simplified[field] =
          typeof value === "string"
            ? value
            : value?.uid ?? null;   // <-- flatten nested objects
      } else {
        simplified[field] = value ?? null;
      }
    });

    return simplified;
  });
}
