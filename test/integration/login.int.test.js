import { expect } from "chai";
import { config } from "./helpers/config.js";
import { createCookieClient } from "./helpers/cookieClient.js";

const getSetCookie = (headers) => {
    if (typeof headers.getSetCookie === "function") return headers.getSetCookie();
    const v = headers.get("set-cookie");
    return v ? [v] : [];
};

describe("Integration: login -> redirect -> home", function () {
    this.timeout(30000);

    it("POST /api/auth/login returns 200 and sets HttpOnly cookie", async () => {
        const client = createCookieClient();

        const loginResp = await client.request(`${config.baseUrl}/api/auth/login`, {
            method: "POST",
            body: { email: config.users.partner, password: config.password },
        });

        expect(loginResp.status).to.equal(200);

        const setCookie =
            (typeof loginResp.headers.getSetCookie === "function"
                ? loginResp.headers.getSetCookie()?.join("\n")
                : loginResp.headers.get("set-cookie"));

        expect(setCookie, "Expected Set-Cookie header").to.exist;
        expect(setCookie.toLowerCase()).to.include("httponly");
    });

    it("POST /api/auth/login returns 401 for invalid credentials", async () => {
        const client = createCookieClient();

        const loginResp = await client.request(`${config.baseUrl}/api/auth/login`, {
            method: "POST",
            body: { email: config.users.partner, password: "wrong-password" },
        });

        expect(loginResp.status).to.equal(401);

        const raw = (typeof loginResp.headers.getSetCookie === "function"
            ? loginResp.headers.getSetCookie()?.join("\n")
            : loginResp.headers.get("set-cookie")) ?? "";

        // Allow header to exist, but it must be empty/whitespace (no cookie actually set)
        expect(raw.trim(), "Did not expect Set-Cookie value on failed auth").to.equal("");
    });
});
