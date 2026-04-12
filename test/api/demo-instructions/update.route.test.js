import { expect } from "chai";
import sinon from "sinon";
import { NextResponse } from "next/server";
import { handlePOST } from "../../../src/app/api/demo-instructions/update/route.js";

describe("/api/demo-instructions/update route handler", () => {
    let fetchStub;

    beforeEach(() => {
        fetchStub = sinon.stub();
    });

    afterEach(() => {
        sinon.restore();
    });

    it("returns auth error response when unauthenticated", async () => {
        const unauthorized = NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const response = await handlePOST(
            { json: async () => ({ uid: "abc", title: "T", html: "<p>x</p>" }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: unauthorized }),
                fetchFn: fetchStub,
            }
        );

        expect(response).to.equal(unauthorized);
        expect(fetchStub.called).to.be.false;
    });

    it("returns 400 when required fields are missing", async () => {
        const response = await handlePOST(
            { json: async () => ({ uid: "", title: "", html: "" }) },
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
        expect(await response.json()).to.deep.equal({
            error: "Missing UID, title, or HTML",
        });
        expect(fetchStub.called).to.be.false;
    });

    it("returns forbidden response when permission check fails", async () => {
        const forbidden = NextResponse.json(
            { error: "Forbidden: insufficient permissions" },
            { status: 403 }
        );

        const response = await handlePOST(
            { json: async () => ({ uid: "abc", title: "T", html: "<p>x</p>" }) },
            {
                requireAuthWithPermissionFn: async () => ({ error: forbidden }),
                fetchFn: fetchStub,
            }
        );

        expect(response).to.equal(forbidden);
        expect(fetchStub.called).to.be.false;
    });
});
