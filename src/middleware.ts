import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // DESHABILITADO: Usar layouts en su lugar para validar sesión
  // El middleware con getToken() en Edge Runtime causa problemas de redirection loop en Vercel
  // si AUTH_SECRET no está configurado correctamente
  return NextResponse.next();
}

export const config = {
  matcher: ["/orders/:path*", "/profile/:path*", "/checkout/:path*", "/admin/:path*"],
};