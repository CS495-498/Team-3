import { expect } from "chai";
import sinon from "sinon";
import { deleteAssets } from "../../src/app/api/delete-assets-from-cs/deleteAssets.js";

describe("deleteAssets()", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub();
  });

  it("deletes all unique asset uids successfully", async () => {
    fetchStub.resolves({
      ok: true,
      status: 204,
      text: async () => "",
    });

    const result = await deleteAssets(["asset-1", "asset-2", "asset-1"], fetchStub);

    expect(fetchStub.callCount).to.equal(2);
    expect(result.status).to.equal(200);
    expect(result.deletedAssetUids).to.deep.equal(["asset-1", "asset-2"]);
  });

  it("returns early when there are no assets to delete", async () => {
    const result = await deleteAssets([null, undefined, ""], fetchStub);

    expect(fetchStub.notCalled).to.be.true;
    expect(result.status).to.equal(204);
    expect(result.deletedAssetUids).to.deep.equal([]);
  });

  it("returns an error when asset deletion fails", async () => {
    fetchStub.resolves({
      ok: false,
      status: 400,
      text: async () => "Cannot delete asset",
    });

    const result = await deleteAssets(["asset-1"], fetchStub);

    expect(fetchStub.calledOnce).to.be.true;
    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Failed to delete asset asset-1");
    expect(result.details).to.equal("Cannot delete asset");
  });

  it("returns an error when assetUids is not an array", async () => {
    const result = await deleteAssets(null, fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Missing assetUids array");
  });
});
