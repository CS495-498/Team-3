import { expect } from "chai";
import appendVideo from "../../src/app/api/helper/appendVideo.js";

describe("appendVideo()", () => {

  it("returns simplified existing videos + new video", () => {
    const entry = {
      videos: [
        {
          title: "Old One",
          video_file: { uid: "111" },
          description: "desc",
        },
      ],
    };

    const newVideo = {
      title: "New One",
      video_file: "222",
    };

    const result = appendVideo(entry, newVideo);

    expect(result).to.deep.equal([
      {
        title: "Old One",
        description: "desc",
        video_file: "111",
      },
      newVideo,
    ]);
  });

  it("handles missing videos array", () => {
    const entry = {};
    const newVideo = { title: "Only Video" };

    const result = appendVideo(entry, newVideo);

    expect(result).to.deep.equal([newVideo]);
  });

  it("does not mutate original entry", () => {
    const entry = {
      videos: [
        { title: "Original", video_file: { uid: "123" } },
      ],
    };

    const copy = JSON.parse(JSON.stringify(entry));

    appendVideo(entry, { title: "New" });

    expect(entry).to.deep.equal(copy);
  });
});
