export const SITE_NAME = "CNC Roraima";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://cnc-roraima.vercel.app"
).replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, SITE_URL).toString();
}
