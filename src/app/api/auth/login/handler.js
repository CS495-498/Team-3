// src/app/api/public/login/handler.js

export function loginHandler({ signInWithPassword }) {
    return async function handler({ email, password }) {
        try {
            // Basic input guard (keeps tests fast + avoids calling Supabase on blanks)
            if (!email || !email.trim() || !password || !password.trim()) {
                return {
                    status: 400,
                    body: { error: 'Email and password are required' },
                }
            }

            const { data, error } = await signInWithPassword({
                email,
                password,
            })

            if (error) {
                return {
                    status: 401,
                    body: { error: error.message },
                }
            }

            return {
                status: 200,
                body: {
                    success: true,
                    session: data?.session ?? null,
                    user: data?.user ?? null,
                },
            }
        } catch (err) {
            return {
                status: 500,
                body: { error: err?.message || 'Internal server error' },
            }
        }
    }
}
