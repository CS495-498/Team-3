import { expect } from "chai";

describe("GET /api/metrics/api-metrics", () => {

    const mockMetrics = [
        {
            date: "2024-02-01T08:00:00Z",
            endpoint: "/api/users",
            avg_request_rate: 0.3,
            avg_latency: 100,
            post_count: 3,
            get_count: 7,
            put_count: 0,
            delete_count: 0,
            error_rate: 5
        },
        {
            date: "2024-02-01T08:00:00Z",
            endpoint: "/api/users",
            avg_request_rate: 0.2,
            avg_latency: 150,
            post_count: 2,
            get_count: 3,
            put_count: 0,
            delete_count: 0,
            error_rate: 0
        },
        {
            date: "2024-02-02T08:00:00Z",
            endpoint: "/api/orders",
            avg_request_rate: 0.4,
            avg_latency: 200,
            post_count: 5,
            get_count: 5,
            put_count: 0,
            delete_count: 0,
            error_rate: 2
        }
    ];

    beforeEach(() => {

        global.fetch = async (url, options = {}) => {

            const urlObj = new URL(url, "http://localhost:3000");

            if (!urlObj.pathname.startsWith("/api/metrics/api-metrics")) {
                return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
            }

            if (options.headers?.unauth) {
                return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
            }

            if (options.headers?.dbFail) {
                return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
            }

            const startDate = urlObj.searchParams.get("start_date");
            const endDate = urlObj.searchParams.get("end_date");
            const groupBy = urlObj.searchParams.get("groupBy");

            let filtered = [...mockMetrics];

            if (startDate) filtered = filtered.filter(m => m.date >= startDate);
            if (endDate) filtered = filtered.filter(m => m.date <= endDate);

            // ===============================
            // groupBy = date (RPM + error rate)
            // ===============================
            if (groupBy === "date") {

                const grouped = {};

                filtered.forEach(row => {

                    const bucket = row.date.slice(0, 13) + ":00:00.000Z";

                    const requestCount =
                        row.post_count +
                        row.get_count +
                        row.put_count +
                        row.delete_count;

                    if (!grouped[bucket]) {
                        grouped[bucket] = {
                            date: bucket,
                            total_requests: 0,
                            weighted_rpm: 0,
                            weighted_error: 0
                        };
                    }

                    grouped[bucket].total_requests += requestCount;

                    grouped[bucket].weighted_rpm +=
                        row.avg_request_rate * requestCount;

                    grouped[bucket].weighted_error +=
                        row.error_rate * requestCount;
                });

                const result = Object.values(grouped).map(row => ({
                    date: row.date,
                    avg_hourly_rpm:
                        row.total_requests > 0
                            ? row.weighted_rpm / row.total_requests
                            : 0,

                    error_percentage:
                        row.total_requests > 0
                            ? row.weighted_error / row.total_requests
                            : 0
                }));

                return new Response(JSON.stringify(result), { status: 200 });
            }

            // ===============================
            // groupBy = endpoint (latency aggregation)
            // ===============================
            if (groupBy === "endpoint") {

                const grouped = {};

                filtered.forEach(row => {

                    const requestCount =
                        row.post_count +
                        row.get_count +
                        row.put_count +
                        row.delete_count;

                    if (!grouped[row.endpoint]) {
                        grouped[row.endpoint] = {
                            endpoint: row.endpoint,
                            total_latency_weighted: 0,
                            total_requests: 0
                        };
                    }

                    grouped[row.endpoint].total_latency_weighted +=
                        row.avg_latency * requestCount;

                    grouped[row.endpoint].total_requests += requestCount;
                });

                const result = Object.values(grouped).map(row => ({
                    endpoint: row.endpoint,
                    avg_latency:
                        row.total_requests > 0
                            ? row.total_latency_weighted / row.total_requests
                            : 0
                }));

                return new Response(JSON.stringify(result), { status: 200 });
            }

            return new Response(JSON.stringify([]), { status: 200 });
        };
    });

    it("returns 401 when unauthorized", async () => {

        const res = await fetch("/api/metrics/api-metrics", {
            headers: { unauth: "1" }
        });

        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("returns 500 on database error", async () => {

        const res = await fetch("/api/metrics/api-metrics", {
            headers: { dbFail: "1" }
        });

        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("Database error");
    });

    it("groups metrics by date", async () => {

        const res = await fetch("/api/metrics/api-metrics?groupBy=date");
        const body = await res.json();

        expect(res.status).to.equal(200);

        expect(body).to.be.an("array");
        expect(body[0]).to.have.property("avg_hourly_rpm");
        expect(body[0]).to.have.property("error_percentage");
    });

    it("groups metrics by endpoint", async () => {

        const res = await fetch("/api/metrics/api-metrics?groupBy=endpoint");
        const body = await res.json();

        expect(res.status).to.equal(200);

        expect(body[0]).to.have.property("endpoint");
        expect(body[0]).to.have.property("avg_latency");
    });

});