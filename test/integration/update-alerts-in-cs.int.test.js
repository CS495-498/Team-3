import { expect } from "chai";
import { createCookieClient } from "./helpers/cookieClient.js";
import { config } from "./helpers/config.js";

describe("Integration: update-alerts-in-cs routes", function () {
    this.timeout(30000);

    const updateUrl = `${config.baseUrl}/api/update-alerts-in-cs`;
    const deleteUrl = `${config.baseUrl}/api/update-alerts-in-cs/delete`;

    // The homepage entry UID from ContentStack (required for success tests)
    const homepageEntryUid = process.env.TEST_HOMEPAGE_ENTRY_UID;

    let adminClient = null;
    let originalAlerts = null;

    // Test alert inserted during the success test so we can clean it up
    const testAlert = {
        alert_title: `Integration Test Alert ${Date.now()}`,
        alert_description: "This alert was created by an automated integration test.",
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        critical_value: 1,
    };

    async function login(client, email) {
        const res = await client.request(`${config.baseUrl}/api/auth/login`, {
            method: "POST",
            body: { email, password: config.password },
        });
        expect([200, 204, 302, 303]).to.include(res.status);
    }

    function expectUnauthenticated(status, json) {
        expect([401, 302, 303, 307]).to.include(status);
        if (status === 401) {
            expect(json).to.deep.equal({ error: "Unauthorized" });
        }
    }

    before(async function () {
        this.timeout(60000);

        // Log in as admin for success tests
        if (homepageEntryUid) {
            adminClient = createCookieClient();
            await login(adminClient, config.users.admin);

            // Fetch current alerts from ContentStack so we can restore them in after()
            const res = await fetch(
                `https://cdn.contentstack.io/v3/content_types/homepage/entries/${homepageEntryUid}`,
                {
                    headers: {
                        api_key: process.env.CONTENTSTACK_API_KEY,
                        authorization: process.env.CONTENTSTACK_MANAGEMENT_TOKEN,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                originalAlerts = data?.entry?.alerts ?? [];
            }
        }
    });

    after(async function () {
        this.timeout(30000);

        // If we added a test alert, restore original alerts
        if (!homepageEntryUid || !adminClient || originalAlerts === null) return;

        await adminClient.request(updateUrl, {
            method: "PUT",
            body: { entryUid: homepageEntryUid, alerts: originalAlerts },
        });
    });

    // ─────────────────────────────────────────────────────────────
    // PUT /api/update-alerts-in-cs
    // ─────────────────────────────────────────────────────────────
    describe("PUT /api/update-alerts-in-cs", function () {
        it("returns 401 when unauthenticated", async () => {
            const client = createCookieClient();

            const { status, json } = await client.request(updateUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expectUnauthenticated(status, json);
        });

        it("returns 403 for partner users", async () => {
            const client = createCookieClient();
            await login(client, config.users.partner);

            const { status, json } = await client.request(updateUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("returns 403 for contentstack users", async () => {
            const client = createCookieClient();
            await login(client, config.users.contentstack);

            const { status, json } = await client.request(updateUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("admin can update and publish alerts (200 + entry shape)", async function () {
            if (!homepageEntryUid) {
                return this.skip();
            }

            const alertsWithTest = [...(originalAlerts ?? []), testAlert];

            const { status, json, text } = await adminClient.request(updateUrl, {
                method: "PUT",
                body: { entryUid: homepageEntryUid, alerts: alertsWithTest },
            });

            expect(status, text).to.equal(200);
            expect(json).to.be.an("object");
            expect(json.message).to.equal("Alerts updated and published successfully.");
            expect(json.entry).to.be.an("object");
            expect(json.entry.uid).to.equal(homepageEntryUid);
            expect(json.entry.alerts).to.be.an("array");
        });
    });

    // ─────────────────────────────────────────────────────────────
    // PUT /api/update-alerts-in-cs/delete
    // ─────────────────────────────────────────────────────────────
    describe("PUT /api/update-alerts-in-cs/delete", function () {
        it("returns 401 when unauthenticated", async () => {
            const client = createCookieClient();

            const { status, json } = await client.request(deleteUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expectUnauthenticated(status, json);
        });

        it("returns 403 for partner users", async () => {
            const client = createCookieClient();
            await login(client, config.users.partner);

            const { status, json } = await client.request(deleteUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("returns 403 for contentstack users", async () => {
            const client = createCookieClient();
            await login(client, config.users.contentstack);

            const { status, json } = await client.request(deleteUrl, {
                method: "PUT",
                body: { entryUid: "any-uid", alerts: [] },
            });

            expect(status).to.equal(403);
            expect(json).to.deep.equal({ error: "Forbidden: insufficient permissions" });
        });

        it("returns 500 when entryUid is missing", async function () {
            if (!adminClient) {
                // Need an admin client — create a temporary one
                const client = createCookieClient();
                await login(client, config.users.admin);

                const { status, json } = await client.request(deleteUrl, {
                    method: "PUT",
                    body: { alerts: [] },
                });

                expect(status).to.equal(500);
                expect(json).to.have.property("error");
                return;
            }

            const { status, json } = await adminClient.request(deleteUrl, {
                method: "PUT",
                body: { alerts: [] },
            });

            expect(status).to.equal(500);
            expect(json).to.have.property("error");
        });

        it("returns 500 when alerts array is missing", async function () {
            if (!adminClient) {
                const client = createCookieClient();
                await login(client, config.users.admin);

                const { status, json } = await client.request(deleteUrl, {
                    method: "PUT",
                    body: { entryUid: "any-uid" },
                });

                expect(status).to.equal(500);
                expect(json).to.have.property("error");
                return;
            }

            const { status, json } = await adminClient.request(deleteUrl, {
                method: "PUT",
                body: { entryUid: "any-uid" },
            });

            expect(status).to.equal(500);
            expect(json).to.have.property("error");
        });

        it("admin can remove an alert and publish (200 + entry shape)", async function () {
            if (!homepageEntryUid) {
                return this.skip();
            }

            // Remove the test alert added in the update test (restore to original)
            const { status, json, text } = await adminClient.request(deleteUrl, {
                method: "PUT",
                body: { entryUid: homepageEntryUid, alerts: originalAlerts ?? [] },
            });

            expect(status, text).to.equal(200);
            expect(json).to.be.an("object");
            expect(json.message).to.equal("Alert deleted and entry published successfully.");
            expect(json.entry).to.be.an("object");
            expect(json.entry.uid).to.equal(homepageEntryUid);
            expect(json.entry.alerts).to.be.an("array");
        });
    });
});
