import { expect } from "chai";
import sinon from "sinon";
import { updateAndPublishAlert } from "../../src/app/api/update-alerts-in-cs/updateAndPublishAlert.js";

describe("updateAndPublishAlert()", () => {
  let fetchStub;

  beforeEach(() => {
    fetchStub = sinon.stub(); // DI fetch stub
  });

  // ===================== SUCCESS =====================
  it("updates and publishes alerts successfully", async () => {
    // 1st fetch → UPDATE success
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: { uid: "entry123", alerts: [] } }),
    });

    // 2nd fetch → PUBLISH success
    fetchStub.onCall(1).resolves({
      ok: true,
      text: async () => JSON.stringify({ published: true }),
    });

    const alertsPayload = [
      { alert_title: "Test", start_time: "2025-01-01", end_time: "2025-01-02", critical_value: false }
    ];

    const result = await updateAndPublishAlert("entry123", alertsPayload, fetchStub);

    expect(result.status).to.equal(200);
    expect(result.message).to.equal("Alerts updated and published successfully.");
    expect(result.entry.uid).to.equal("entry123");
  });

  // ===================== UPDATE FAIL =====================
  it("returns error if update fails", async () => {
    fetchStub.onCall(0).resolves({
      ok: false,
      status: 400,
      text: async () => "Bad alerts payload",
    });

    const result = await updateAndPublishAlert("entry123", [], fetchStub);

    expect(result.status).to.equal(400);
    expect(result.error).to.equal("Bad alerts payload");
  });

  // ===================== PUBLISH FAIL =====================
  it("returns error if publish fails", async () => {
    // Update OK
    fetchStub.onCall(0).resolves({
      ok: true,
      text: async () => JSON.stringify({ entry: { uid: "entry123" } }),
    });

    // Publish fails
    fetchStub.onCall(1).resolves({
      ok: false,
      status: 500,
      text: async () => "Publishing error",
    });

    const result = await updateAndPublishAlert("entry123", [], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Publish failed");
    expect(result.details).to.equal("Publishing error");
  });

  // ===================== THROWN EXCEPTION =====================
  it("returns 500 on thrown exception", async () => {
    fetchStub.throws(new Error("Unexpected crash"));

    const result = await updateAndPublishAlert("entry123", [], fetchStub);

    expect(result.status).to.equal(500);
    expect(result.error).to.equal("Unexpected crash");
  });
});
