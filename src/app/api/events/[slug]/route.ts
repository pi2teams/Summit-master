import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_req: Request, ctx: { params: { slug: string } }) {
  const { slug } = ctx.params;

  const event = await db.event.findUnique({
    where: { slug },
    include: {
      tickets: true,
      organizer: { select: { id: true, username: true, piUsername: true, imageUrl: true } },
      _count: { select: { attendees: true } },
    },
  });

  if (!event) {
    return NextResponse.json({ status: 404, slug: "not-found", message: "Event not found" });
  }

  return NextResponse.json({ status: 200, slug: "ok", event });
}
