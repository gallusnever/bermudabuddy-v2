import { NextRequest, NextResponse } from "next/server";

export const config = {
  matcher: ["/dashboard/:path*", "/pgr/:path*", "/mix/:path*", "/insights/:path*", "/applications/:path*"],
};

export function middleware(req: NextRequest) {
  // Admin bypass for testing (check for special admin query param or cookie)
  const isAdmin = req.nextUrl.searchParams.get("admin") === "buddy" || 
                  req.cookies.get("bb_admin")?.value === "buddy";
  
  if (isAdmin) {
    // Set admin cookie for session persistence
    const response = NextResponse.next();
    response.cookies.set("bb_admin", "buddy", { maxAge: 60 * 60 * 24 }); // 24 hours
    return response;
  }
  
  // Check if user has completed onboarding
  const onboardingComplete = req.cookies.get("bb_onboarding_complete");
  
  // Gate protected routes by onboarding completion only (client manages auth via Supabase)
  if (!onboardingComplete && !req.url.includes("/onboarding")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  return NextResponse.next();
}
