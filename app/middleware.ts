import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Allow requests from your frontend (or "*" for all)
res.headers.set("Access-Control-Allow-Origin", "https://youtubedownloaderd1.netlify.app");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

// Apply middleware to all API routes
export const config = {
  matcher: "/api/:path*",
};
