import { expect } from "chai";
import { config } from "./helpers/config.js";
import { loginAs } from "./helpers/auth.js";

describe("Integration: /api/update-demo-web-in-cs", function () {
    this.timeout(30000);

    const pageUrl = `${config.baseUrl}/demo-websites`;

    it("partner and contentstack users can GET demo-websites page", async () => {
        for (const userKey of ["partner", "contentstack"]) {
            const client = await loginAs(userKey);

            const { status, text } = await client.request(pageUrl, { method: "GET" });

            expect(status).to.equal(200);
            expect(text).to.be.a("string");
            expect(text.toLowerCase()).to.include("demo");
        }
    });
});
