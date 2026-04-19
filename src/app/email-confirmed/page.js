export default function EmailConfirmedPage() {
    return (
        <main className="min-h-screen bg-[#f7f1ea] px-6 py-16 text-[#2f241d]">
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-[#d9c6b6] bg-white px-8 py-12 text-center shadow-sm">
                <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[#88563b]">
                    Account Verified
                </p>
                <h1 className="mb-4 text-3xl font-bold">
                    Your email has been confirmed
                </h1>
                <p className="mb-8 text-base leading-7 text-[#5b4639]">
                    Your account is ready. Head to the login page and sign in
                    with the password you created during signup.
                </p>
                <a
                    href="/login"
                    className="rounded-md bg-[#88563b] px-6 py-3 font-semibold text-white transition hover:bg-[#714830]"
                >
                    Go to Login
                </a>
            </div>
        </main>
    )
}
