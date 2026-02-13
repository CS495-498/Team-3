import { expect } from "chai";
import sinon from "sinon";
import { GET } from "../../../../src/app/api/metrics/user-metrics/route.js";
import * as supabaseServer from "../../../../src/utils/Supabase/server.js";

describe("GET /api/metrics/user-metrics", () => {
    let createClientStub;
    let supabaseMock;
    let queryMock;

    const mockRows = [
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

        queryMock.then = (resolve) =>
            resolve({ data: mockRows, error: null });

        createClientStub = sinon
            .stub(supabaseServer, "createClient")
            .resolves(supabaseMock);
    });

    afterEach(() => {
        sinon.restore();
    });

    it("returns 401 when unauthorized", async () => {
        supabaseMock.auth.getUser.resolves({
            data: { user: null },
            error: null,
        });

        const req = { url: "http://localhost/api/metrics/user-metrics" };
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(401);
        expect(body.error).to.equal("Unauthorized");
    });

    it("groups metrics per user", async () => {
        const req = { url: "http://localhost/api/metrics/user-metrics" };

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body).to.be.an("array");

        const user1 = body.find(u => u.user_id === "user-1");
        expect(user1.total_requests).to.equal(10);
        expect(user1.total_post).to.equal(3);
        expect(user1.start_date).to.equal("2024-02-01");
        expect(user1.end_date).to.equal("2024-02-02");
    });

    it("filters by start and end date", async () => {
        const req = {
            url: "http://localhost/api/metrics/user-metrics?start_date=2024-02-02&end_date=2024-02-02",
        };

        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(200);
        expect(body.length).to.be.greaterThan(0);
    });

    it("returns 500 on DB error", async () => {
        queryMock.then = (resolve) =>
            resolve({ data: null, error: { message: "DB crash" } });

        const req = { url: "http://localhost/api/metrics/user-metrics" };
        const res = await GET(req);
        const body = await res.json();

        expect(res.status).to.equal(500);
        expect(body.error).to.equal("DB crash");
    });
});