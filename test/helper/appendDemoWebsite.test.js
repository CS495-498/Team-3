import { expect } from "chai";
import appendDemoWebsite from "../../src/app/api/helper/appendDemoWebsite.js";

describe("appendDemoWebsite()", () => {
  it("appends a new demo to simplified existing demos", () => {
    const entry = {
      demos: [
        {
          title: "Old Demo",
          description: "Old Desc",
          link: { title: "Link1", href: "http://old.com" },
          image: { uid: "img123" },
          se_name: "old-demo"
        }
      ]
    };

    const newDemo = {
      title: "New Demo",
      description: "New Desc",
      link: { title: "Link2", href: "http://new.com" },
      image: "img999",
      se_name: "new-demo"
    };

    const result = appendDemoWebsite(entry, newDemo);

    expect(result).to.deep.equal([
      {
        title: "Old Demo",
        description: "Old Desc",
        link: { title: "Link1", href: "http://old.com" },
        image: "img123",
        se_name: "old-demo"
      },
      newDemo
    ]);
  });

  it("returns only the new demo if entry has no demos", () => {
    const entry = { demos: null };
    const newDemo = { title: "New Only" };

    const result = appendDemoWebsite(entry, newDemo);

    expect(result).to.deep.equal([newDemo]);
  });
});
