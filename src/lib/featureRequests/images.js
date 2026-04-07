export function buildFeatureRequestImageUrl(filePath) {
    const normalizedPath = String(filePath || "")
        .split("/")
        .filter(Boolean)
        .map((segment) => encodeURIComponent(segment))
        .join("/");

    return `/api/feature-requests/images/${normalizedPath}`;
}

export function decodeFeatureRequestImagePath(pathSegments = []) {
    return pathSegments.map((segment) => decodeURIComponent(segment)).join("/");
}
