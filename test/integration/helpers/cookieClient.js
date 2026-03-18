import { CookieJar } from "tough-cookie";
import makeFetchCookie from "fetch-cookie";

export function createCookieClient() {
    const jar = new CookieJar();
    const fetchWithCookies = makeFetchCookie(fetch, jar);

    return {
        jar,
        async request(url, { method = "GET", headers = {}, body } = {}) {
            const res = await fetchWithCookies(url, {
                method,
                headers: { "Content-Type": "application/json", ...headers },
                body: body ? JSON.stringify(body) : undefined,
                redirect: "manual",
            });

            const text = await res.text();
            let json = null;
            try { json = text ? JSON.parse(text) : null; } catch { }

            return { status: res.status, headers: res.headers, text, json };
        },
    };
}
