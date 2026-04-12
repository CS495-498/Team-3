import LoginPageClient from "./LoginPageClient";

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const error = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;

  return <LoginPageClient initialError={error} />;
}
