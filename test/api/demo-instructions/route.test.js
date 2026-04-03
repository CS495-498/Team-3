import { expect } from "chai";
import sinon from "sinon";
import { NextResponse } from "next/server";
import {
    handleDELETE,
    handlePOST,
} from "../../../src/app/api/demo-instructions/route.js";

describe("/api/demo-instructions route handlers", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("POST returns auth error response when unauthenticated", async () => {
        const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const response = await handlePOST(
            { json: async () => ({ title: "A", html: "<p>x</p>" }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: unauthorized }),
                fetchFn: fetchStub,
            }
        );

        expect(response).to.equal(unauthorized);
        expect(fetchStub.called).to.be.false;
    });

    it("POST returns 400 when title or html is missing", async () => {
        const response = await handlePOST(
            { json: async () => ({ title: "", html: "" }) },
            {
                requireAuthWithPermissionFn: async () => ({
                    error: null,
                    profile: { full_name: "contentstack" },
                }),
                sanitizeHtmlServerFn: () => "",
                fetchFn: fetchStub,
            }
        );

        expect(response.status).to.equal(400);
        expect(await response.json()).to.deep.equal({ error: "Missing title or HTML" });
        expect(fetchStub.called).to.be.false;
    });

    it("DELETE returns forbidden response when permission check fails", async () => {
        const forbidden = NextResponse.json(
            { error: "Forbidden: insufficient permissions" },
            { status: 403 }
        );

        const response = await handleDELETE(
            { json: async () => ({ instructionUid: "abc" }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: forbidden }),
                fetchFn: fetchStub,
            }
        );

        expect(response).to.equal(forbidden);
        expect(fetchStub.called).to.be.false;
    });

    it("DELETE returns 400 when instructionUid is missing", async () => {
        const response = await handleDELETE(
            { json: async () => ({}) },
            {
                requireAuthWithPermissionFn: async () => ({ error: null }),
                fetchFn: fetchStub,
            }
        );

        expect(response.status).to.equal(400);
        expect(await response.json()).to.deep.equal({ error: "Missing instructionUid" });
        expect(fetchStub.called).to.be.false;
    });
});
