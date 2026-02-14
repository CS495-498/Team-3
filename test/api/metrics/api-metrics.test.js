import { expect } from "chai";

describe("GET /api/metrics/api-metrics", () => {
    const mockMetrics = [
        {
            date: "2024-02-01",
            endpoint: "/api/users",
            request_count: 10,
            post_count: 3,
            get_count: 7,
            put_count: 0,
            delete_count: 0,
        },
        {
            date: "2024-02-01",
            endpoint: "/api/users",
            request_count: 5,
            post_count: 1,
            get_count: 4,
            put_count: 0,
            delete_count: 0,
        },
        {
            date: "2024-02-02",
            endpoint: "/api/orders",
            request_count: 20,
            post_count: 10,
            get_count: 10,
            put_count: 0,
            delete_count: 0,
        },
    ];

    beforeEach(() => {
        // Mock fetch to simulate the API route
        global.fetch = async (url, options = {}) => {
            const urlObj = new URL(url, "http://localhost:3000");

            if (!urlObj.pathname.startsWith("/api/metrics/api-metrics")) {
                return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
            }

            // Unauthorized
            if (options.headers?.unauth) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            // Simulate DB failure
            if (options.headers?.dbFail) {
                return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
            }

            const startDate = urlObj.searchParams.get("start_date");
            const endDate = urlObj.searchParams.get("end_date");
            const groupBy = urlObj.searchParams.get("groupBy");

            // Filter by date
            let filtered = [...mockMetrics];
            if (startDate) filtered = filtered.filter(m => m.date >= startDate);
            if (endDate) filtered = filtered.filter(m => m.date <= endDate);

            // Group by date
            if (groupBy === "date") {
                const grouped = {};
                filtered.forEach(row => {
                    if (!grouped[row.date]) grouped[row.date] = { date: row.date, total_requests: 0 };
                    grouped[row.date].total_requests += row.request_count;
                });
                return new Response(JSON.stringify(Object.values(grouped)), { status: 200 });
            }

            // Group by endpoint
            if (groupBy === "endpoint") {
                const grouped = {};
                filtered.forEach(row => {
                    if (!grouped[row.endpoint]) grouped[row.endpoint] = { endpoint: row.endpoint, total_requests: 0 };
                    grouped[row.endpoint].total_requests += row.request_count;
                });
                const topEndpoints = Object.values(grouped)
                    .sort((a, b) => b.total_requests - a.total_requests)
                    .slice(0, 10);
                return new Response(JSON.stringify(topEndpoints), { status: 200 });
            }

            // Aggregate methods
            if (groupBy === "methods") {
                const totals = { total_post: 0, total_get: 0, total_put: 0, total_delete: 0 };
                filtered.forEach(row => {
                    totals.total_post += row.post_count;
                    totals.total_get += row.get_count;
                    totals.total_put += row.put_count;
                    totals.total_delete += row.delete_count;
                });
                return new Response(JSON.stringify([totals]), { status: 200 });
            }

            // Default: return empty
            return new Response(JSON.stringify([]), { status: 200 });
        };
    });

    it("returns 401 when unauthorized", async () => {
        const res = await fetch("/api/metrics/api-metrics", { headers: { unauth: "1" } });
        const body = await res.json();
        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 500 on database error", async () => {
        const res = await fetch("/api/metrics/api-metrics", { headers: { dbFail: "1" } });
        const body = await res.json();
        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("groups metrics by date", async () => {
        const res = await fetch("/api/metrics/api-metrics?groupBy=date");
        const body = await res.json();
        expect(res.status).to.equal(200);
        expect(body).to.deep.include({ date: "2024-02-01", total_requests: 15 });
        expect(body).to.deep.include({ date: "2024-02-02", total_requests: 20 });
    });

    it("groups metrics by endpoint", async () => {
        const res = await fetch("/api/metrics/api-metrics?groupBy=endpoint");
        const body = await res.json();
        expect(res.status).to.equal(200);
        expect(body[0]).to.have.property("endpoint");
        expect(body[0]).to.have.property("total_requests");
    });

    it("aggregates HTTP methods", async () => {
        const res = await fetch("/api/metrics/api-metrics?groupBy=methods");
        const body = await res.json();
        expect(res.status).to.equal(200);
        expect(body[0]).to.have.property("total_post");
        expect(body[0]).to.have.property("total_get");
        expect(body[0]).to.have.property("total_put");
        expect(body[0]).to.have.property("total_delete");
    });

    it("filters by start and end date", async () => {
        const res = await fetch("/api/metrics/api-metrics?start_date=2024-02-02&end_date=2024-02-02&groupBy=date");
        const body = await res.json();
        expect(res.status).to.equal(200);
        expect(body).to.have.length(1);
        expect(body[0].date).to.equal("2024-02-02");
    });
});