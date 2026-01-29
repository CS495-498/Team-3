/**
 * Thumbnail Generation Utilities
 * These functions handle automatic thumbnail generation for videos
 */

/**
 * Extract thumbnail from a video file using canvas
 * @param {File} videoFile - The video file to extract thumbnail from
 * @returns {Promise<File>} - A File object containing the thumbnail image
 */
export async function extractThumbnailFromVideo(videoFile) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        video.preload = 'metadata';
        video.muted = true;
        video.playsInline = true;

        video.onloadedmetadata = () => {
            // Seek to 1 second or 10% of video duration, whichever is smaller
            const seekTime = Math.min(1, video.duration * 0.1);
            video.currentTime = seekTime;
        };

        video.onseeked = () => {
            try {
                // Set canvas dimensions to video dimensions
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                // Draw the current frame to canvas
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        // Create a File object from the blob
                        const thumbnailFile = new File(
                            [blob],
                            `${videoFile.name.replace(/\.[^/.]+$/, '')}_thumbnail.jpg`,
                            { type: 'image/jpeg' }
                        );
                        resolve(thumbnailFile);
                    } else {
                        reject(new Error('Failed to create thumbnail blob'));
                    }
                }, 'image/jpeg', 0.9);

                // Clean up
                URL.revokeObjectURL(video.src);
            } catch (error) {
                reject(error);
            }
        };

        video.onerror = () => {
            reject(new Error('Failed to load video for thumbnail extraction'));
        };

        // Load the video file
        video.src = URL.createObjectURL(videoFile);
    });
}

/**
 * Get YouTube thumbnail URL from video URL
 * @param {string} url - YouTube video URL
 * @returns {string|null} - Thumbnail URL or null if not a YouTube video
 */
export function getYouTubeThumbnail(url) {
    const youtubeMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
        const videoId = youtubeMatch[1];
        // Try maxresdefault first (1080p), fallback to hqdefault (720p)
        return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    return null;
}

/**
 * Get Vimeo thumbnail URL from video URL
 * @param {string} url - Vimeo video URL
 * @returns {Promise<string|null>} - Thumbnail URL or null if failed
 */
export async function getVimeoThumbnail(url) {
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (!vimeoMatch) return null;

    try {
        const response = await fetch(
            `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data.thumbnail_url || null;
    } catch (error) {
        console.error('Failed to fetch Vimeo thumbnail:', error);
        return null;
    }
}

/**
 * Download image from URL and convert to File object
 * @param {string} imageUrl - URL of the image to download
 * @param {string} filename - Desired filename for the File object
 * @returns {Promise<File>} - A File object containing the image
 */
export async function downloadImageAsFile(imageUrl, filename = 'thumbnail.jpg') {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) throw new Error('Failed to fetch image');
        const blob = await response.blob();
        return new File([blob], filename, { type: blob.type || 'image/jpeg' });
    } catch (error) {
        console.error('Failed to download image:', error);
        throw error;
    }
}

/**
 * Get video embed information from video object
 * @param {Object} video - Video object with video_url or video_file
 * @returns {Object|null} - Embed info or null if not embeddable
 */
export function getVideoEmbed(video) {
    const url = video?.video_url || video?.video_file?.url;
    if (!url) return null;

    // YouTube
    const youtubeMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
        return {
            type: "youtube",
            id: youtubeMatch[1],
            embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
        };
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
        return {
            type: "vimeo",
            id: vimeoMatch[1],
            embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        };
    }

    if (url.match(/\.(mp4|mov|webm|m4v)$/i) || video?.video_file?.url) {
        return {
            type: "file",
            embedUrl: url,
        };
    }

    return null;
}