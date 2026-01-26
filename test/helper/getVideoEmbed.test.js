import { expect } from "chai";
import { getVideoEmbed } from "../../src/app/api/helper/videoThumbnailUtils.js";

describe("getVideoEmbed()", () => {
    describe("YouTube videos", () => {
        it("detects standard YouTube URL and returns embed info", () => {
            const video = {
                video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            };

            const result = getVideoEmbed(video);

            expect(result).to.deep.equal({
                type: "youtube",
                id: "dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            });
        });

        it("detects shortened youtu.be URL and returns embed info", () => {
            const video = {
                video_url: "https://youtu.be/dQw4w9WgXcQ"
            };

            const result = getVideoEmbed(video);

            expect(result).to.deep.equal({
                type: "youtube",
                id: "dQw4w9WgXcQ",
                embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
            });
        });

        it("handles YouTube URL with query parameters", () => {
            const video = {
                video_url: "https://www.youtube.com/watch?v=abc123&t=30s"
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("youtube");
            expect(result.id).to.equal("abc123");
        });
    });

    describe("Vimeo videos", () => {
        it("detects Vimeo URL and returns embed info", () => {
            const video = {
                video_url: "https://vimeo.com/123456789"
            };

            const result = getVideoEmbed(video);

            expect(result).to.deep.equal({
                type: "vimeo",
                id: "123456789",
                embedUrl: "https://player.vimeo.com/video/123456789"
            });
        });

        it("handles Vimeo URL with www prefix", () => {
            const video = {
                video_url: "https://www.vimeo.com/987654321"
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("vimeo");
            expect(result.id).to.equal("987654321");
        });
    });

    describe("Direct video files", () => {
        it("detects MP4 file by extension", () => {
            const video = {
                video_url: "https://example.com/video.mp4"
            };

            const result = getVideoEmbed(video);

            expect(result).to.deep.equal({
                type: "file",
                embedUrl: "https://example.com/video.mp4"
            });
        });

        it("detects video file from video_file.url property", () => {
            const video = {
                video_file: {
                    url: "https://cdn.example.com/uploads/video123.mp4"
                }
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("file");
            expect(result.embedUrl).to.equal("https://cdn.example.com/uploads/video123.mp4");
        });

        it("detects WEBM file", () => {
            const video = {
                video_url: "https://example.com/video.webm"
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("file");
        });

        it("detects MOV file (case insensitive)", () => {
            const video = {
                video_url: "https://example.com/video.MOV"
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("file");
        });

        it("detects M4V file", () => {
            const video = {
                video_url: "https://example.com/video.m4v"
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("file");
        });
    });

    describe("Edge cases", () => {
        it("returns null when video object is null", () => {
            const result = getVideoEmbed(null);

            expect(result).to.be.null;
        });

        it("returns null when video object is undefined", () => {
            const result = getVideoEmbed(undefined);

            expect(result).to.be.null;
        });

        it("returns null when video has no URL", () => {
            const video = {
                title: "Some Video"
            };

            const result = getVideoEmbed(video);

            expect(result).to.be.null;
        });

        it("returns null for unsupported URL format", () => {
            const video = {
                video_url: "https://example.com/video.avi"
            };

            const result = getVideoEmbed(video);

            expect(result).to.be.null;
        });

        it("prioritizes video_url over video_file.url", () => {
            const video = {
                video_url: "https://www.youtube.com/watch?v=abc123",
                video_file: {
                    url: "https://example.com/video.mp4"
                }
            };

            const result = getVideoEmbed(video);

            expect(result.type).to.equal("youtube");
        });
    });
});