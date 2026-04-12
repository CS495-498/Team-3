import { expect } from "chai";
import { NextResponse } from "next/server";
import { handleDelete, handlePut } from "../../../src/app/api/update-demo-web-in-cs/route.js";

describe("/api/update-demo-web-in-cs route handlers", () => {
    it("PUT returns auth error response when unauthenticated", async () => {
        const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const response = await handlePut(
            { json: async () => ({ entryUid: "x", demos: [] }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: unauthorized }),
            }
        );

        expect(response).to.equal(unauthorized);
    });

    it("PUT forwards helper result for invalid payloads", async () => {
        const response = await handlePut(
            { json: async () => ({}) },
            {
                requireAuthWithPermissionFn: async () => ({ error: null }),
                updateAndPublishDemoWebFn: async () => ({ status: 422, error: "Missing entryUid" }),
            }
        );

        expect(response.status).to.equal(422);
        expect(await response.json()).to.deep.equal({
            status: 422,
            error: "Missing entryUid",
        });
    });

    it("DELETE returns forbidden response when permission check fails", async () => {
        const forbidden = NextResponse.json(
            { error: "Forbidden: insufficient permissions" },
            { status: 403 }
        );

        const response = await handleDelete(
            { json: async () => ({ entryUid: "x", demos: [] }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: forbidden }),
            }
        );

        expect(response).to.equal(forbidden);
    });

    it("DELETE forwards helper validation errors without calling external services", async () => {
        const response = await handleDelete(
            { json: async () => ({}) },
            {
                requireAuthWithPermissionFn: async () => ({ error: null }),
                deleteDemoWebFn: async () => ({ status: 422, error: "Missing entryUid" }),
            }
        );

        expect(response.status).to.equal(422);
        expect(await response.json()).to.deep.equal({
            status: 422,
            error: "Missing entryUid",
        });
    });
});
