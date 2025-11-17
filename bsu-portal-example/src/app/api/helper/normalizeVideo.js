// normalizeVideo.js
export default function normalizeVideo(video) {
  return {
    title: video.title || null,
    description: video.description || null,
    se_name: video.se_name || null,
    date_posted: video.date_posted || null,
    video_file:
      typeof video.video_file === "string"
        ? video.video_file
        : video.video_file?.uid || null,

    thumbnail:
      typeof video.thumbnail === "string"
        ? video.thumbnail
        : video.thumbnail?.uid || null,
  };
}