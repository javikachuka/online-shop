import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Defense-in-depth: block external requests carrying internal Next.js headers.
  const hasMiddlewareSubrequestHeader = req.headers.has("x-middleware-subrequest");
  const hasNextResumeHeader = req.headers.has("next-resume");

  if (hasMiddlewareSubrequestHeader || hasNextResumeHeader) {
    return NextResponse.json({ error: "Invalid request headers" }, { status: 400 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};