import { NextResponse } from "next/server";
import { verifySummitToken } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const payload = await verifySummitToken(req.headers.get("Authorization"));
    const { eventId } = await params;
    const body = await req.json().catch(() => ({}));
    const ticketTypeId: string | undefined = body?.ticketTypeId;

    const event = await db.event.findUnique({ where: { id: eventId }, include: { tickets: true } });
    if (!event) {
      return NextResponse.json({ status: 404, slug: "not-found", message: "Event not found" });
    }

    const ticket = ticketTypeId ? event.tickets.find((t) => t.id === ticketTypeId) : event.tickets[0];
    if (!ticket) {
      return NextResponse.json({ status: 400, slug: "invalid-ticket", message: "Invalid ticket type" });
    }

    if ((ticket.pricePi ?? 0) > 0) {
      return NextResponse.json({ status: 400, slug: "paid-ticket", message: "This ticket requires Pi payment" });
    }

    const attendee = await db.attendee.upsert({
      where: { eventId_userId: { eventId: event.id, userId: payload.userId } },
      create: {
        eventId: event.id,
        userId: payload.userId,
        ticketTypeId: ticket.id,
        status: "FREE_CONFIRMED",
      },
      update: {
        ticketTypeId: ticket.id,
        status: "FREE_CONFIRMED",
      },
    });

    return NextResponse.json({ status: 200, slug: "rsvp-ok", attendee });
  } catch (err: any) {
    return NextResponse.json({ status: 401, slug: "unauthorized", message: "Unauthorized" });
  }
}
