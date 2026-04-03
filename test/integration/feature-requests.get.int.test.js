import { expect } from "chai";
import { config } from "./helpers/config.js";
import {
    expectUnauthenticated,
    loginAs,
} from "./helpers/auth.js";
import { createCookieClient } from "./helpers/cookieClient.js";

describe("Integration: GET /api/feature-requests", function () {
    this.timeout(30000);

    const routeUrl = `${config.baseUrl}/api/feature-requests`;
    const fastUrl = `${routeUrl}?limit=1&sort=newest`;

    function expectFeatureRequestListResponse(json) {
        expect(json).to.be.an("object");
        expect(json).to.have.property("featureRequests").that.is.an("array");
        expect(json).to.have.property("total").that.is.a("number");
        expect(json).to.have.property("page", 1);
        expect(json).to.have.property("limit", 1);
        expect(json).to.have.property("hasMore").that.is.a("boolean");

        if (json.featureRequests.length > 0) {
            const request = json.featureRequests[0];
            expect(request).to.be.an("object");
            expect(request).to.have.property("id");
            expect(request).to.have.property("title");
            expect(request).to.have.property("number_of_votes").that.is.a("number");
            expect(request).to.have.property("commentCount").that.is.a("number");
        }
    }

    it("returns 401 (or redirect) when unauthenticated", async () => {
        const client = createCookieClient();
        const { status, json } = await client.request(fastUrl, { method: "GET" });
        expectUnauthenticated(status, json);
    });

    it("partner users can GET /api/feature-requests with pagination metadata", async () => {
        const client = await loginAs("partner");

        const { status, json } = await client.request(fastUrl, { method: "GET" });

        expect(status).to.equal(200);
        expectFeatureRequestListResponse(json);
    });
});
