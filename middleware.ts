import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    const preflight = new NextResponse(null, { status: 204 });
    preflight.headers.set("Access-Control-Allow-Origin", "*"); // Or your Netlify URL
    preflight.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    preflight.headers.set("Access-Control-Allow-Headers", "Content-Type");
    preflight.headers.set("Access-Control-Max-Age", "86400");
    return preflight;
  }

  const res = NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "*"); // Or your Netlify URL
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");

  return res;
}

export const config = {
  matcher: "/api/:path*", // applies to all API routes
};
