import { expect } from "chai";
import sinon from "sinon";
import { getVimeoThumbnail } from "../../src/app/api/helper/videoThumbnailUtils.js";

describe("getVimeoThumbnail()", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub(global, 'fetch');
    });

    afterEach(() => {
        fetchStub.restore();
    });

    it("extracts thumbnail URL from valid Vimeo URL", async () => {
        const url = "https://vimeo.com/123456789";
        const mockThumbnailUrl = "https://i.vimeocdn.com/video/123456789.jpg";

        fetchStub.resolves({
            ok: true,
            json: async () => ({ thumbnail_url: mockThumbnailUrl })
        });

        const result = await getVimeoThumbnail(url);

        expect(result).to.equal(mockThumbnailUrl);
        expect(fetchStub.calledOnce).to.be.true;
    });

    it("returns null for non-Vimeo URLs", async () => {
        const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
        const result = await getVimeoThumbnail(url);

        expect(result).to.be.null;
        expect(fetchStub.called).to.be.false;
    });

    it("returns null when API request fails", async () => {
        const url = "https://vimeo.com/123456789";

        fetchStub.resolves({
            ok: false,
            status: 404
        });

        const result = await getVimeoThumbnail(url);

        expect(result).to.be.null;
    });

    it("returns null when API returns no thumbnail_url", async () => {
        const url = "https://vimeo.com/123456789";

        fetchStub.resolves({
            ok: true,
            json: async () => ({ title: "Video Title" })
        });

        const result = await getVimeoThumbnail(url);

        expect(result).to.be.null;
    });

    it("returns null when fetch throws an error", async () => {
        const url = "https://vimeo.com/123456789";

        fetchStub.rejects(new Error("Network error"));

        const result = await getVimeoThumbnail(url);

        expect(result).to.be.null;
    });

    it("handles Vimeo URLs with additional path segments", async () => {
        const url = "https://vimeo.com/987654321";
        const mockThumbnailUrl = "https://i.vimeocdn.com/video/987654321.jpg";

        fetchStub.resolves({
            ok: true,
            json: async () => ({ thumbnail_url: mockThumbnailUrl })
        });

        const result = await getVimeoThumbnail(url);

        expect(result).to.equal(mockThumbnailUrl);
    });

    it("returns null for empty string", async () => {
        const url = "";
        const result = await getVimeoThumbnail(url);

        expect(result).to.be.null;
        expect(fetchStub.called).to.be.false;
    });
});