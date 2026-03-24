import { expect } from "chai";
import { createCookieClient } from "./helpers/cookieClient.js";
import { config } from "./helpers/config.js";

describe("Integration: GET /api/feature-requests", function () {
    this.timeout(30000);

    const url = `${config.baseUrl}/api/feature-requests`;
    const fastUrl = `${url}?limit=1&sort=newest`;
    const authenticatedClients = {};
    const cases = [
        ["partner", config.users.partner],
        ["contentstack", config.users.contentstack],
        // ["admin", config.users.admin], // if you have it
    ];

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

    before(async function () {
        this.timeout(60000);

        for (const [label, email] of cases) {
            const client = createCookieClient();
            await login(client, email);
            authenticatedClients[label] = client;
        }
    });

    it("returns 401 (or redirect) when unauthenticated", async () => {
        const client = createCookieClient();

        const { status } = await client.request(fastUrl, {
            method: "GET",
        });

        expect([401, 302, 303, 307]).to.include(status);
    });

    for (const [label] of cases) {
        it(`${label} can GET /api/feature-requests (200 + array)`, async () => {
            const client = authenticatedClients[label];

            const { status, json } = await client.request(fastUrl, { method: "GET" });

            expect(status).to.equal(200);
            expect(json).to.be.an("object");
            expect(json).to.have.property("featureRequests");
            expect(json.featureRequests).to.be.an("array");
        });
    }

});
