import { expect } from "chai";
import normalizeDemoWebArray from "../../src/app/api/helper/normalizeDemoWebArray.js";

describe("normalizeDemoWebArray()", () => {

    it("returns an empty array when input is not an array", () => {
        expect(normalizeDemoWebArray(null)).to.deep.equal([]);
        expect(normalizeDemoWebArray(undefined)).to.deep.equal([]);
        expect(normalizeDemoWebArray({})).to.deep.equal([]);
        expect(normalizeDemoWebArray("string")).to.deep.equal([]);
    });

    it("converts image objects into UID strings", () => {
        const input = [
            {
                title: "Demo 1",
                description: "Desc",
                se_name: "demo-1",
                image: { uid: "blt123" },
                link: { title: "Link Title", href: "https://example.com" },
                date_posted: "2025-01-01"
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0].image).to.equal("blt123");
    });

    it("preserves link objects exactly", () => {
        const input = [
            {
                title: "Example",
                description: "Text",
                se_name: "example",
                image: null,
                link: { title: "Some Site", href: "https://site.com" },
                date_posted: "2025-02-01"
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0].link).to.deep.equal({
            title: "Some Site",
            href: "https://site.com"
        });
    });

    it("preserves date_posted when present", () => {
        const input = [
            {
                title: "Demo",
                description: "Desc",
                se_name: "demo",
                image: null,
                link: { title: "T", href: "H" },
                date_posted: "2024-12-31T12:00:00Z"
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0].date_posted).to.equal("2024-12-31T12:00:00Z");
    });

    it("fills missing link/title fields safely", () => {
        const input = [
            {
                title: "Demo",
                description: "",
                se_name: "",
                image: null,
                link: {},
                date_posted: null
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0].link).to.deep.equal({
            title: "",
            href: ""
        });
    });

    it("handles multiple demos and preserves order", () => {
        const input = [
            {
                title: "First",
                description: "One",
                se_name: "first",
                image: { uid: "uid1" },
                link: { title: "A", href: "https://a.com" },
                date_posted: "2025-01-01"
            },
            {
                title: "Second",
                description: "Two",
                se_name: "second",
                image: { uid: "uid2" },
                link: { title: "B", href: "https://b.com" },
                date_posted: "2025-02-01"
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result.length).to.equal(2);
        expect(result[0].title).to.equal("First");
        expect(result[1].title).to.equal("Second");
        expect(result[0].image).to.equal("uid1");
        expect(result[1].image).to.equal("uid2");
    });

    it("removes unexpected fields automatically", () => {
        const input = [
            {
                title: "Demo",
                description: "Test",
                se_name: "demo",
                image: { uid: "uid123" },
                link: { title: "X", href: "Y" },
                date_posted: "2025-03-03",
                randomStuff: "SHOULD_NOT_EXIST",
                nested: { x: 1 },
                booleanFlag: true
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0]).to.not.have.property("randomStuff");
        expect(result[0]).to.not.have.property("nested");
        expect(result[0]).to.not.have.property("booleanFlag");
    });

    it("handles demos with image null or missing image field", () => {
        const input = [
            {
                title: "Demo",
                description: "Desc",
                se_name: "demo",
                image: null,
                link: { title: "L", href: "H" },
                date_posted: "2025-01-01"
            }
        ];

        const result = normalizeDemoWebArray(input);

        expect(result[0]).to.not.have.property("image");

    });
});
