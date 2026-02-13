import { expect } from "chai";
import sinon from "sinon";
import { GET } from "../../../../src/app/api/metrics/api-metrics/route.js";
import * as supabaseServer from "../../../../src/utils/Supabase/server.js";

describe("GET /api/metrics/api-metrics", () => {
    let createClientStub;
    let supabaseMock;
    let queryMock;

    const mockRows = [
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
        queryMock = {
            select: sinon.stub().returnsThis(),
            gte: sinon.stub().returnsThis(),
            lte: sinon.stub().returnsThis(),
            then: undefined,
        };

        supabaseMock = {
            auth: {
                getUser: sinon.stub().resolves({
                    data: { user: { id: "u1" } },
                    error: null,
                }),
            },
            from: sinon.stub().returns(queryMock),
        };

        // emulate await query
        queryMock.then = (resolve) =>
            resolve({ data: mockRows, error: null });

        createClientStub = sinon
            .stub(supabaseServer, "createClient")
            .resolves(supabaseMock);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("returns 401 when unauthenticated", async () => {
        supabaseMock.auth.getUser.resolves({
            data: { user: null },
            error: null,
        });

        const req = { url: "http://localhost/api/metrics/api-metrics" };
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("groups by date", async () => {
        const req = {
            url: "http://localhost/api/metrics/api-metrics?groupBy=date",
        };

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.deep.include({ date: "2024-02-01", total_requests: 15 });
        expect(body).to.deep.include({ date: "2024-02-02", total_requests: 20 });
    });

    it("returns top endpoints when groupBy=endpoint", async () => {
        const req = {
            url: "http://localhost/api/metrics/api-metrics?groupBy=endpoint",
        };

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body[0]).to.have.property("endpoint");
        expect(body[0]).to.have.property("total_requests");
    });

    it("aggregates HTTP methods", async () => {
        const req = {
            url: "http://localhost/api/metrics/api-metrics?groupBy=methods",
        };

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body[0]).to.have.property("total_post");
        expect(body[0]).to.have.property("total_get");
    });

    it("returns 500 when DB error occurs", async () => {
        queryMock.then = (resolve) =>
            resolve({ data: null, error: { message: "DB failure" } });

        const req = { url: "http://localhost/api/metrics/api-metrics" };
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("DB failure");
    });
});