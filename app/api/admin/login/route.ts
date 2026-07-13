import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { adminSessionCookie, createAdminSessionToken } from "@/lib/admin/session";

function passwordsMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

export async function POST(request: NextRequest) {
  const adminPassword = process.env.AMARO_ADMIN_PASSWORD;
  const sessionSecret = process.env.AMARO_ADMIN_SESSION_SECRET;

  if (!adminPassword || !sessionSecret) {
    return NextResponse.json(
      { message: "O acesso administrativo ainda não foi configurado." },
      { status: 503 }
    );
  }

  let password = "";
  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ message: "Requisição inválida." }, { status: 400 });
  }

  if (!passwordsMatch(password, adminPassword)) {
    return NextResponse.json(
      { message: "Senha incorreta. Verifique e tente novamente." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: adminSessionCookie.name,
    value: await createAdminSessionToken(sessionSecret),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: adminSessionCookie.maxAge,
  });
  return response;
}
