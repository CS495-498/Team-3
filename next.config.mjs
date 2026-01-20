/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  devIndicators: false,
  images: {
    domains: ["images.contentstack.io"],
    qualities: [75, 100],
  },
  env: {
    CONTENTSTACK_API_KEY: process.env.CONTENTSTACK_API_KEY,
    CONTENTSTACK_DELIVERY_TOKEN: process.env.CONTENTSTACK_DELIVERY_TOKEN,
    CONTENTSTACK_ENVIRONMENT: process.env.CONTENTSTACK_ENVIRONMENT,
    CONTENTSTACK_PREVIEW_TOKEN: process.env.CONTENTSTACK_PREVIEW_TOKEN,
    CONTENTSTACK_REGION: process.env.CONTENTSTACK_REGION,
    CONTENTSTACK_PERSONALIZATION: process.env.CONTENTSTACK_PERSONALIZATION,
    CONTENTSTACK_BRANCH: process.env.CONTENTSTACK_BRANCH,
    LYTICS_TAG: process.env.LYTICS_TAG,
    CONTENTSTACK_PERSONALIZE_PROJECT_UID: process.env.CONTENTSTACK_PERSONALIZE_PROJECT_UID,
    CONTENTSTACK_PERSONALIZE_EDGE_API_URL: process.env.CONTENTSTACK_PERSONALIZE_EDGE_API_URL,
  },

  // ✅ Add this section for large file uploads
  experimental: {
    middlewareClientMaxBodySize: 25 * 1024 * 1024, // 25MB
  },
  api: {
    bodyParser: {
      sizeLimit: "25mb", // for JSON payloads
    },
  },
};

export default nextConfig;
