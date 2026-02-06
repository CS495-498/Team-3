export function signupHandler({ signUp }) {
    return async function handler({ email, password }) {
        try {
            // Guard against blank input
            if (!email || !email.trim() || !password || !password.trim()) {
                return {
                    status: 400,
                    body: { error: 'Email and password are required' },
                }
            }

            const { error } = await signUp({ email, password })

            if (error) {
                return {
                    status: 400,
                    body: { error: error.message },
                }
            }

            return {
                status: 200,
                body: { success: true },
            }
        } catch {
            return {
                status: 500,
                body: { error: 'Internal server error' },
            }
        }
    }
}
