import { expect } from "chai";
import normalizeVideo from "../../src/app/api/helper/extractFields.js";

describe("normalizeVideo()", () => {

    console.log("normalizeVideo imported:", normalizeVideo);

    // Test case for a fully populated Contentstack asset object
    it("normalizes a fully populated Contentstack asset object", () => {
        const input = {
        title: "My Video",
        description: "Desc",
        se_name: "Test Name",
        date_posted: "2025-10-01",

        video_file: {
            uid: "video123",
            _version: 1,
            title: "example.mp4",
            created_by: "user123",
            updated_by: "user123",
            created_at: "2025-09-10T10:00:00.000Z",
            updated_at: "2025-09-10T10:00:00.000Z",
            content_type: "video/mp4",
            file_size: "123456",
            filename: "example.mp4",
            ACL: {},
            parent_uid: null,
            is_dir: false,
            tags: [],
            publish_details: {
            time: "2025-09-11T10:00:00.000Z",
            user: "publisher001",
            environment: "env123",
            locale: "en-us",
            },
            url: "https://assets.contentstack.io/.../example.mp4",
        },

        thumbnail: {
            uid: "thumb789",
            _version: 1,
            title: "thumb.png",
            created_by: "user123",
            updated_by: "user123",
            created_at: "2025-09-10T10:00:00.000Z",
            updated_at: "2025-09-10T10:00:00.000Z",
            content_type: "image/png",
            file_size: "98765",
            filename: "thumb.png",
            ACL: {},
            parent_uid: null,
            is_dir: false,
            tags: [],
            publish_details: {
            time: "2025-09-11T10:00:00.000Z",
            user: "publisher001",
            environment: "env123",
            locale: "en-us",
            },
            url: "https://images.contentstack.io/.../thumb.png",
        },
    };

        // Test normalization
        const result = normalizeVideo(input);

        // Normalization should flatten to only these fields
        expect(result).to.deep.equal({
        title: "My Video",
        description: "Desc",
        se_name: "Test Name",
        date_posted: "2025-10-01",
        video_file: "video123",
        thumbnail: "thumb789",
        });
    });

    // Test case for video_file and thumbnail as objects with uid properties
    it("extracts UID when video_file and thumbnail are objects", () => {
        const input = {
        video_file: { uid: "abc001" },
        thumbnail: { uid: "xyz999" },
        };

        const result = normalizeVideo(input);

        expect(result.video_file).to.equal("abc001");
        expect(result.thumbnail).to.equal("xyz999");
    });

    // Test case for video_file and thumbnail as string UIDs
    it("keeps string values as-is", () => {
        const input = {
        video_file: "file123",
        thumbnail: "img456",
        };

        const result = normalizeVideo(input);

        expect(result.video_file).to.equal("file123");
        expect(result.thumbnail).to.equal("img456");
    });

    // Test case for missing video_file and thumbnail
    it("returns null for missing values", () => {
        const result = normalizeVideo({});

        expect(result.video_file).to.equal(null);
        expect(result.thumbnail).to.equal(null);
        expect(result.title).to.equal(null);
    });
});
