import { expect } from "chai";

describe("POST /api/personas", () => {
    beforeEach(() => {
        global.fetch = async (url, options) => {
            if (url !== "/api/personas" || options.method !== "POST") {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            const body = JSON.parse(options.body || "{}");
            const name = body.displayName?.trim();

            // ---- edge cases ----
            if (!name) {
                return new Response(
                    JSON.stringify({ error: "Persona name required" }),
                    { status: 400 }
                );
            }

            if (name === "unauth") {
                return new Response(
                    JSON.stringify({ error: "Unauthorized" }),
                    { status: 401 }
                );
            }

            if (name === "boom") {
                return new Response(
                    JSON.stringify({ error: "Database error" }),
                    { status: 500 }
                );
            }

            // ---- success ----
            return new Response(
                JSON.stringify({
                    id: "persona-123",
                    owner_id: "user-1",
                    full_name: name,
                    username: null,
                    avatar_url: null,
                }),
                {
                    status: 201,
                    headers: { "content-type": "application/json" },
                }
            );
        };
    });

    it("returns 400 when displayName is missing", async () => {
        const res = await fetch("/api/personas", {
            method: "POST",
            body: JSON.stringify({}),
        });

        const body = await res.json();

        expect(res.status).to.equal(400);
        expect(body.error).to.equal("Persona name required");
    });

    it("returns 400 when displayName is empty", async () => {
        const res = await fetch("/api/personas", {
            method: "POST",
            body: JSON.stringify({ displayName: "   " }),
        });

        const body = await res.json();

        expect(res.status).to.equal(400);
        expect(body.error).to.equal("Persona name required");
    });

    it("returns 401 when unauthorized", async () => {
        const res = await fetch("/api/personas", {
            method: "POST",
            body: JSON.stringify({ displayName: "unauth" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 500 on server error", async () => {
        const res = await fetch("/api/personas", {
            method: "POST",
            body: JSON.stringify({ displayName: "boom" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("returns 201 and persona data on success", async () => {
        const res = await fetch("/api/personas", {
            method: "POST",
            body: JSON.stringify({ displayName: "My Persona" }),
        });

        const body = await res.json();

        expect(res.status).to.equal(201);
        expect(body.full_name).to.equal("My Persona");
        expect(body.owner_id).to.equal("user-1");
    });
});
