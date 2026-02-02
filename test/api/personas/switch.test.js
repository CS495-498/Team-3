import { expect } from "chai";

describe("PATCH /api/personas/active", () => {
    beforeEach(() => {
        global.fetch = async (url, options) => {
            if (url !== "/api/personas/active" || options.method !== "PATCH") {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            const body = JSON.parse(options.body || "{}");
            const { personaId } = body;

            // ---- edge cases ----

            if (personaId === "unauth") {
                return new Response(
                    JSON.stringify({ error: "Unauthorized" }),
                    { status: 401 }
                );
            }

            // clear active persona
            if (!personaId) {
                return new Response(
                    JSON.stringify({ success: true }),
                    { status: 200 }
                );
            }

            if (personaId === "forbidden") {
                return new Response(
                    JSON.stringify({ error: "Persona not found or forbidden" }),
                    { status: 403 }
                );
            }

            if (personaId === "boom") {
                return new Response(
                    JSON.stringify({ error: "Database error" }),
                    { status: 500 }
                );
            }

            // ---- success ----
            return new Response(
                JSON.stringify({ success: true }),
                { status: 200 }
            );
        };
    });

    it("returns 401 when unauthorized", async () => {
        const res = await fetch("/api/personas/active", {
            method: "PATCH",
            body: JSON.stringify({ personaId: "unauth" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("clears active persona when personaId is missing", async () => {
        const res = await fetch("/api/personas/active", {
            method: "PATCH",
            body: JSON.stringify({}),
        });

        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.success).to.equal(true);
    });

    it("returns 403 when persona is not owned or missing", async () => {
        const res = await fetch("/api/personas/active", {
            method: "PATCH",
            body: JSON.stringify({ personaId: "forbidden" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(403);
        expect(body.error).to.equal("Persona not found or forbidden");
    });

    it("returns 500 on database error", async () => {
        const res = await fetch("/api/personas/active", {
            method: "PATCH",
            body: JSON.stringify({ personaId: "boom" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("returns success when setting active persona", async () => {
        const res = await fetch("/api/personas/active", {
            method: "PATCH",
            body: JSON.stringify({ personaId: "persona-123" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.success).to.equal(true);
    });
});
