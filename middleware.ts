import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: [
    "/home/:path*",
    "/garage/:path*",
    "/stations/:path*",
    "/calculator/:path*",
    "/trip/:path*",
    "/sessions/:path*",
    "/link-session/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/admin/:path*",
  ],
};
