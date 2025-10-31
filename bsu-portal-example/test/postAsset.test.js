import { expect } from "chai";
import sinon from "sinon";
import postAsset from "../src/api/postAsset.js";

describe("postAsset()", () => {
    let fetchStub;

    beforeEach(() => {
        // Mock global fetch
        global.fetch = () => {};
        fetchStub = sinon.stub(global, "fetch");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("should POST asset data and return JSON response", async () => {
        // Arrange
        const mockResponse = {
            ok: true,
            json: async () => ({ asset: { uid: "asset123", title: "Test Title" } }),
        };
        fetchStub.resolves(mockResponse);

        // Act
        const file = new Blob(["dummy content"], { type: "text/plain" });
        const result = await postAsset(file, "Test Title", "Desc", "parent1", "tag1");

        // Assert
        expect(fetchStub.calledOnce).to.be.true;
        expect(fetchStub.firstCall.args[0]).to.equal("https://api.contentstack.io/v3/assets");
        expect(result).to.have.property("asset");
        expect(result.asset.title).to.equal("Test Title");
    });

    it("should return null on fetch failure", async () => {
        fetchStub.rejects(new Error("Network error"));

        const file = new Blob(["data"], { type: "text/plain" });
        const result = await postAsset(file, "Bad Upload");

        expect(result).to.equal(null);
    });
});
