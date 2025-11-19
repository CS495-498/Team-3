import { expect } from "chai";
import sinon from "sinon";

// Import the pure logic (NO Next.js dependencies)
import { uploadAndPublishAsset } from "../../src/app/api/upload-asset-to-cs/uploadAndPublishAsset.js";

describe("uploadAndPublishAsset()", () => {
  let fetchStub;

  beforeEach(() => {
    // Replace fetchFunc with a stub for each test
    fetchStub = sinon.stub();
  });

  // ======================= OK cases =======================
  it("uploads and publishes an asset successfully", async () => {
    // First fetch call: upload
    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({
        asset: { uid: "abc123", title: "Test Asset" },
      }),
    });

    // Second fetch call: publish
    fetchStub.onCall(1).resolves({
      ok: true,
      json: async () => ({ published: true }),
    });

    const result = await uploadAndPublishAsset({ file: "fakefile" }, fetchStub);

    // Assertions
    expect(result.status).to.equal(200);
    expect(result.message).to.equal(
      "Asset uploaded and published successfully."
    );
    expect(result.asset.uid).to.equal("abc123");
    expect(result.publish.published).to.equal(true);
  });

  // ======================= Error cases =======================

  it("returns error if upload fails", async () => {
    // Upload fails
    fetchStub.onCall(0).resolves({
      ok: false,
      status: 400,
      text: async () => "Invalid file",
    });

    const result = await uploadAndPublishAsset({ file: "badfile" }, fetchStub);

    // Assertions
    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Invalid file");
  });

  it("returns error if upload succeeds but no UID returned", async () => {
    // Upload OK but missing asset.uid
    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({}), // No asset.uid
    });

    const result = await uploadAndPublishAsset(
      { file: "fakefile" },
      fetchStub
    );

    // Assertions
    expect(result.status).to.equal(500);
    expect(result.error).to.equal("No asset UID returned from upload.");
  });

  it("returns error if publish fails", async () => {
    // Upload OK
    fetchStub.onCall(0).resolves({
      ok: true,
      json: async () => ({
        asset: { uid: "abc123" },
      }),
    });

    // Publish fails
    fetchStub.onCall(1).resolves({
      ok: false,
      status: 500,
      text: async () => "Publish failed",
    });

    const result = await uploadAndPublishAsset(
      { file: "fakefile" },
      fetchStub
    );

    // Assertions
    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Asset uploaded but publish failed");
    expect(result.details).to.equal("Publish failed");
  });

  it("returns 500 on thrown exception", async () => {
    // Make fetch throw instead of returning
    fetchStub.throws(new Error("Unexpected crash"));

    const result = await uploadAndPublishAsset(
      { file: "fakefile" },
      fetchStub
    );

    // Assertions
    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Unexpected crash");
  });
});


