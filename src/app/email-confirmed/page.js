export default function EmailConfirmedPage() {
    return (
        <main className="flex min-h-screen w-screen bg-white dark:bg-gray-900">
            <section className="relative flex w-full items-center justify-center px-10 py-16 bg-white dark:bg-gray-900 md:w-1/2">
                <div className="w-full max-w-sm">
                    <p className="mb-3 text-center text-sm font-semibold uppercase tracking-[0.2em] text-[#88563b]">
                        Account Verified
                    </p>
                    <h1 className="mb-4 text-center text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Your email has been confirmed
                    </h1>
                    <p className="mb-8 text-center text-sm text-gray-600 dark:text-gray-300">
                        Your account is ready. Sign in with the email and
                        password you used during signup.
                    </p>

                    <div className="rounded-md border border-[#d8c3b3] bg-[#fcf8f5] px-4 py-4 text-sm text-[#714830]">
                        You can head straight to login now. If this page opened
                        after a long delay, your confirmation still went through
                        successfully.
                    </div>

                    <a
                        href="/login"
                        className="mt-6 block w-full rounded-md bg-[#88563b] py-2 text-center font-semibold text-white transition hover:bg-[#714830]"
                    >
                        Go to Login
                    </a>
                </div>
            </section>

            <section className="hidden h-screen w-1/2 md:block">
                <img
                    src="/red_panda_face.jpg"
                    alt="Red Panda"
                    className="h-full w-full object-cover"
                />
            </section>
        </main>
    )
}
