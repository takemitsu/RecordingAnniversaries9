import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 認証が必要なパス
const protectedPaths = ["/dashboard", "/entities", "/days"];

// 認証済みユーザーがアクセスできないパス
const authPaths = ["/auth/signin", "/auth/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  const isProtectedPath = protectedPaths.some((path) =>
    nextUrl.pathname.startsWith(path)
  );
  const isAuthPath = authPaths.some((path) => nextUrl.pathname.startsWith(path));

  // 認証が必要なパスに未認証でアクセス
  if (isProtectedPath && !isAuthenticated) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // 認証済みユーザーが認証ページにアクセス
  if (isAuthPath && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

// Proxyを適用するパス
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
