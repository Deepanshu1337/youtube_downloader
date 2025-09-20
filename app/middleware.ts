import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Allow requests from your frontend (or "*" for all)
  const allowedOrigin = process.env.NEXT_PUBLIC_ALLOWED_ORIGIN || "https://youtubedownloaderd1.netlify.app"; // Use env variable
  res.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE"); // Add PUT and DELETE
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization"); // Add Authorization
  res.headers.set("Access-Control-Allow-Credentials", "true"); // Allow credentials


  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new NextResponse(null, { status: 204, headers: res.headers });
  }

  return res;
}

// Apply middleware to all routes - REMOVE MATCHER
// export const config = {
//   matcher: "/api/:path*",
// };
