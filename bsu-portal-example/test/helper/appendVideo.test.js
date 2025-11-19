import { expect } from "chai";
import appendVideo from "../../src/app/api/helper/appendVideo.js";
import normalizeVideo from "../../src/app/api/helper/extractFields.js";

describe("appendVideo()", () => {

  it("appends a new normalized video when entry has no videos", () => {
    const newVideo = {
      title: "New Vid",
      description: "New Desc",
      se_name: "New SE",
      date_posted: "2025-01-01",
      video_file: { uid: "newFile001" },
      thumbnail: { uid: "newThumb001" },
    };

    const result = appendVideo({}, newVideo);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal(normalizeVideo(newVideo));
  });

  it("normalizes existing videos and appends a new one", () => {
    const entry = {
      videos: [
        {
          title: "Old Vid",
          description: "Old Desc",
          se_name: "Old SE",
          date_posted: "2024-12-01",
          video_file: {
            uid: "oldFile123",
            _version: 1,
            title: "old.mp4",
            created_by: "userX",
            updated_by: "userX",
            created_at: "2024-12-01T12:00:00.000Z",
            updated_at: "2024-12-01T12:00:00.000Z",
            content_type: "video/mp4",
            file_size: "999999",
            filename: "old.mp4",
            ACL: {},
            parent_uid: null,
            is_dir: false,
            tags: [],
            publish_details: {
              time: "2024-12-01T13:00:00.000Z",
              user: "publisher",
              environment: "env123",
              locale: "en-us",
            },
            url: "https://assets.contentstack.io/.../old.mp4",
          },
          thumbnail: {
            uid: "oldThumb123",
            _version: 1,
            title: "thumb.png",
            created_by: "userX",
            updated_by: "userX",
            created_at: "2024-12-01T12:00:00.000Z",
            updated_at: "2024-12-01T12:00:00.000Z",
            content_type: "image/png",
            file_size: "111111",
            filename: "thumb.png",
            ACL: {},
            parent_uid: null,
            is_dir: false,
            tags: [],
            publish_details: {
              time: "2024-12-01T13:00:00.000Z",
              user: "publisher",
              environment: "env123",
              locale: "en-us",
            },
            url: "https://images.contentstack.io/.../thumb.png",
          },
        },
      ],
    };

    const newVideo = {
      title: "Brand New",
      description: "Shiny",
      se_name: "SE New",
      date_posted: "2025-02-02",
      video_file: "fileXYZ",
      thumbnail: "thumbXYZ",
    };

    const result = appendVideo(entry, newVideo);

    expect(result).to.have.length(2);

    // First entry normalized
    expect(result[0]).to.deep.equal(normalizeVideo(entry.videos[0]));

    // New entry normalized
    expect(result[1]).to.deep.equal(normalizeVideo(newVideo));
  });

  it("handles invalid or non-array .videos gracefully", () => {
    const newVideo = {
      video_file: { uid: "safe001" },
      thumbnail: { uid: "safeThumb001" },
    };

    const result = appendVideo({ videos: null }, newVideo);

    expect(result).to.have.length(1);
    expect(result[0]).to.deep.equal(normalizeVideo(newVideo));
  });
});
