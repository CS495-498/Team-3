import { expect } from "chai";
import appendNotification from "../../src/app/api/helper/appendNotification.js";

describe("appendNotification()", () => {
    
    it("returns only the new alert when entry has no alerts", () => {
        const newAlert = {
        alert_title: "System Down",
        alert_description: "Database unavailable",
        start_time: "2025-01-01T10:00:00Z",
        end_time: "2025-01-01T12:00:00Z",
        critical_value: true,
        };

        const result = appendNotification({}, newAlert);

        expect(result).to.have.length(1);
        expect(result[0]).to.deep.equal(newAlert);
    });

    it("normalizes existing alerts and appends the new one", () => {
        const entry = {
        alerts: [
            {
            alert_title: "Scheduled Maintenance",
            alert_description: "Servers will be down",
            start_time: "2025-02-10T02:00:00Z",
            end_time: "2025-02-10T03:00:00Z",
            critical_value: false,
            extra_junk_field: "IGNORE_ME",
            nested: { ignore: true },
            },
        ],
        };

        const newAlert = {
        alert_title: "New Outage",
        alert_description: "API is timing out",
        start_time: "2025-03-01T04:00:00Z",
        end_time: "2025-03-01T04:30:00Z",
        critical_value: true,
        };

        const result = appendNotification(entry, newAlert);

        expect(result).to.have.length(2);

        // Existing alert normalized (junk removed)
        expect(result[0]).to.deep.equal({
        alert_title: "Scheduled Maintenance",
        alert_description: "Servers will be down",
        start_time: "2025-02-10T02:00:00Z",
        end_time: "2025-02-10T03:00:00Z",
        critical_value: false,
        });

        // New alert appended as-is
        expect(result[1]).to.deep.equal(newAlert);
    });

    it("handles invalid or non-array alerts gracefully", () => {
        const newAlert = {
        alert_title: "Edge Case Test",
        alert_description: "Testing null alerts",
        start_time: "2025-01-01",
        end_time: "2025-01-02",
        critical_value: false,
        };

        const result = appendNotification({ alerts: null }, newAlert);

        expect(result).to.have.length(1);
        expect(result[0]).to.deep.equal(newAlert);
    });

    it("does not mutate the original entry or existing alerts", () => {
        const entry = {
        alerts: [
            {
            alert_title: "Old Alert",
            alert_description: "Desc",
            start_time: "2025-01-01",
            end_time: "2025-01-02",
            critical_value: false,
            },
        ],
        };

        const newAlert = {
        alert_title: "New Alert",
        alert_description: "More Desc",
        start_time: "2025-02-01",
        end_time: "2025-02-02",
        critical_value: true,
        };

        const originalCopy = JSON.parse(JSON.stringify(entry));

        appendNotification(entry, newAlert);

        expect(entry).to.deep.equal(originalCopy); // input not mutated
    });
});
