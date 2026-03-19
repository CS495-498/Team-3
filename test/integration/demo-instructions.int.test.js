import { expect } from "chai";
import { createCookieClient } from "./helpers/cookieClient.js";
import { config } from "./helpers/config.js";

describe("Integration: demo instructions routes", function () {
    this.timeout(30000);

    const createUrl = `${config.baseUrl}/api/demo-instructions`;
    const deleteUrl = `${config.baseUrl}/api/demo-instructions`;
    const updateUrl = `${config.baseUrl}/api/demo-instructions/update`;
    let createdInstruction = null;

    async function login(client, email) {
        const res = await client.request(`${config.baseUrl}/api/auth/login`, {
            method: "POST",
            body: {
                email,
                password: config.password,
            },
        });

        expect([200, 204, 302, 303]).to.include(res.status);
    }

    function buildInstructionTitle() {
        return `Integration Demo Instruction ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    }

    function expectSuccessShape(json) {
        expect(json).to.be.an("object");
        expect(json.success).to.equal(true);
    }

    function expectUnauthenticated(status, json) {
        expect([401, 302, 303, 307]).to.include(status);

        if (status === 401) {
            expect(json).to.deep.equal({ error: "Unauthorized" });
        }
    }

    after(async () => {
        if (!createdInstruction?.uid) {
            return;
        }

        const client = createCookieClient();
        await login(client, config.users.contentstack);

        const { status, json, text } = await client.request(deleteUrl, {
            method: "DELETE",
            body: { instructionUid: createdInstruction.uid },
        });

        expect(status, text).to.equal(200);
        expect(json).to.deep.equal({
            success: true,
            message: "Instruction deleted successfully",
        });

        createdInstruction = null;
    });
    describe("POST /api/demo-instructions", function () {
        it("returns 401 when unauthenticated", async () => {
            const client = createCookieClient();

            const { status, json } = await client.request(createUrl, {
                method: "POST",
                body: {
                    title: buildInstructionTitle(),
                    html: "<p>Integration test content</p>",
                },
            });

            expectUnauthenticated(status, json);
        });

        it("returns 403 for partner users without publish permission", async () => {
            const client = createCookieClient();
            await login(client, config.users.partner);

            const { status, json } = await client.request(createUrl, {
                method: "POST",
                body: {
                    title: buildInstructionTitle(),
                    html: "<p>Integration test content</p>",
                },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("allows contentstack users to create and publish a demo instruction", async () => {
            const client = createCookieClient();
            await login(client, config.users.contentstack);

            const title = buildInstructionTitle();
            const html = "<p>Created by integration test</p>";

            const { status, json } = await client.request(createUrl, {
                method: "POST",
                body: { title, html },
            });

            expect(status).to.equal(200);
            expectSuccessShape(json);
            expect(json.message).to.equal("Instruction created, published & library updated");
            expect(json.instruction_uid).to.be.a("string").and.not.empty;
            expect(json.url).to.be.a("string");
            expect(json.url).to.match(/^\/demo-instructions\//);

            createdInstruction = {
                uid: json.instruction_uid,
                title,
                html,
                url: json.url,
            };
        });
    });

    describe("POST /api/demo-instructions/update", function () {
        it("returns 401 when unauthenticated", async () => {
            const client = createCookieClient();

            const { status, json } = await client.request(updateUrl, {
                method: "POST",
                body: {
                    uid: "demo-uid",
                    title: "Updated title",
                    html: "<p>Updated content</p>",
                    author: "Integration Test",
                },
            });

            expectUnauthenticated(status, json);
        });

        it("returns 403 for partner users without publish permission", async () => {
            const client = createCookieClient();
            await login(client, config.users.partner);

            const { status, json } = await client.request(updateUrl, {
                method: "POST",
                body: {
                    uid: "demo-uid",
                    title: "Updated title",
                    html: "<p>Updated content</p>",
                    author: "Integration Test",
                },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("allows contentstack users to update and publish an existing demo instruction", async () => {
            const client = createCookieClient();
            await login(client, config.users.contentstack);

            expect(createdInstruction, "Expected create test to store an instruction for update").to.exist;

            const updatedTitle = `${createdInstruction.title} Updated`;
            const updatedHtml = "<p>Updated integration content</p>";
            const updatedAuthor = "Integration Test Author";

            const { status, json } = await client.request(updateUrl, {
                method: "POST",
                body: {
                    uid: createdInstruction.uid,
                    title: updatedTitle,
                    html: updatedHtml,
                    author: updatedAuthor,
                },
            });

            expect(status).to.equal(200);
            expectSuccessShape(json);
            expect(json.message).to.equal("Entry updated and published successfully");
            expect(json.entry).to.be.an("object");
            expect(json.entry.uid).to.equal(createdInstruction.uid);
            expect(json.entry.title).to.equal(updatedTitle);
            expect(json.entry.author_name).to.equal(updatedAuthor);
            expect(json.entry.blog_content).to.equal(updatedHtml);

            createdInstruction = {
                ...createdInstruction,
                title: updatedTitle,
                html: updatedHtml,
            };
        });
    });

    describe("DELETE /api/demo-instructions", function () {
        it("returns 401 when unauthenticated", async () => {
            const client = createCookieClient();

            const { status, json } = await client.request(deleteUrl, {
                method: "DELETE",
                body: {
                    instructionUid: "demo-uid",
                },
            });

            expectUnauthenticated(status, json);
        });

        it("returns 403 for partner users without publish permission", async () => {
            const client = createCookieClient();
            await login(client, config.users.partner);

            const { status, json } = await client.request(deleteUrl, {
                method: "DELETE",
                body: {
                    instructionUid: "demo-uid",
                },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("allows contentstack users to delete the demo instruction created by this suite", async () => {
            const client = createCookieClient();
            await login(client, config.users.contentstack);

            expect(createdInstruction, "Expected an existing created instruction to delete").to.exist;

            const { status, json, text } = await client.request(deleteUrl, {
                method: "DELETE",
                body: {
                    instructionUid: createdInstruction.uid,
                },
            });

            expect(status, text).to.equal(200);
            expect(json).to.deep.equal({
                success: true,
                message: "Instruction deleted successfully",
            });

            createdInstruction = null;
        });
    });
});
