import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Excluye rutas de metadata (icon, apple-icon, manifest, favicon, robots, sitemap) para
  // que no las capture el enrutado por locale y devuelvan 307→404 en vez del asset.
  matcher: ["/((?!_next|_vercel|api|icon|apple-icon|manifest|favicon|robots|sitemap|.*\\..*).*)"],
};
