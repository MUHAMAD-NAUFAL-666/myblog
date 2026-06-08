import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - /api, /trpc, /_next, /_vercel
  // - any path containing a dot (static assets, e.g. favicon.ico, .svg, .png)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
