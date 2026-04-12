import dotenv from "dotenv";
dotenv.config({ path: ".env.test" });

const req = (k) => {
    const v = process.env[k];
    if (!v) throw new Error(`Missing env var: ${k}`);
    return v;
};

export const config = {
    baseUrl: req("TEST_BASE_URL"),
    users: {
        partner: req("TEST_PARTNER_EMAIL"),
        contentstack: req("TEST_CONTENTSTACK_EMAIL"),
        admin: req("TEST_ADMIN_EMAIL"),
    },
    password: req("TEST_USER_PASSWORD"),
};
