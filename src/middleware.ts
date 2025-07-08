// middleware.ts
import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // skip internal assets
  if (
    pathname.startsWith("/_next") ||
    pathname.includes(".") ||
    pathname === "/favicon.ico"
  ) {
    return;
  }

  const token = request.cookies.get("token");

  if (token) {
    console.log(`✅ Token found: ${token.value}`);
  } else {
    console.log(`❌ No token found. Setting it for 5 seconds...`);

    const response = NextResponse.next();
    response.cookies.set("token", "helloZakk", {
      httpOnly: true,
      maxAge: 5, // 5 seconds
      path: "/",
    });
    return response;
  }

  return NextResponse.next();
}
