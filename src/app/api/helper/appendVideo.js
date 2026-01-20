import extractFields  from "./extractFields.js";
/**
 * Extracts key video fields and appends one new video.
 *
 * @param {Object} entry - Contentstack entry object containing videos.
 * @param {Object} newVideo - New video object to append.
 * @returns {Array<Object>} Updated array of simplified videos.
 */



export default function appendVideo(entry, newVideo) {
  const existingVideos = Array.isArray(entry?.videos) ? entry.videos : [];

  const simplifiedVideos = extractFields(existingVideos, [
      "video_url",
      "video_file",
      "thumbnail",
      "title",
      "description",
      "se_name",
  ]);

  return [...simplifiedVideos, newVideo];
}

// Example usage

// const video_update_items = {
// video_file: "video_file_uid_123",
// thumbnail: "thumbnail_uid_456",
// title: "New Video Title",
// description: "This is a description of the new video.",
// se_name: "new-video-se-name",
// };

// const updatedVideosJSON = appendVideo(data[0][0], updateJSON);

