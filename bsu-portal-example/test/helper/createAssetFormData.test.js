import { expect } from "chai";
import sinon from "sinon";
import createAssetFormData from "../../src/app/api/helper/postAsset.js";

describe("createAssetFormData()", () => {
  let fetchStub;

  beforeEach(() => {
    global.fetch = () => {};
  });

  afterEach(() => {
    sinon.restore();
  });

  let consoleErrorStub;

  // Stub console.error to avoid cluttering test output
  beforeEach(() => {
    consoleErrorStub = sinon.stub(console, "error");
  });

  afterEach(() => {
    consoleErrorStub.restore();
  });


  it("builds FormData and sends POST request", async () => {
    const mockResponse = { success: true };

    fetchStub = sinon.stub(global, "fetch").resolves({
      ok: true,
      json: async () => mockResponse
    });

    const file = new Blob(["abc"], { type: "video/mp4" });

    const result = await createAssetFormData(
      file,
      "Title",
      "Desc",
      "parent123",
      "tag1,tag2"
    );

    // ===== asserts =====
    expect(fetchStub.calledOnce).to.be.true;

    const [url, options] = fetchStub.firstCall.args;
    expect(url).to.equal("/api/upload-asset-to-cs");
    expect(options.method).to.equal("POST");
    expect(options.body).to.be.instanceOf(FormData);

    const body = options.body;

    // Blob → File case: compare type/size only
    const uploaded = body.get("asset[upload]");
    expect(uploaded.type).to.equal(file.type);
    expect(uploaded.size).to.equal(file.size);

    expect(body.get("asset[title]")).to.equal("Title");
    expect(body.get("asset[description]")).to.equal("Desc");
    expect(body.get("asset[parent_uid]")).to.equal("parent123");
    expect(body.get("asset[tags]")).to.equal("tag1,tag2");

    expect(result).to.deep.equal(mockResponse);
  });

  // ===== Error cases =====
  it("returns null if response.ok is false", async () => {
    fetchStub = sinon.stub(global, "fetch").resolves({
      ok: false,
      status: 500
    });

    const file = new Blob(["abc"]);

    const result = await createAssetFormData(file);
    expect(result).to.equal(null);
  });

  it("returns null if fetch throws", async () => {
    fetchStub = sinon.stub(global, "fetch").throws(new Error("fail"));

    const file = new Blob(["abc"]);
    const result = await createAssetFormData(file);
    expect(result).to.equal(null);
  });
});
