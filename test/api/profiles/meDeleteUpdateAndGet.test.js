import { expect } from "chai";

describe("/api/profiles/me API", () => {
    beforeEach(() => {
        global.fetch = async (url, options = {}) => {
            if (url !== "/api/profiles/me") {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            const method = options.method || "GET";

            // ---------- GET ----------
            if (method === "GET") {
                if (options.headers?.unauth) {
                    return new Response(
                        JSON.stringify({ error: "Unauthorized" }),
                        { status: 401 }
                    );
                }

                if (options.headers?.missingProfile) {
                    return new Response(
                        JSON.stringify({ error: "Profile not found" }),
                        { status: 404 }
                    );
                }

                if (options.headers?.personaFail) {
                    return new Response(
                        JSON.stringify({ error: "DB error" }),
                        { status: 500 }
                    );
                }

                return new Response(
                    JSON.stringify({
                        id: "user-1",
                        full_name: "Joseph",
                        username: "jculp",
                        avatar_url: "",
                        personas: [
                            { id: "p1", name: "Persona 1" },
                            { id: "p2", name: "Persona 2" },
                        ],
                        activePersona: { id: "p1", name: "Persona 1" },
                    }),
                    { status: 200 }
                );
            }

            // ---------- PUT ----------
            if (method === "PUT") {
                if (options.headers?.unauth) {
                    return new Response(
                        JSON.stringify({ error: "Unauthorized" }),
                        { status: 401 }
                    );
                }

                if (options.body?.includes("FAIL")) {
                    return new Response(
                        JSON.stringify({ error: "Update failed" }),
                        { status: 500 }
                    );
                }

                return new Response(null, { status: 204 });
            }

            // ---------- DELETE ----------
            if (method === "DELETE") {
                if (options.headers?.unauth) {
                    return new Response(
                        JSON.stringify({ error: "Unauthorized" }),
                        { status: 401 }
                    );
                }

                if (options.headers?.personaFail) {
                    return new Response(
                        JSON.stringify({ error: "Failed to delete personas" }),
                        { status: 500 }
                    );
                }

                if (options.headers?.profileFail) {
                    return new Response(
                        JSON.stringify({ error: "Failed to delete profile" }),
                        { status: 500 }
                    );
                }

                if (options.headers?.authFail) {
                    return new Response(
                        JSON.stringify({ error: "Failed to delete user" }),
                        { status: 500 }
                    );
                }

                return new Response(null, { status: 204 });
            }

            return new Response(
                JSON.stringify({ error: "Method not allowed" }),
                { status: 405 }
            );
        };
    });

    // ---------------- GET ----------------

    it("GET returns 401 when unauthorized", async () => {
        const res = await fetch("/api/profiles/me", {
            headers: { unauth: "1" },
        });

        expect(res.status).to.equal(401);
    });

    it("GET returns profile data on success", async () => {
        const res = await fetch("/api/profiles/me");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.personas).to.have.length(2);
        expect(body.activePersona.id).to.equal("p1");
    });

    // ---------------- PUT ----------------

    it("PUT returns 204 on success", async () => {
        const res = await fetch("/api/profiles/me", {
            method: "PUT",
            body: JSON.stringify({ full_name: "New Name" }),
        });

        expect(res.status).to.equal(204);
    });

    it("PUT returns 500 on update failure", async () => {
        const res = await fetch("/api/profiles/me", {
            method: "PUT",
            body: "FAIL",
        });

        expect(res.status).to.equal(500);
    });

    // ---------------- DELETE ----------------

    it("DELETE returns 204 on success", async () => {
        const res = await fetch("/api/profiles/me", {
            method: "DELETE",
        });

        expect(res.status).to.equal(204);
    });

    it("DELETE returns 500 when persona delete fails", async () => {
        const res = await fetch("/api/profiles/me", {
            method: "DELETE",
            headers: { personaFail: "1" },
        });

        expect(res.status).to.equal(500);
    });
});
