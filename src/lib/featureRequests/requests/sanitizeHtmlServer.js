import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtmlServer(html) {
    return DOMPurify.sanitize(String(html || ""), {
        USE_PROFILES: { html: true },

        ALLOWED_TAGS: [
            "p", "br", "b", "strong", "i", "em", "u",
            "ul", "ol", "li",
            "blockquote",
            "code", "pre",
            "a",
            "h1", "h2", "h3", "h4", "h5", "h6"
        ],

        ALLOWED_ATTR: [
            "href",
            "title",
            "target",
            "rel"
        ],

        FORBID_TAGS: [
            "style",
            "script",
            "iframe",
            "object",
            "embed",
            "form",
            "input",
            "button",
            "textarea",
            "select",
            "svg",
            "math"
        ],

        FORBID_ATTR: [
            "style",
            "srcset",
            "formaction",
            "xlink:href"
        ],

        // Block data: and javascript: URIs
        ALLOWED_URI_REGEXP: /^(https?|mailto):/i,

        // Prevent DOM clobbering
        SANITIZE_DOM: true,

        // Prevent template injection edge cases
        SAFE_FOR_TEMPLATES: true,

        // Drop unknown attributes entirely
        KEEP_CONTENT: false,

        // Return plain HTML
        RETURN_DOM: false
    });
}