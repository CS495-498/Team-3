import { expect } from "chai";
import sinon from "sinon";
import { deleteDemoWeb } from "../../../src/app/api/update-demo-web-in-cs/deleteDemoWeb.js";

describe("deleteDemoWeb()", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub();
    });

    it("updates and publishes the entry successfully", async () => {
        // 1st call: update
        fetchStub.onCall(0).resolves({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ entry: { uid: "123", demos: [] } }),
        });

        // 2nd call: publish
        fetchStub.onCall(1).resolves({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ notice: "published" }),
        });

        const result = await deleteDemoWeb("123", [], fetchStub);

        expect(fetchStub.calledTwice).to.be.true;
        expect(result.status).to.equal(200);
        expect(result.entry).to.deep.equal({ uid: "123", demos: [] });
        expect(result.message).to.include("deleted");
    });

    it("returns update error from Contentstack when update fails", async () => {
        // 1st call: update fails
        fetchStub.onCall(0).resolves({
            ok: false,
            status: 400,
            text: async () => "Bad Request",
        });

        const result = await deleteDemoWeb("123", [], fetchStub);

        expect(fetchStub.calledOnce).to.be.true;
        expect(result.status).to.equal(400);
        expect(result.error).to.equal("Bad Request");
    });

    it("returns publish error details when publish fails", async () => {
        // 1st call: update OK
        fetchStub.onCall(0).resolves({
            ok: true,
            status: 200,
            text: async () =>
                JSON.stringify({ entry: { uid: "123", demos: [] } }),
        });

        // 2nd call: publish fails
        fetchStub.onCall(1).resolves({
            ok: false,
            status: 500,
            text: async () => "Publish Error",
        });

        const result = await deleteDemoWeb("123", [], fetchStub);

        expect(fetchStub.calledTwice).to.be.true;
        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Publish failed");
        expect(result.details).to.equal("Publish Error");
    });

    it("should return an error when entryUid is missing", async () => {
        const result = await deleteDemoWeb(null, [], fetchStub);

        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Missing entryUid");
    });

    it("should return an error when entryUid is empty string", async () => {
        const result = await deleteDemoWeb("", [], fetchStub);

        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Missing entryUid");
    });

    it("should return an error when demos is missing", async () => {
        const result = await deleteDemoWeb("123", null, fetchStub);

        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Missing demos array");
    });

    it("should return an error when demos is not an array", async () => {
        const result = await deleteDemoWeb("123", "not-an-array", fetchStub);

        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Missing demos array");
    });

    it("should return an error when demos is undefined", async () => {
        const result = await deleteDemoWeb("123", undefined, fetchStub);

        expect(result.status).to.equal(500);
        expect(result.error).to.equal("Missing demos array");
    });

});
