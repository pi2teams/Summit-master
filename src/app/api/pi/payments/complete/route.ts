import { NextResponse } from "next/server";
import { verifySummitToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { piCompletePayment, piGetPayment } from "@/lib/pi";

export async function POST(req: Request) {
  try {
    const payload = await verifySummitToken(req.headers.get("Authorization"));
    const { paymentId, txid } = (await req.json()) || {};

    if (!paymentId || !txid) {
      return NextResponse.json({ status: 400, slug: "missing-params", message: "Missing paymentId or txid" });
    }

    const user = await db.user.findUnique({ where: { id: payload.userId } });
    if (!user || !user.piUid) {
      return NextResponse.json({ status: 401, slug: "unauthorized", message: "User not linked to Pi" });
    }

    // Idempotency: if already completed with txid, return ok
    const existingTx = await db.paymentTransaction.findFirst({ where: { txid } });
    if (existingTx) {
      return NextResponse.json({ status: 200, slug: "already-recorded", message: "Transaction already recorded" });
    }

    const payment = await piGetPayment(paymentId);
    const paymentUserUid = payment?.user_uid || payment?.userUid || payment?.user?.uid;
    if (paymentUserUid && String(paymentUserUid) !== String(user.piUid)) {
      return NextResponse.json({ status: 403, slug: "payment-user-mismatch", message: "Payment does not belong to user" });
    }

    const metadata = payment?.metadata || {};
    const eventId = metadata?.eventId;
    const ticketTypeId = metadata?.ticketTypeId;

    if (!eventId) {
      return NextResponse.json({ status: 400, slug: "missing-metadata", message: "Missing eventId in payment metadata", raw: payment });
    }

    const completed = await piCompletePayment(paymentId, txid);

    await db.paymentTransaction.upsert({
      where: { paymentId },
      create: {
        paymentId,
        txid,
        amount: Number(payment?.amount ?? 0),
        currency: "PI",
        memo: String(payment?.memo ?? ""),
        raw: completed,
        status: "COMPLETED",
        userId: user.id,
        eventId,
        ticketTypeId: ticketTypeId || null,
      },
      update: {
        txid,
        raw: completed,
        status: "COMPLETED",
      },
    });

    await db.attendee.upsert({
      where: { eventId_userId: { eventId, userId: user.id } },
      create: {
        eventId,
        userId: user.id,
        ticketTypeId: ticketTypeId || null,
        status: "PAID_CONFIRMED",
      },
      update: {
        ticketTypeId: ticketTypeId || null,
        status: "PAID_CONFIRMED",
      },
    });

    return NextResponse.json({ status: 200, slug: "completed", completed });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ status: 500, slug: "server-error", message: err?.message || "Completion failed" });
  }
}
