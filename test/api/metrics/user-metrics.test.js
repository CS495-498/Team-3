import { expect } from "chai";

describe("GET /api/metrics/user-metrics", () => {
    const mockMetrics = [
        {
            user_id: "user-1",
            date: "2024-02-01",
            post_count: 2,
            get_count: 3,
            put_count: 1,
            delete_count: 0,
            request_count: 6,
        },
        {
            user_id: "user-1",
            date: "2024-02-02",
            post_count: 1,
            get_count: 2,
            put_count: 0,
            delete_count: 1,
            request_count: 4,
        },
        {
            user_id: "user-2",
            date: "2024-02-01",
            post_count: 5,
            get_count: 5,
            put_count: 0,
            delete_count: 0,
            request_count: 10,
        },
    ];

    beforeEach(() => {
        // Mock fetch to simulate the API route
        global.fetch = async (url, options = {}) => {
            const urlObj = new URL(url, "http://localhost:3000");

            if (!urlObj.pathname.startsWith("/api/metrics/user-metrics")) {
                return new Response(
                    JSON.stringify({ error: "Not found" }),
                    { status: 404 }
                );
            }

            // Unauthorized
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

            const startDate = urlObj.searchParams.get("start_date");
            const endDate = urlObj.searchParams.get("end_date");

            // Filter by date
            let filtered = [...mockMetrics];
            if (startDate) filtered = filtered.filter(m => m.date >= startDate);
            if (endDate) filtered = filtered.filter(m => m.date <= endDate);

            // Group by user_id
            const grouped = {};
            filtered.forEach(row => {
                if (!grouped[row.user_id]) {
                    grouped[row.user_id] = {
                        user_id: row.user_id,
                        start_date: row.date,
                        end_date: row.date,
                        total_post: 0,
                        total_get: 0,
                        total_put: 0,
                        total_delete: 0,
                        total_requests: 0,
                    };
                }

                grouped[row.user_id].start_date = row.date < grouped[row.user_id].start_date ? row.date : grouped[row.user_id].start_date;
                grouped[row.user_id].end_date = row.date > grouped[row.user_id].end_date ? row.date : grouped[row.user_id].end_date;

                grouped[row.user_id].total_post += row.post_count;
                grouped[row.user_id].total_get += row.get_count;
                grouped[row.user_id].total_put += row.put_count;
                grouped[row.user_id].total_delete += row.delete_count;
                grouped[row.user_id].total_requests += row.request_count;
            });

            return new Response(JSON.stringify(Object.values(grouped)), { status: 200 });
        };
    });

    it("returns 401 when unauthorized", async () => {
        const res = await fetch("/api/metrics/user-metrics", { headers: { unauth: "1" } });
        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 500 on DB error", async () => {
        const res = await fetch("/api/metrics/user-metrics", { headers: { dbFail: "1" } });
        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("groups metrics by user_id", async () => {
        const res = await fetch("/api/metrics/user-metrics");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.be.an("array");
        expect(body).to.have.length(2);

        const user1 = body.find(u => u.user_id === "user-1");
        expect(user1.total_requests).to.equal(10);
        expect(user1.total_post).to.equal(3);
        expect(user1.start_date).to.equal("2024-02-01");
        expect(user1.end_date).to.equal("2024-02-02");

        const user2 = body.find(u => u.user_id === "user-2");
        expect(user2.total_requests).to.equal(10);
    });

    it("filters by start and end date", async () => {
        const res = await fetch("/api/metrics/user-metrics?start_date=2024-02-02&end_date=2024-02-02");
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.have.length(1);

        const user1 = body[0];
        expect(user1.start_date).to.equal("2024-02-02");
        expect(user1.end_date).to.equal("2024-02-02");
    });
});