import { NextResponse } from "next/server";
import { verifySummitToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { piApprovePayment, piGetPayment } from "@/lib/pi";

export async function POST(req: Request) {
  try {
    const payload = await verifySummitToken(req.headers.get("Authorization"));
    const { paymentId } = (await req.json()) || {};
    if (!paymentId) {
      return NextResponse.json({ status: 400, slug: "missing-payment-id", message: "Missing paymentId" });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.piUid) {
      return NextResponse.json({ status: 401, slug: "unauthorized", message: "User not linked to Pi" });
    }

    const payment = await piGetPayment(paymentId);
    const paymentUserUid = payment?.user_uid || payment?.userUid || payment?.user?.uid;
    if (paymentUserUid && String(paymentUserUid) !== String(user.piUid)) {
      return NextResponse.json({ status: 403, slug: "payment-user-mismatch", message: "Payment does not belong to user" });
    }

    const amount = Number(payment?.amount ?? 0);
    const memo = String(payment?.memo ?? "");
    const metadata = payment?.metadata || {};
    const eventId = metadata?.eventId;
    const ticketTypeId = metadata?.ticketTypeId;

    if (!eventId) {
      return NextResponse.json({ status: 400, slug: "missing-metadata", message: "Missing eventId in payment metadata", raw: payment });
    }

    // Upsert transaction record
    await db.paymentTransaction.upsert({
      where: { paymentId },
      create: {
        paymentId,
        amount: amount || 0,
        memo,
        raw: payment,
        status: "CREATED",
        currency: "PI",
        userId: user.id,
        eventId,
        ticketTypeId: ticketTypeId || null,
      },
      update: {
        amount: amount || 0,
        memo,
        raw: payment,
        userId: user.id,
        eventId,
        ticketTypeId: ticketTypeId || null,
      },
    });

    const approved = await piApprovePayment(paymentId);

    await db.paymentTransaction.update({
      where: { paymentId },
      data: { status: "APPROVED", raw: approved },
    });

    // Mark attendee as pending paid
    await db.attendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: {
        eventId,
        userId: user.id,
        ticketTypeId: ticketTypeId || null,
        status: "PAID_PENDING",
      },
      update: {
        ticketTypeId: ticketTypeId || null,
        status: "PAID_PENDING",
      },
    });

    return NextResponse.json({ status: 200, slug: "approved", approved });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ status: 500, slug: "server-error", message: err?.message || "Approval failed" });
  }
}
