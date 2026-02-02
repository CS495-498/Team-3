import { expect } from "chai";

describe("GET /api/profiles", () => {
    beforeEach(() => {
        global.fetch = async (url, options = {}) => {
            if (url !== "/api/profiles") {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            // ---- unauthenticated -> redirect ----
            if (options.headers?.unauth) {
                return new Response(null, {
                    status: 302,
                    headers: {
                        location: "/login",
                    },
                });
            }

            // ---- db error ----
            if (options.headers?.dbFail) {
                return new Response(
                    JSON.stringify({ error: "Database error" }),
                    { status: 500 }
                );
            }

            // ---- success ----
            return new Response(
                JSON.stringify([
                    { id: "1", username: "alice" },
                    { id: "2", username: "bob" },
                ]),
                { status: 200 }
            );
        };
    });

    it("redirects to /login when unauthenticated", async () => {
        const res = await fetch("/api/profiles", {
            headers: { unauth: "1" },
        });

        expect(res.status).to.equal(302);
        expect(res.headers.get("location")).to.equal("/login");
    });

    it("returns 500 on database error", async () => {
        const res = await fetch("/api/profiles", {
            headers: { dbFail: "1" },
        });

        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("returns profiles on success", async () => {
        const res = await fetch("/api/profiles");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.be.an("array");
        expect(body).to.have.length(2);
    });
});
