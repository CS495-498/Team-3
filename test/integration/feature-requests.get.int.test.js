import { expect } from "chai";
import { createCookieClient } from "./helpers/cookieClient.js";
import { config } from "./helpers/config.js";

describe("Integration: GET /api/feature-requests", function () {
    this.timeout(30000);

    const url = `${config.baseUrl}/api/feature-requests`;

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

    it("returns 401 (or redirect) when unauthenticated", async () => {
        const client = createCookieClient();

        const { status } = await client.request(url, {
            method: "GET",
        });

        expect([401, 302, 303, 307]).to.include(status);
    });

    it("returns 200 and an array for authorized partner role", async () => {
        const client = createCookieClient();

        await login(client, config.users.partner);

        const { status, json } = await client.request(url, {
            method: "GET",
        });

        expect(status).to.equal(200);
        expect(json).to.be.an("array");

        if (json.length > 0) {
            const item = json[0];

            expect(item).to.have.property("id");
            expect(item).to.have.property("title");
            expect(item).to.have.property("status");

            // author fields
            expect(item).to.have.property("username");
            expect(item).to.have.property("full_name");

            // voter enrichment
            expect(item).to.have.property("voter_usernames");
            expect(item).to.have.property("voter_full_names");

            // signed file url may be null or string
            expect(item).to.have.property("signed_file_url");
        }
    });

    it("returns 200 for contentstack role if permitted", async () => {
        const client = createCookieClient();

        await login(client, config.users.contentstack);

        const { status, json } = await client.request(url, {
            method: "GET",
        });

        expect(status).to.equal(200);
        expect(json).to.be.an("array");
    });

});