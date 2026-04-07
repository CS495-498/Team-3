import { expect } from "chai";

import {
    buildFeatureRequestImageUrl,
    decodeFeatureRequestImagePath,
} from "../../src/lib/featureRequests/images.js";
import { sanitizeHtmlServer } from "../../src/lib/featureRequests/requests/sanitizeHtmlServer.js";

describe("feature request embedded images", () => {
    it("builds a stable app URL for embedded feature request images", () => {
        const src = buildFeatureRequestImageUrl("embedded/folder name/image file.png");

        expect(src).to.equal(
            "/api/feature-requests/images/embedded/folder%20name/image%20file.png"
        );
    });

    it("decodes route params back into the original storage path", () => {
        const path = decodeFeatureRequestImagePath([
            "embedded",
            "folder%20name",
            "image%20file.png",
        ]);

        expect(path).to.equal("embedded/folder name/image file.png");
    });

    it("keeps safe embedded images while stripping unsafe markup", () => {
        const sanitized = sanitizeHtmlServer(
            '<p>Hello</p><img src="/api/feature-requests/images/embedded/test.png" alt="diagram"><script>alert(1)</script>'
        );

        expect(sanitized).to.include(
            '<img src="/api/feature-requests/images/embedded/test.png" alt="diagram">'
        );
        expect(sanitized).to.not.include("<script>");
    });

    it("removes images with unsafe URI schemes", () => {
        const sanitized = sanitizeHtmlServer(
            '<img src="javascript:alert(1)" alt="bad">'
        );

        expect(sanitized).to.not.include("<img");
    });
});
