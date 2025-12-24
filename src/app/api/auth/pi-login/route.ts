import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { piGetMe } from "@/lib/pi";
import { signSummitToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken: string | undefined = body?.accessToken;

    if (!accessToken) {
      return NextResponse.json({
        status: 400,
        slug: "missing-access-token",
        message: "Missing accessToken",
      });
    }

    const me = await piGetMe(accessToken);
    const piUid = me.uid;
    const piUsername = me.username;

    // Prefer to keep `User.username` free for user customization.
    // We store Pi identity separately.
    const user = await db.user.upsert({
      where: { piUid },
      create: {
        piUid,
        piUsername,
        authSource: "pi",
        verified: true,
      },
      update: {
        piUsername,
        authSource: "pi",
        verified: true,
      },
    });

    const token = await signSummitToken({
      userId: user.id,
      piUid: user.piUid ?? piUid,
      piUsername: user.piUsername ?? piUsername,
    });

    const needsOnboarding = !user.username;

    return NextResponse.json({
      status: 200,
      slug: "pi-login-ok",
      token,
      user: {
        id: user.id,
        username: user.username,
        piUsername: user.piUsername,
        imageUrl: user.imageUrl,
      },
      needsOnboarding,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({
      status: 500,
      slug: "server-error",
      message: err?.message || "Internal server error",
    });
  }
}
