import { expect } from "chai";
import sinon from "sinon";
import { downloadImageAsFile } from "../../src/app/api/helper/videoThumbnailUtils.js";

describe("downloadImageAsFile()", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(global, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it("downloads image and creates File object with default filename", async () => {
        const imageUrl = "https://example.com/image.jpg";
        const mockBlob = new Blob(["mock image data"], { type: "image/jpeg" });

        fetchStub.resolves({
            ok: true,
            blob: async () => mockBlob
        });

        const result = await downloadImageAsFile(imageUrl);

        expect(result).to.be.instanceOf(File);
        expect(result.name).to.equal("thumbnail.jpg");
        expect(result.type).to.equal("image/jpeg");
        expect(fetchStub.calledWith(imageUrl)).to.be.true;
    });

    it("downloads image and creates File object with custom filename", async () => {
        const imageUrl = "https://example.com/image.png";
        const customFilename = "custom-thumbnail.png";
        const mockBlob = new Blob(["mock image data"], { type: "image/png" });

        fetchStub.resolves({
            ok: true,
            blob: async () => mockBlob
        });

        const result = await downloadImageAsFile(imageUrl, customFilename);

        expect(result).to.be.instanceOf(File);
        expect(result.name).to.equal(customFilename);
        expect(result.type).to.equal("image/png");
    });

    it("uses default type when blob has no type", async () => {
        const imageUrl = "https://example.com/image";
        const mockBlob = new Blob(["mock image data"], { type: "" });

        fetchStub.resolves({
            ok: true,
            blob: async () => mockBlob
        });

        const result = await downloadImageAsFile(imageUrl);

        expect(result.type).to.equal("image/jpeg");
    });

    it("throws error when fetch fails", async () => {
        const imageUrl = "https://example.com/nonexistent.jpg";

        fetchStub.resolves({
            ok: false,
            status: 404
        });

        try {
            await downloadImageAsFile(imageUrl);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.equal("Failed to fetch image");
        }
    });

    it("throws error when network request fails", async () => {
        const imageUrl = "https://example.com/image.jpg";

        fetchStub.rejects(new Error("Network error"));

        try {
            await downloadImageAsFile(imageUrl);
            expect.fail("Should have thrown an error");
        } catch (error) {
            expect(error.message).to.equal("Network error");
        }
    });

    it("handles different image types correctly", async () => {
        const imageUrl = "https://example.com/image.webp";
        const mockBlob = new Blob(["mock image data"], { type: "image/webp" });

        fetchStub.resolves({
            ok: true,
            blob: async () => mockBlob
        });

        const result = await downloadImageAsFile(imageUrl, "test.webp");

        expect(result.type).to.equal("image/webp");
        expect(result.name).to.equal("test.webp");
    });
});