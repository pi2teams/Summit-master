import { NextResponse } from "next/server";
import { verifySummitToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const payload = await verifySummitToken(req.headers.get("Authorization"));

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        name: true,
        imageUrl: true,
        piUid: true,
        piUsername: true,
        authSource: true,
      },
    });

    if (!user) {
      return NextResponse.json({ status: 404, slug: "user-not-found", message: "User not found" });
    }

    return NextResponse.json({ status: 200, slug: "ok", user });
  } catch {
    return NextResponse.json({ status: 401, slug: "unauthorized", message: "Unauthorized" });
  }
}
