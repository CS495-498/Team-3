import { expect } from "chai";
import { createCookieClient } from "./cookieClient.js";
import { config } from "./config.js";

const LOGIN_SUCCESS_STATUSES = [200, 204, 302, 303];
const UNAUTHENTICATED_STATUSES = [401, 302, 303, 307];
const FORBIDDEN_RESPONSE = { error: "Forbidden: insufficient permissions" };

export async function loginAs(userKey) {
    const client = createCookieClient();
    const res = await client.request(`${config.baseUrl}/api/auth/login`, {
        method: "POST",
        body: {
            email: config.users[userKey],
            password: config.password,
        },
    });

    expect(LOGIN_SUCCESS_STATUSES).to.include(res.status);
    return client;
}

export async function loginAsMany(userKeys) {
    const entries = await Promise.all(
        userKeys.map(async (userKey) => [userKey, await loginAs(userKey)])
    );

    return Object.fromEntries(entries);
}

export function expectUnauthenticated(status, json) {
    expect(UNAUTHENTICATED_STATUSES).to.include(status);

    if (status === 401) {
        expect(json).to.deep.equal({ error: "Unauthorized" });
    }
}

export function expectForbidden(status, json) {
    expect(status).to.equal(403);
    expect(json).to.deep.equal(FORBIDDEN_RESPONSE);
}

export function expectLoginSucceeded(status) {
    expect(LOGIN_SUCCESS_STATUSES).to.include(status);
}
