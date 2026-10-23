import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// What a signed-out visitor can open: the landing page, sign-in and sign-up.
// Every other address sends them to sign-in, and back to it afterwards.
const isPublic = createRouteMatcher(["/", "/sign-in(.*)", "/sign-up(.*)"]);

export default clerkMiddleware(
  async (auth, request) => {
    if (!isPublic(request)) await auth.protect();
  },
  { signInUrl: "/sign-in", signUpUrl: "/sign-up" },
);

export const config = {
  matcher: [
    // Every page, but not Next.js internals or static files (icons, fonts, images).
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always API routes.
    "/(api|trpc)(.*)",
  ],
};
