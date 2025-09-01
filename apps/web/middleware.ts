import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*", "/pgr/:path*", "/mix/:path*", "/insights/:path*", "/applications/:path*"],
};

export function middleware(req: NextRequest) {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const isAdmin = req.nextUrl.searchParams.get("admin") === "buddy" ||
                    req.cookies.get("bb_admin")?.value === "buddy";
    if (isAdmin) {
      const response = NextResponse.next();
      response.cookies.set("bb_admin", "buddy", { maxAge: 60 * 60 * 24 });
      return response;
    }
  }
  const onboardingComplete = req.cookies.get("bb_onboarding_complete");
  if (!onboardingComplete && !req.url.includes("/onboarding") && !req.url.includes("/login")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.next();
}
