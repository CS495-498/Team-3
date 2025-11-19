import { expect } from "chai";
import sinon from "sinon";
import { updateAndPublishDemoWeb } from "../../src/app/api/update-demo-web-in-cs/updateAndPublishDemoWeb.js";

describe("updateAndPublishDemoWeb()", () => {
  let fetchStub;

  const mockDemo = {
    link: {
      title: "NY Times Wordle",
      href: "https://www.nytimes.com/games/wordle/index.html",
    },
    image: {
      uid: "blt34734a6301e96e84",
      content_type: "image/jpeg",
      url: "https://images.contentstack.io/...",
    },
    title: "Wordle",
    description: "Wordle - A daily word game.",
    _metadata: { uid: "cs123" }
  };

  beforeEach(() => {
    fetchStub = sinon.stub();
  });

  afterEach(() => {
    sinon.restore();
  });

  it("updates and publishes successfully", async () => {
    // Mock UPDATE
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () =>
        JSON.stringify({
          entry: {
            demos: [mockDemo], 
          },
        }),
    });

    // Mock PUBLISH
    fetchStub.onCall(1).resolves({
      ok: true,
      text: async () => JSON.stringify({ published: true }),
    });

    const result = await updateAndPublishDemoWeb("entry123", [mockDemo], fetchStub);

    expect(result.status).to.equal(200);
    expect(result.entry.demos).to.be.an("array");
    expect(result.entry.demos[0].title).to.equal("Wordle");
    expect(result.entry.demos[0].link.href).to.equal("https://www.nytimes.com/games/wordle/index.html");
    expect(result.entry.demos[0].image.uid).to.equal("blt34734a6301e96e84");
    expect(fetchStub.calledTwice).to.be.true;
  });

  it("returns error when update fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: false,
      text: async () => "Update failed",
    });

    const result = await updateAndPublishDemoWeb("entry123", [mockDemo], fetchStub);

    expect(result.status).to.not.equal(200);
    expect(result.error).to.equal("Update failed");
    expect(fetchStub.calledOnce).to.be.true;
  });

  it("returns error when publish fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () =>
        JSON.stringify({
          entry: {
            demos: [mockDemo],   // 🔥 no uid
          },
        }),
    });

    fetchStub.onCall(1).resolves({
      ok: false,
      text: async () => "Publish failed",
    });

    const result = await updateAndPublishDemoWeb("entry123", [mockDemo], fetchStub);

    expect(result.status).to.not.equal(200);
    expect(result.error).to.equal("Publish failed");
    expect(result.details).to.equal("Publish failed");
    expect(fetchStub.calledTwice).to.be.true;
  });

  it("returns 500 if exception thrown", async () => {
    fetchStub.throws(new Error("Unexpected crash"));

    const result = await updateAndPublishDemoWeb("entry123", [mockDemo], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Unexpected crash");
  });
});
