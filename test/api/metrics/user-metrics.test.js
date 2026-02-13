import { expect } from "chai";
import sinon from "sinon";
import { GET as userMetricsHandler } from "../../../../src/app/api/metrics/user-metrics/route.js";
import * as supabaseModule from "@/utils/Supabase/server.js";

describe("user-metrics API GET handler", () => {
    let createClientStub;

    beforeEach(() => {
        createClientStub = sinon.stub(supabaseModule, "createClient");
    });

    afterEach(() => {
        sinon.restore();
    });

    it("returns grouped user metrics on success", async () => {
        // mock Supabase client
        const mockSupabase = {
            auth: {
                getUser: sinon.stub().resolves({ data: { user: { id: "u1" } }, error: null }),
            },
            from: sinon.stub().returnsThis(),
            select: sinon.stub().returnsThis(),
            gte: sinon.stub().returnsThis(),
            lte: sinon.stub().returnsThis(),
            then: undefined,
            query: undefined,
        };

        // mock the final query
        const mockData = [
            { user_id: "u1", date: "2026-02-08", post_count: "1", get_count: "2", put_count: "0", delete_count: "0", request_count: "3" },
            { user_id: "u1", date: "2026-02-09", post_count: "0", get_count: "1", put_count: "0", delete_count: "0", request_count: "1" },
            { user_id: "u2", date: "2026-02-08", post_count: "0", get_count: "1", put_count: "0", delete_count: "1", request_count: "2" },
        ];

        const queryStub = sinon.stub().resolves({ data: mockData, error: null });
        mockSupabase.from.returns({ select: queryStub, gte: () => ({ lte: queryStub }) });

        createClientStub.resolves(mockSupabase);

        // simulate request object
        const request = new Request("http://localhost/api/metrics/user-metrics?start_date=2026-02-08&end_date=2026-02-09");

        const response = await userMetricsHandler(request);
        const body = await response.json();

        expect(response.status).to.equal(200);
        expect(body).to.be.an("array");
        const u1 = body.find((u) => u.user_id === "u1");
        expect(u1.total_post).to.equal(1);
        expect(u1.total_get).to.equal(2 + 1);
        expect(u1.total_requests).to.equal(3 + 1);
        expect(u1.start_date).to.equal("2026-02-08");
        expect(u1.end_date).to.equal("2026-02-09");
    });

    it("returns 401 if user is not authenticated", async () => {
        const mockSupabase = {
            auth: { getUser: sinon.stub().resolves({ data: { user: null }, error: null }) },
            from: sinon.stub().returnsThis(),
            select: sinon.stub().returnsThis(),
        };
        createClientStub.resolves(mockSupabase);

        const request = new Request("http://localhost/api/metrics/user-metrics");

        const response = await userMetricsHandler(request);
        const body = await response.json();

        expect(response.status).to.equal(401);
        expect(body).to.deep.equal({ error: "Unauthorized" });
    });

    it("returns 500 if Supabase query errors", async () => {
        const mockSupabase = {
            auth: { getUser: sinon.stub().resolves({ data: { user: { id: "u1" } }, error: null }) },
            from: sinon.stub().returnsThis(),
            select: sinon.stub().returnsThis(),
        };
        createClientStub.resolves(mockSupabase);

        const request = new Request("http://localhost/api/metrics/user-metrics");

        // simulate .then() throwing error
        sinon.stub(mockSupabase, "from").throws(new Error("DB down"));

        const response = await userMetricsHandler(request);
        const body = await response.json();

        expect(response.status).to.equal(500);
        expect(body).to.deep.equal({ error: "Server error" });
    });
});