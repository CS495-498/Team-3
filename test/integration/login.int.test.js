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

    it("POST /api/login redirects to / and sets HttpOnly cookies (middleware-supported)", async () => {
        const client = createCookieClient();

        const loginResp = await client.request(`${config.baseUrl}/api/login`, {
            method: "POST",
            body: { email: config.users.partner, password: config.password },
        });

        console.log("LOGIN status:", loginResp.status);
        console.log("LOGIN location:", loginResp.headers.get("location"));
        console.log("LOGIN set-cookie:", loginResp.headers.get("set-cookie"));

        expect([302, 303, 307, 308]).to.include(loginResp.status);

        const location = loginResp.headers.get("location");
        expect(location).to.exist;

        // cookies may be set on redirect response OR on GET /
        const homeResp = await client.request(`${config.baseUrl}/`, { method: "GET" });

        console.log("HOME status:", homeResp.status);
        console.log("HOME set-cookie:", homeResp.headers.get("set-cookie"));

        const cookies = [...getSetCookie(loginResp.headers), ...getSetCookie(homeResp.headers)];
        expect(cookies.length).to.be.greaterThan(0);
        expect(cookies.join("\n").toLowerCase()).to.include("httponly");
    });
});
