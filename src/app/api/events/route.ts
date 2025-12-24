import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySummitToken } from "@/lib/auth";
import { makeEventSlug } from "@/lib/slug";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mine = url.searchParams.get("mine");

  if (mine === "1" || mine === "true") {
    try {
      const payload = await verifySummitToken(req.headers.get("Authorization"));
      const events = await db.event.findMany({
        where: { organizerId: payload.userId },
        orderBy: { startAt: "desc" },
        include: {
          tickets: true,
          _count: { select: { attendees: true } },
        },
      });
      return NextResponse.json({ status: 200, slug: "ok", events });
    } catch {
      return NextResponse.json({ status: 401, slug: "unauthorized", message: "Unauthorized" });
    }
  }

  const events = await db.event.findMany({
    orderBy: { startAt: "desc" },
    take: 20,
    include: {
      tickets: true,
      organizer: { select: { id: true, username: true, piUsername: true, imageUrl: true } },
      _count: { select: { attendees: true } },
    },
  });

  return NextResponse.json({ status: 200, slug: "ok", events });
}

export async function POST(req: Request) {
  try {
    const payload = await verifySummitToken(req.headers.get("Authorization"));
    const body = await req.json();

    const title: string = body?.title;
    const description: string | undefined = body?.description;
    const coverImageUrl: string | undefined = body?.coverImageUrl;
    const timezone: string | undefined = body?.timezone;
    const startAt = body?.startAt ? new Date(body.startAt) : null;
    const endAt = body?.endAt ? new Date(body.endAt) : null;
    const location: string | undefined = body?.location;
    const capacity: number | undefined = body?.capacity;
    const requireApproval: boolean = Boolean(body?.requireApproval);

    const isPaid: boolean = Boolean(body?.isPaid);
    const pricePi: number = Number(body?.pricePi ?? 0);
    const ticketName: string = body?.ticketName || "General Admission";

    if (!title || !startAt || !endAt) {
      return NextResponse.json({ status: 400, slug: "missing-fields", message: "Missing title/startAt/endAt" });
    }

    if (endAt.getTime() <= startAt.getTime()) {
      return NextResponse.json({ status: 400, slug: "invalid-dates", message: "endAt must be after startAt" });
    }

    if (isPaid && (!pricePi || pricePi <= 0)) {
      return NextResponse.json({ status: 400, slug: "invalid-price", message: "pricePi must be > 0" });
    }

    const slug = makeEventSlug(title);

    const event = await db.event.create({
      data: {
        slug,
        title,
        description,
        coverImageUrl,
        timezone: timezone || "UTC",
        startAt,
        endAt,
        location,
        capacity: typeof capacity === "number" ? capacity : 0,
        requireApproval,
        organizerId: payload.userId,
        tickets: {
          create: {
            name: ticketName,
            pricePi: isPaid ? pricePi : 0,
            currency: "PI",
            capacity: typeof capacity === "number" ? capacity : 0,
          },
        },
      },
      include: { tickets: true },
    });

    return NextResponse.json({ status: 200, slug: "event-created", event });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ status: 500, slug: "server-error", message: err?.message || "Internal server error" });
  }
}
