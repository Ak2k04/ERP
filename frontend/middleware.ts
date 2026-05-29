import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isPublicRoute = nextUrl.pathname.startsWith("/auth");
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard");

  if (isApiAuthRoute) return NextResponse.next();

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && isDashboardRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // Role-based protection
  if (isLoggedIn && isDashboardRoute) {
    const userRole = (req.auth?.user as any)?.role;
    const userDept = (req.auth?.user as any)?.department;
    const userStatus = (req.auth?.user as any)?.status;

    // Optional: Block if not ACTIVE (uncomment if status is strictly enforced)
    // if (userStatus !== "ACTIVE" && nextUrl.pathname !== "/auth/pending") {
    //   return NextResponse.redirect(new URL("/auth/pending", nextUrl));
    // }

    if (nextUrl.pathname.startsWith("/dashboard/admin") && userRole !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (nextUrl.pathname.startsWith("/dashboard/production") && userRole !== "SUPER_ADMIN" && userDept !== "PRODUCTION") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }

    if (nextUrl.pathname.startsWith("/dashboard/stores") && userRole !== "SUPER_ADMIN" && userDept !== "STORES") {
      return NextResponse.redirect(new URL("/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
