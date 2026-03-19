import { expect } from "chai";
import sinon from "sinon";
import { updateAndPublishBulletinBoard } from "../../../src/app/api/update-bulletin-board/updateAndPublishBulletinBoard.js";

describe("updateAndPublishBulletinBoard()", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  // ===================== SUCCESS =====================
  it("updates and publishes the bulletin board successfully", async () => {
    const mockEntry = { uid: "entry123", bulletin_board: "<p>Hello world</p>" };

    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: mockEntry }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      text: async () => JSON.stringify({ published: true }),
    });

    const result = await updateAndPublishBulletinBoard(
      "entry123",
      "<p>Hello world</p>",
      fetchStub
    );

    expect(result.status).to.equal(200);
    expect(result.message).to.equal(
      "Bulletin board updated and published successfully."
    );
    expect(result.entry.uid).to.equal("entry123");
    expect(result.entry.bulletin_board).to.equal("<p>Hello world</p>");
    expect(fetchStub.calledTwice).to.be.true;
  });

  it("sends the correct bulletin_board content in the update request body", async () => {
    const content = "<p>Sanitized content</p>";

    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: { uid: "entry123", bulletin_board: content } }),
    });

    fetchStub.onCall(1).resolves({
      ok: true,
      text: async () => JSON.stringify({ published: true }),
    });

    await updateAndPublishBulletinBoard("entry123", content, fetchStub);

    const updateCall = fetchStub.getCall(0);
    const body = JSON.parse(updateCall.args[1].body);
    expect(body.entry.bulletin_board).to.equal(content);
  });

  it("targets the correct content type and entry UID in both requests", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: { uid: "abc" } }),
    });
    fetchStub.onCall(1).resolves({
      ok: true,
      text: async () => JSON.stringify({ published: true }),
    });

    await updateAndPublishBulletinBoard("abc", "<p>test</p>", fetchStub);

    expect(fetchStub.getCall(0).args[0]).to.include(
      "content_types/homepage/entries/abc"
    );
    expect(fetchStub.getCall(1).args[0]).to.include(
      "content_types/homepage/entries/abc/publish"
    );
  });

  // ===================== UPDATE FAIL =====================
  it("returns error when the update request fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: false,
      status: 400,
      text: async () => "Bad request payload",
    });

    const result = await updateAndPublishBulletinBoard(
      "entry123",
      "<p>test</p>",
      fetchStub
    );

    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Bad request payload");
    expect(fetchStub.calledOnce).to.be.true;
  });

  it("returns error with the upstream status when the update returns 422", async () => {
    fetchStub.onCall(0).resolves({
      ok: false,
      status: 422,
      text: async () => "Unprocessable entity",
    });

    const result = await updateAndPublishBulletinBoard(
      "entry123",
      "<p>test</p>",
      fetchStub
    );

    expect(result.status).to.equal(422);
    expect(result.error).to.equal("Unprocessable entity");
  });

  // ===================== PUBLISH FAIL =====================
  it("returns error when the publish request fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: { uid: "entry123" } }),
    });

    fetchStub.onCall(1).resolves({
      ok: false,
      status: 500,
      text: async () => "Internal publish error",
    });

    const result = await updateAndPublishBulletinBoard(
      "entry123",
      "<p>test</p>",
      fetchStub
    );

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Publish failed");
    expect(result.details).to.equal("Internal publish error");
    expect(fetchStub.calledTwice).to.be.true;
  });

  // ===================== THROWN EXCEPTION =====================
  it("returns 500 when fetch throws an unexpected error", async () => {
    fetchStub.throws(new Error("Network failure"));

    const result = await updateAndPublishBulletinBoard(
      "entry123",
      "<p>test</p>",
      fetchStub
    );

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Network failure");
  });
});
