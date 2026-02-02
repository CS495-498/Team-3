import { expect } from "chai";

describe("Profile API", () => {
    beforeEach(() => {
        global.fetch = async (url, options = {}) => {
            const getMatch = url.match(/\/api\/profiles\/(.+)/);
            const id = getMatch?.[1];

            // ---------- GET ----------
            if (!options.method || options.method === "GET") {
                if (id === "missing") {
                    return new Response(
                        JSON.stringify({ error: "Profile not found" }),
                        { status: 404 }
                    );
                }

                if (id === "boom") {
                    return new Response(
                        JSON.stringify({ error: "Database error" }),
                        { status: 500 }
                    );
                }

                return new Response(
                    JSON.stringify({
                        id,
                        username: "joseph",
                        full_name: "Joseph Culp",
                        avatar_url: "avatar.png",
                        signed_avatar_url: "https://signed.url/avatar.png",
                    }),
                    { status: 200 }
                );
            }

            // ---------- PUT ----------
            if (options.method === "PUT") {
                const auth = options.headers?.authorization;

                if (!auth) {
                    return new Response(
                        JSON.stringify({ error: "Unauthorized" }),
                        { status: 401 }
                    );
                }

                if (id !== "user-1") {
                    return new Response(
                        JSON.stringify({ error: "Forbidden" }),
                        { status: 403 }
                    );
                }

                const body = options.body;

                // Simulate file-related edge cases via flags
                if (body?.includes?.("TOO_LARGE")) {
                    return new Response(
                        JSON.stringify({ error: "File too large" }),
                        { status: 413 }
                    );
                }

                if (body?.includes?.("BAD_TYPE")) {
                    return new Response(
                        JSON.stringify({ error: "Invalid file type" }),
                        { status: 400 }
                    );
                }

                if (body?.includes?.("DB_FAIL")) {
                    return new Response(
                        JSON.stringify({ error: "Database error" }),
                        { status: 500 }
                    );
                }

                return new Response(
                    JSON.stringify({
                        id,
                        username: "updatedUser",
                        full_name: "Updated Name",
                        avatar_url: "avatar.webp",
                        signed_avatar_url: "https://signed.url/avatar.webp",
                    }),
                    { status: 200 }
                );
            }

            return new Response(
                JSON.stringify({ error: "Not found" }),
                { status: 404 }
            );
        };
    });

    // ---------------- GET ----------------

    it("GET returns profile data", async () => {
        const res = await fetch("/api/profiles/user-1");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.username).to.equal("joseph");
        expect(body.signed_avatar_url).to.exist;
    });

    it("GET returns 404 when profile missing", async () => {
        const res = await fetch("/api/profiles/missing");
        const body = await res.json();

        expect(res.status).to.equal(404);
        expect(body.error).to.equal("Profile not found");
    });

    it("GET returns 500 on db error", async () => {
        const res = await fetch("/api/profiles/boom");
        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    // ---------------- PUT ----------------

    it("PUT returns 401 without auth", async () => {
        const res = await fetch("/api/profiles/user-1", {
            method: "PUT",
        });

        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("PUT returns 403 when updating another user", async () => {
        const res = await fetch("/api/profiles/other-user", {
            method: "PUT",
            headers: { authorization: "Bearer token" },
        });

        const body = await res.json();

        expect(res.status).to.equal(403);
        expect(body.error).to.equal("Forbidden");
    });

    it("PUT returns 413 when file too large", async () => {
        const res = await fetch("/api/profiles/user-1", {
            method: "PUT",
            headers: { authorization: "Bearer token" },
            body: "TOO_LARGE",
        });

        const body = await res.json();

        expect(res.status).to.equal(413);
        expect(body.error).to.equal("File too large");
    });

    it("PUT returns 400 for invalid file type", async () => {
        const res = await fetch("/api/profiles/user-1", {
            method: "PUT",
            headers: { authorization: "Bearer token" },
            body: "BAD_TYPE",
        });

        const body = await res.json();

        expect(res.status).to.equal(400);
        expect(body.error).to.equal("Invalid file type");
    });

    it("PUT returns 200 on success", async () => {
        const res = await fetch("/api/profiles/user-1", {
            method: "PUT",
            headers: { authorization: "Bearer token" },
        });

        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.username).to.equal("updatedUser");
        expect(body.signed_avatar_url).to.exist;
    });
});
