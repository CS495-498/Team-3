import { expect } from "chai";
import { getDemoWebsiteEntry } from "../../src/app/(with-sidebar)/demo-websites/getDemoWebsiteEntry.js";

describe("getDemoWebsiteEntry()", () => {
    it("loads the custom_demos entry with demos references", async () => {
        const expectedEntry = {
            uid: "entry-123",
            title: "Demo Websites",
            demos: [{ title: "Wordle" }],
        };

        const stack = {
            async getElementByTypeWithRefs(type, locale, references) {
                expect(type).to.equal("custom_demos");
                expect(locale).to.equal("en-us");
                expect(references).to.deep.equal(["demos"]);
                return [[expectedEntry]];
            },
        };

        const result = await getDemoWebsiteEntry(stack);

        expect(result).to.deep.equal(expectedEntry);
    });

    it("returns an empty object when Contentstack returns no entries", async () => {
        const stack = {
            async getElementByTypeWithRefs() {
                return [];
            },
        };

        const result = await getDemoWebsiteEntry(stack);

        expect(result).to.deep.equal({});
    });
});
