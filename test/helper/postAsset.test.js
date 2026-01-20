import { expect } from "chai";
import sinon from "sinon";
import postAsset from "../../src/app/api/helper/postAsset.js";

describe("postAsset()", () => {
  let fetchStub;
    let consoleStub;

    beforeEach(() => {
    consoleStub = sinon.stub(console, "error"); // suppress console.error
    fetchStub = sinon.stub(global, "fetch");
    });

    afterEach(() => {
    sinon.restore();
    });


  it("POSTs the asset and returns JSON response", async () => {
    const mockResponse = {
      ok: true,
      json: async () => ({ asset: { uid: "asset123" } }),
    };

    fetchStub.resolves(mockResponse);

    const file = new Blob(["hello"], { type: "text/plain" });

    const result = await postAsset(file, "Test Title", "Desc", "parent1", ["tag1"]);

    expect(fetchStub.calledOnce).to.be.true;

    const call = fetchStub.firstCall;

    expect(call.args[0]).to.equal("/api/upload-asset-to-cs");

    const options = call.args[1];
    expect(options.method).to.equal("POST");
    expect(options.body).to.be.instanceOf(FormData);

    expect(result).to.deep.equal({ asset: { uid: "asset123" } });
  });

  it("returns null if fetch throws", async () => {
    fetchStub.rejects(new Error("Network error"));

    const file = new Blob(["x"]);

    const result = await postAsset(file);

    expect(result).to.equal(null);
  });

  it("returns null if response is not ok", async () => {
    fetchStub.resolves({
      ok: false,
      status: 400,
      json: async () => ({ error: "bad" }),
    });

    const result = await postAsset(new Blob(["x"]));

    expect(result).to.equal(null);
  });
});
