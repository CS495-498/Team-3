import { expect } from "chai";
import { config } from "./helpers/config.js";
import { loginAs } from "./helpers/auth.js";

describe("Integration: demo instructions routes", function () {
    this.timeout(60000);

    const createUrl = `${config.baseUrl}/api/demo-instructions`;
    const deleteUrl = `${config.baseUrl}/api/demo-instructions`;
    const updateUrl = `${config.baseUrl}/api/demo-instructions/update`;

    function buildInstructionTitle() {
        return `Integration Demo Instruction ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function expectSuccessShape(json) {
        expect(json).to.be.an("object");
        expect(json.success).to.equal(true);
    }
    it("contentstack users can create, update, and delete a demo instruction", async () => {
        const client = await loginAs("contentstack");
        const title = buildInstructionTitle();
        const html = "<p>Created by integration test</p>";

        const createRes = await client.request(createUrl, {
            method: "POST",
            body: { title, html },
        });

        expect(createRes.status, createRes.text).to.equal(200);
        expectSuccessShape(createRes.json);
        expect(createRes.json.message).to.equal("Instruction created, published & library updated");
        expect(createRes.json.instruction_uid).to.be.a("string").and.not.empty;
        expect(createRes.json.url).to.match(/^\/demo-instructions\//);

        const instructionUid = createRes.json.instruction_uid;
        const updatedTitle = `${title} Updated`;
        const updatedHtml = "<p>Updated integration content</p>";

        const updateRes = await client.request(updateUrl, {
            method: "POST",
            body: {
                uid: instructionUid,
                title: updatedTitle,
                html: updatedHtml,
            },
        });

        expect(updateRes.status, updateRes.text).to.equal(200);
        expectSuccessShape(updateRes.json);
        expect(updateRes.json.message).to.equal("Entry updated and published successfully");
        expect(updateRes.json.entry).to.be.an("object");
        expect(updateRes.json.entry.uid).to.equal(instructionUid);
        expect(updateRes.json.entry.title).to.equal(updatedTitle);
        expect(updateRes.json.entry.author_name).to.equal("contentstack");
        expect(updateRes.json.entry.blog_content).to.equal(updatedHtml);

        const deleteRes = await client.request(deleteUrl, {
            method: "DELETE",
            body: {
                instructionUid,
            },
        });

        expect(deleteRes.status, deleteRes.text).to.equal(200);
        expect(deleteRes.json).to.deep.equal({
            success: true,
            message: "Instruction deleted successfully",
        });
    });
});
