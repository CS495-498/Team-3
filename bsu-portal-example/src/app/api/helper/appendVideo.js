import normalizeVideo from "./normalizeVideo.js";

export default function appendVideo(entry, newVideo) {
  const existingVideos = Array.isArray(entry?.videos) ? entry.videos : [];

  const normalized = existingVideos.map(normalizeVideo);

  return [...normalized, normalizeVideo(newVideo)];
}
