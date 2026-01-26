import { expect } from "chai";
import { getYouTubeThumbnail } from "../../src/app/api/helper/videoThumbnailUtils.js";

describe("getYouTubeThumbnail()", () => {
    it("extracts thumbnail URL from standard YouTube URL", () => {
        const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.equal("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    });

    it("extracts thumbnail URL from shortened youtu.be URL", () => {
        const url = "https://youtu.be/dQw4w9WgXcQ";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.equal("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    });

    it("handles YouTube URL with additional query parameters", () => {
        const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.equal("https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg");
    });

    it("handles video IDs with hyphens and underscores", () => {
        const url = "https://www.youtube.com/watch?v=abc-123_XYZ";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.equal("https://img.youtube.com/vi/abc-123_XYZ/maxresdefault.jpg");
    });

    it("returns null for non-YouTube URLs", () => {
        const url = "https://vimeo.com/123456789";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.be.null;
    });

    it("returns null for invalid URLs", () => {
        const url = "not a url";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.be.null;
    });

    it("returns null for empty string", () => {
        const url = "";
        const result = getYouTubeThumbnail(url);
        
        expect(result).to.be.null;
    });
});