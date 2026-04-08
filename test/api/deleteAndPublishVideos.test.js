import { expect } from "chai";
import sinon from "sinon";
import { deleteAndPublishVideos } from "../../src/app/api/update-video-library-in-cs/deleteAndPublishVideos.js";

describe("deleteAndPublishVideos()", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub();
  });

  it("updates and publishes the video library successfully", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ entry: { uid: "entry123", videos: [] } }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      status: 200,
      text: async () => "Published",
    });

    const result = await deleteAndPublishVideos("entry123", [], fetchStub);

    expect(fetchStub.calledTwice).to.be.true;
    expect(result.status).to.equal(200);
    expect(result.entry).to.deep.equal({ uid: "entry123", videos: [] });
    expect(result.message).to.include("deleted");
  });

  it("normalizes nested asset references before updating the entry", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ entry: { uid: "entry123", videos: [] } }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      status: 200,
      text: async () => "Published",
    });

    await deleteAndPublishVideos(
      "entry123",
      [
        {
          video_file: { uid: "video-asset-1", url: "https://example.com/video.mp4" },
          thumbnail: { uid: "thumb-asset-1", url: "https://example.com/thumb.png" },
          title: "Video 1",
          description: "Desc",
          se_name: "video-1",
          date_posted: "2026-03-31",
        },
      ],
      fetchStub
    );

    const [, updateOptions] = fetchStub.firstCall.args;
    expect(JSON.parse(updateOptions.body)).to.deep.equal({
      entry: {
        videos: [
          {
            video_file: "video-asset-1",
            thumbnail: "thumb-asset-1",
            title: "Video 1",
            description: "Desc",
            se_name: "video-1",
            date_posted: "2026-03-31",
          },
        ],
      },
    });
  });

  it("returns update error details when the entry update fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    });

    const result = await deleteAndPublishVideos("entry123", [], fetchStub);

    expect(fetchStub.calledOnce).to.be.true;
    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Bad Request");
  });

  it("returns publish error details when the publish step fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ entry: { uid: "entry123", videos: [] } }),
    });

    fetchStub.onCall(1).resolves({
      ok: false,
      status: 500,
      text: async () => "Publish Error",
    });

    const result = await deleteAndPublishVideos("entry123", [], fetchStub);

    expect(fetchStub.calledTwice).to.be.true;
    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Publish failed");
    expect(result.details).to.equal("Publish Error");
  });

  it("returns an error when entryUid is missing", async () => {
    const result = await deleteAndPublishVideos("", [], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Missing entryUid");
  });

  it("returns an error when videos is not an array", async () => {
    const result = await deleteAndPublishVideos("entry123", null, fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Missing videos array");
  });
});
