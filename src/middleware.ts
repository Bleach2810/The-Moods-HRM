import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const host = request.headers.get("host") || "";

  // Bỏ qua các tệp tĩnh, hình ảnh, favicon và API
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/api") ||
    url.pathname.startsWith("/favicon.ico") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const hostname = host.split(":")[0];
  const parts = hostname.split(".");

  // Ví dụ: app.themoods.vn -> subdomain là "app"
  // app.localhost -> subdomain là "app"
  let subdomain = "";
  if (hostname.endsWith(".localhost")) {
    subdomain = hostname.replace(".localhost", "");
  } else {
    subdomain = parts.length > 2 ? parts[0] : "";
  }

  if (subdomain === "api") {
    return NextResponse.next();
  }

  if (subdomain === "app") {
    url.pathname = `/customer-site${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  if (subdomain === "admin") {
    url.pathname = `/admin-site${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js).*)"],
};
