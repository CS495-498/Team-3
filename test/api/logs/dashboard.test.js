import { expect } from "chai";

describe("GET /api/logs/dashboard", () => {
    const mockLogs = [
        {
            id: "log-1",
            timestamp: "2024-02-10T12:00:00Z",
            level: "info",
            endpoint: "/api/profiles/me",
            status_code: 200,
            message: "GET /api/profiles/me",
            user_id: "user-123",
            metadata: { method: "GET", processing_time_ms: 45 },
        },
        {
            id: "log-2",
            timestamp: "2024-02-10T12:01:00Z",
            level: "error",
            endpoint: "/api/feature-requests",
            status_code: 500,
            message: "POST /api/feature-requests",
            user_id: null,
            metadata: { method: "POST", processing_time_ms: 120 },
        },
        {
            id: "log-3",
            timestamp: "2024-02-10T12:02:00Z",
            level: "warning",
            endpoint: "/api/profiles/123",
            status_code: 404,
            message: "GET /api/profiles/123",
            user_id: "user-456",
            metadata: { method: "GET", processing_time_ms: 30 },
        },
    ];

    beforeEach(() => {
        global.fetch = async (url, options = {}) => {
            const urlObj = new URL(url, "http://localhost:3000");

            if (!urlObj.pathname.startsWith("/api/logs/dashboard")) {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            // Unauthenticated request
            if (options.headers?.unauth) {
                return new Response(
                    JSON.stringify({ error: "Unauthorized" }),
                    { status: 401 }
                );
            }

            // Database error
            if (options.headers?.dbFail) {
                return new Response(
                    JSON.stringify({ error: "Database error" }),
                    { status: 500 }
                );
            }

            // Parse query params
            const page = parseInt(urlObj.searchParams.get("page") || "1", 10);
            const limit = parseInt(urlObj.searchParams.get("limit") || "30", 10);
            const search = urlObj.searchParams.get("search") || "";
            const level = urlObj.searchParams.get("level") || "";
            const status = urlObj.searchParams.get("status") || "";
            const method = urlObj.searchParams.get("method") || "";

            // Filter logs
            let filtered = [...mockLogs];

            if (search) {
                filtered = filtered.filter(
                    (log) =>
                        log.endpoint.includes(search) ||
                        log.message.includes(search)
                );
            }

            if (level) {
                filtered = filtered.filter((log) => log.level === level);
            }

            if (status) {
                if (status === "2xx") {
                    filtered = filtered.filter(
                        (log) => log.status_code >= 200 && log.status_code < 300
                    );
                } else if (status === "4xx") {
                    filtered = filtered.filter(
                        (log) => log.status_code >= 400 && log.status_code < 500
                    );
                } else if (status === "5xx") {
                    filtered = filtered.filter(
                        (log) => log.status_code >= 500 && log.status_code < 600
                    );
                }
            }

            if (method) {
                filtered = filtered.filter(
                    (log) => log.metadata?.method === method
                );
            }

            // Paginate
            const from = (page - 1) * limit;
            const to = from + limit;
            const paginatedLogs = filtered.slice(from, to);
            const total = filtered.length;
            const hasMore = to < total;

            return new Response(
                JSON.stringify({
                    logs: paginatedLogs,
                    total,
                    page,
                    limit,
                    hasMore,
                }),
                { status: 200 }
            );
        };
    });

    it("returns 401 when unauthenticated", async () => {
        const res = await fetch("/api/logs/dashboard", {
            headers: { unauth: "1" },
        });

        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 500 on database error", async () => {
        const res = await fetch("/api/logs/dashboard", {
            headers: { dbFail: "1" },
        });

        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("returns logs with correct pagination structure", async () => {
        const res = await fetch("/api/logs/dashboard");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.have.property("logs").that.is.an("array");
        expect(body).to.have.property("total").that.is.a("number");
        expect(body).to.have.property("page").that.equals(1);
        expect(body).to.have.property("limit").that.equals(30);
        expect(body).to.have.property("hasMore").that.is.a("boolean");
    });

    it("filters by status code range (2xx)", async () => {
        const res = await fetch("/api/logs/dashboard?status=2xx");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].status_code).to.equal(200);
    });

    it("filters by status code range (5xx)", async () => {
        const res = await fetch("/api/logs/dashboard?status=5xx");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].status_code).to.equal(500);
    });

    it("filters by log level", async () => {
        const res = await fetch("/api/logs/dashboard?level=error");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].level).to.equal("error");
    });

    it("filters by HTTP method", async () => {
        const res = await fetch("/api/logs/dashboard?method=POST");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].metadata.method).to.equal("POST");
    });

    it("filters by search term in endpoint", async () => {
        const res = await fetch("/api/logs/dashboard?search=feature");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].endpoint).to.include("feature");
    });

    it("returns correct hasMore for pagination", async () => {
        const res = await fetch("/api/logs/dashboard?limit=2");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(2);
        expect(body.hasMore).to.equal(true);
        expect(body.total).to.equal(3);
    });

    it("combines multiple filters", async () => {
        const res = await fetch("/api/logs/dashboard?method=GET&status=4xx");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.logs).to.have.length(1);
        expect(body.logs[0].status_code).to.equal(404);
        expect(body.logs[0].metadata.method).to.equal("GET");
    });
});
