export default function appendNotification(entry, newAlert) {
    const existingAlerts = Array.isArray(entry?.alerts) ? entry.alerts : [];

    // Create fresh objects
    const simplifiedAlerts = existingAlerts.map(alert => ({
        alert_title: alert.alert_title,
        alert_description: alert.alert_description,
        start_time: alert.start_time,
        end_time: alert.end_time,
        critical_value: alert.critical_value,
    }));

    return [...simplifiedAlerts, { ...newAlert }]; // append new alert
}
