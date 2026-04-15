import LoginPageClient from "./LoginPageClient";

export default async function LoginPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;

  const error = Array.isArray(resolvedSearchParams?.error)
    ? resolvedSearchParams.error[0]
    : resolvedSearchParams?.error;

  const confirmed = resolvedSearchParams?.confirmed === '1';

  return <LoginPageClient initialError={error} confirmed={confirmed} />;
}