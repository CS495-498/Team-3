import { expect } from "chai";
import sinon from "sinon";

// Import the handler
import * as route from "../../../../src/app/api/metrics/route.js";

// Mock modules
import * as supabaseServer from "@/utils/Supabase/server";
import * as nextServer from "next/server";

describe("GET /api/metrics", () => {
    let createClientStub;
    let jsonStub;

    beforeEach(() => {
        jsonStub = sinon.stub(nextServer.NextResponse, "json").callsFake((body, init = {}) => {
            return {
                status: init.status || 200,
                body,
            };
        });
    });

    afterEach(() => {
        sinon.restore();
    });

    function buildSupabaseMock({ user = { id: "u1" }, data = [], error = null }) {
        const queryBuilder = {
            select: sinon.stub().returnsThis(),
            gte: sinon.stub().returnsThis(),
            lte: sinon.stub().returnsThis(),
        };

        const finalQuery = Promise.resolve({ data, error });

        // When awaited, query returns finalQuery
        queryBuilder.then = finalQuery.then.bind(finalQuery);

        return {
            auth: {
                getUser: sinon.stub().resolves({ data: { user }, error: null }),
            },
            from: sinon.stub().returns(queryBuilder),
        };
    }

    it("returns 401 when user not authenticated", async () => {
        createClientStub = sinon.stub(supabaseServer, "createClient").resolves({
            auth: {
                getUser: sinon.stub().resolves({
                    data: { user: null },
                    error: null,
                }),
            },
        });

        const req = { url: "http://localhost/api?groupBy=date" };

        const res = await route.GET(req);

        expect(res.status).to.equal(401);
        expect(res.body).to.deep.equal({ error: "Unauthorized" });
    });

    it("groups by date", async () => {
        const supabaseMock = buildSupabaseMock({
            data: [
                { date: "2024-01-01", request_count: 5 },
                { date: "2024-01-01", request_count: 3 },
                { date: "2024-01-02", request_count: 2 },
            ],
        });

        createClientStub = sinon.stub(supabaseServer, "createClient").resolves(supabaseMock);

        const req = { url: "http://localhost/api?groupBy=date" };

        const res = await route.GET(req);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([
            { date: "2024-01-01", total_requests: 8 },
            { date: "2024-01-02", total_requests: 2 },
        ]);
    });

    it("returns top 10 endpoints when groupBy=endpoint", async () => {
        const supabaseMock = buildSupabaseMock({
            data: [
                { endpoint: "/a", request_count: 5 },
                { endpoint: "/a", request_count: 2 },
                { endpoint: "/b", request_count: 10 },
            ],
        });

        createClientStub = sinon.stub(supabaseServer, "createClient").resolves(supabaseMock);

        const req = { url: "http://localhost/api?groupBy=endpoint" };

        const res = await route.GET(req);

        expect(res.status).to.equal(200);
        expect(res.body[0]).to.deep.equal({ endpoint: "/b", total_requests: 10 });
        expect(res.body[1]).to.deep.equal({ endpoint: "/a", total_requests: 7 });
    });

    it("aggregates HTTP methods when groupBy=methods", async () => {
        const supabaseMock = buildSupabaseMock({
            data: [
                { post_count: 1, get_count: 2, put_count: 3, delete_count: 4 },
                { post_count: 2, get_count: 3, put_count: 4, delete_count: 5 },
            ],
        });

        createClientStub = sinon.stub(supabaseServer, "createClient").resolves(supabaseMock);

        const req = { url: "http://localhost/api?groupBy=methods" };

        const res = await route.GET(req);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([
            {
                total_post: 3,
                total_get: 5,
                total_put: 7,
                total_delete: 9,
            },
        ]);
    });

    it("returns 500 when query fails", async () => {
        const supabaseMock = buildSupabaseMock({
            data: null,
            error: { message: "DB error" },
        });

        createClientStub = sinon.stub(supabaseServer, "createClient").resolves(supabaseMock);

        const req = { url: "http://localhost/api?groupBy=date" };

        const res = await route.GET(req);

        expect(res.status).to.equal(500);
        expect(res.body).to.deep.equal({ error: "DB error" });
    });

    it("returns empty array when no groupBy provided", async () => {
        const supabaseMock = buildSupabaseMock({ data: [] });

        createClientStub = sinon.stub(supabaseServer, "createClient").resolves(supabaseMock);

        const req = { url: "http://localhost/api" };

        const res = await route.GET(req);

        expect(res.status).to.equal(200);
        expect(res.body).to.deep.equal([]);
    });
});