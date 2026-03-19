import { expect } from "chai";
import { createCookieClient } from "./helpers/cookieClient.js";
import { config } from "./helpers/config.js";
import { getDemoWebsiteEntry } from "../../src/app/(with-sidebar)/demo-websites/getDemoWebsiteEntry.js";
import normalizeDemoWebArray from "../../src/app/api/helper/normalizeDemoWebArray.js";

describe("Integration: /api/update-demo-web-in-cs", function () {
    this.timeout(30000);

    const url = `${config.baseUrl}/api/update-demo-web-in-cs`;
    const pageUrl = `${config.baseUrl}/demo-websites`;

    async function login(client, email) {
        const res = await client.request(`${config.baseUrl}/api/auth/login`, {
            method: "POST",
            body: { email, password: config.password },
        });

        expect([200, 204, 302, 303]).to.include(res.status);
    }

    it("returns 401 when unauthenticated for PUT", async () => {
        const client = createCookieClient();
        const res = await client.request(url, { method: "PUT", body: { entryUid: "x", demos: [] } });
        expect([401, 302, 303, 307]).to.include(res.status);
    });

    it("returns 401 when unauthenticated for DELETE", async () => {
        const client = createCookieClient();
        const res = await client.request(url, { method: "DELETE", body: { entryUid: "x", demos: [] } });
        expect([401, 302, 303, 307]).to.include(res.status);
    });

    it("partner and contentstack users can GET demo-websites page", async () => {
        for (const email of [config.users.partner, config.users.contentstack]) {
            const client = createCookieClient();
            await login(client, email);

            const { status, text } = await client.request(pageUrl, { method: "GET" });

            expect(status).to.equal(200);
            expect(text).to.be.a("string");
            expect(text.toLowerCase()).to.include("demo");
        }
    });

    it("partner user gets 403 for PUT due to insufficient permissions", async () => {
        const client = createCookieClient();
        await login(client, config.users.partner);

        const { status, json } = await client.request(url, {
            method: "PUT",
            body: { entryUid: "x", demos: [] },
        });

        expect(status).to.equal(403);
        expect(json).to.be.an("object");
        expect(json).to.have.property("error").that.includes("Forbidden");
    });

    it("contentstack user can PUT demo websites with a valid existing payload", async () => {
        const client = createCookieClient();
        await login(client, config.users.contentstack);

        const entry = await getDemoWebsiteEntry();
        const demos = normalizeDemoWebArray(entry.demos || []);

        const { status, json } = await client.request(url, {
            method: "PUT",
            body: {
                entryUid: entry.uid,
                demos,
            },
        });

        expect(status).to.equal(200);
        expect(json).to.be.an("object");
        expect(json).to.have.property("entry");
        expect(json.entry).to.have.property("uid", entry.uid);
        expect(json.entry).to.have.property("demos").that.is.an("array");
    });

    it("partner user gets 403 for DELETE due to insufficient permissions", async () => {
        const client = createCookieClient();
        await login(client, config.users.partner);

        const { status, json } = await client.request(url, {
            method: "DELETE",
            body: { entryUid: "x", demos: [] },
        });

        expect(status).to.equal(403);
        expect(json).to.be.an("object");
        expect(json).to.have.property("error").that.includes("Forbidden");
    });

    it("contentstack user receives 500 for DELETE missing entryUid in payload", async () => {
        const client = createCookieClient();
        await login(client, config.users.contentstack);

        const { status, json } = await client.request(url, {
            method: "DELETE",
            body: {},
        });

        expect(status).to.equal(500);
        expect(json).to.be.an("object");
        expect(json).to.have.property("error").that.includes("Missing entryUid");
    });

    it("contentstack user receives 500 for DELETE missing demos array in payload", async () => {
        const client = createCookieClient();
        await login(client, config.users.contentstack);

        const { status, json } = await client.request(url, {
            method: "DELETE",
            body: { entryUid: "x" },
        });

        expect(status).to.equal(500);
        expect(json).to.be.an("object");
        expect(json).to.have.property("error").that.includes("Missing demos array");
    });

    it("contentstack user receives 422 for PUT with invalid payload", async () => {
        const client = createCookieClient();
        await login(client, config.users.contentstack);

        const { status, json } = await client.request(url, {
            method: "PUT",
            body: {},
        });

        expect(status).to.equal(422);
        expect(json).to.be.an("object");
        expect(json).to.have.property("error");
        expect(json.error).to.satisfy((err) =>
            err.includes("Cannot read") ||
            err.includes("invalid") ||
            err.includes("entryUid")
        );
    });
});
