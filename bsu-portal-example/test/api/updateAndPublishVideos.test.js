import { expect } from "chai";
import sinon from "sinon";
import { updateAndPublishVideos } from "../../src/app/api/update-video-library-in-cs/updateAndPublishVideos.js";

describe("updateAndPublishVideos()", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub();
  });

  it("updates and publishes videos successfully", async () => {
    const mockUpdateResponse = {
      ok: true,
      text: async () => JSON.stringify({
        entry: { videos: [{ title: "Video 1" }] }
      })
    };

    const mockPublishResponse = {
      ok: true,
      text: async () => "Published"
    };

    fetchStub.onCall(0).resolves(mockUpdateResponse);
    fetchStub.onCall(1).resolves(mockPublishResponse);

    const result = await updateAndPublishVideos("entry123", ["v1"], fetchStub);

    expect(result.status).to.equal(200);
    expect(result.entry).to.deep.equal({ videos: [{ title: "Video 1" }] });
    expect(fetchStub.calledTwice).to.be.true;
  });

  it("returns error when update fails", async () => {
    const mockUpdateResponse = {
      ok: false,
      status: 400,
      text: async () => "Bad update"
    };

    fetchStub.resolves(mockUpdateResponse);

    const result = await updateAndPublishVideos("entry123", ["v1"], fetchStub);

    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Bad update");
  });

  it("returns error when publish fails", async () => {
    const mockUpdateResponse = {
      ok: true,
      text: async () => JSON.stringify({ entry: { foo: "bar" } })
    };

    const mockPublishResponse = {
      ok: false,
      status: 500,
      text: async () => "Publish error"
    };

    fetchStub.onCall(0).resolves(mockUpdateResponse);
    fetchStub.onCall(1).resolves(mockPublishResponse);

    const result = await updateAndPublishVideos("entry123", ["v1"], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Publish failed");
    expect(result.details).to.equal("Publish error");
  });

  it("returns 500 on thrown exception", async () => {
    fetchStub.rejects(new Error("Unexpected crash"));

    const result = await updateAndPublishVideos("entry123", ["v1"], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Unexpected crash");
  });
});
