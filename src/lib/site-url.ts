export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  const deployment = process.env.VERCEL_URL?.trim();

  let url = explicit || production || deployment || "http://localhost:3000";

  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url.replace(/\/$/, "");
}
