import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtmlServer(html) {
    return DOMPurify.sanitize(String(html || ""), {
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed"],
        FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover"],
    });
}
