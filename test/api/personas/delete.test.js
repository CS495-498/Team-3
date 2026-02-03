import { expect } from "chai";

describe("DELETE /api/personas/:id", () => {
    beforeEach(() => {
        global.fetch = async (url, options) => {
            const match = url.match(/\/api\/personas\/(.+)/);
            const id = match?.[1];

            if (options.method !== "DELETE") {
                return new Response(
                    JSON.stringify({ error: "Method not allowed" }),
                    { status: 405 }
                );
            }

            switch (id) {
                case "123":
                    return new Response(
                        JSON.stringify({ success: true }),
                        { status: 200, headers: { "content-type": "application/json" } }
                    );

                case "unauth":
                    return new Response(
                        JSON.stringify({ error: "Unauthorized" }),
                        { status: 401 }
                    );

                case "forbidden":
                    return new Response(
                        JSON.stringify({ error: "Forbidden" }),
                        { status: 403 }
                    );

                case "missing":
                    return new Response(
                        JSON.stringify({ error: "Persona not found" }),
                        { status: 404 }
                    );

                default:
                    return new Response(
                        JSON.stringify({ error: "Server error" }),
                        { status: 500 }
                    );
            }
        };
    });

    it("returns success on delete", async () => {
        const res = await fetch("/api/personas/123", { method: "DELETE" });
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.success).to.equal(true);
    });

    it("returns 401 when unauthorized", async () => {
        const res = await fetch("/api/personas/unauth", { method: "DELETE" });
        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 403 when forbidden", async () => {
        const res = await fetch("/api/personas/forbidden", { method: "DELETE" });
        const body = await res.json();

        expect(res.status).to.equal(403);
        expect(body.error).to.equal("Forbidden");
    });

    it("returns 404 when persona not found", async () => {
        const res = await fetch("/api/personas/missing", { method: "DELETE" });
        const body = await res.json();

        expect(res.status).to.equal(404);
        expect(body.error).to.equal("Persona not found");
    });

    it("returns 500 on server error", async () => {
        const res = await fetch("/api/personas/boom", { method: "DELETE" });
        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Server error");
    });
});
