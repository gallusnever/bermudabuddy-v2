import { cookies } from "next/headers";

export function authSatisfied(): boolean {
  // Only allow bypass in non-production with explicit flag + cookie.
  if (process.env.NODE_ENV !== "production" &&
      process.env.NEXT_PUBLIC_E2E_AUTH_BYPASS === "1") {
    const c = cookies().get("bb_e2e")?.value;
    if (c === "1") return true;
  }
  // Fallback: your real session check. If you already have one, call it here.
  // Example (pseudo):
  // return Boolean(await getSession());
  return false;
}