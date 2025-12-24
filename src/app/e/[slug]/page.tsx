'use client'

import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import { api } from "@/lib/utils";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type TicketType = { id: string; name: string; pricePi: number };
type EventDetail = {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  startAt: string;
  endAt: string;
  timezone: string;
  location?: string | null;
  tickets: TicketType[];
  organizer: { username?: string | null; piUsername?: string | null };
};

export default function Page() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const accessTokenRef = useRef<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get(`/api/events/${slug}`);
        if (resp.data?.status === 200) {
          setEvent(resp.data.event);
        } else {
          toast.error(resp.data?.message || 'Event not found');
        }
      } catch (e: any) {
        toast.error(e?.response?.data?.message || 'Failed to load event');
      }
    };
    if (slug) load();
  }, [slug]);

  const primaryTicket = useMemo(() => event?.tickets?.[0], [event]);
  const isPaid = (primaryTicket?.pricePi ?? 0) > 0;

  const rsvpFree = async () => {
    if (!event) return;
    try {
      setLoading(true);
      const resp = await api.post(`/api/events/${event.id}/rsvp`, { ticketTypeId: primaryTicket?.id });
      if (resp.data?.status === 200) toast.success('RSVP confirmed');
      else toast.error(resp.data?.message || 'RSVP failed');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'RSVP failed');
    } finally {
      setLoading(false);
    }
  };

  const buyTicket = async () => {
    if (!event || !primaryTicket) return;
    try {
      setLoading(true);
      if (!window.Pi) {
        toast.error('Please open in Pi Browser to pay');
        return;
      }
      await window.Pi.init({ version: '2.0' });

      // Authenticate to get payments scope (Pi SDK requirement).
      const auth = await window.Pi.authenticate(['username', 'payments']);
      accessTokenRef.current = auth?.accessToken || null;

      const to = process.env.NEXT_PUBLIC_PI_PAYMENT_TO || undefined;

      const paymentData = {
        amount: primaryTicket.pricePi,
        memo: `Ticket: ${event.title}`,
        metadata: { eventId: event.id, ticketTypeId: primaryTicket.id, slug: event.slug },
        to,
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          try {
            const resp = await api.post('/api/pi/payments/approve', { paymentId });
            if (resp.data?.status !== 200) toast.error(resp.data?.message || 'Approval failed');
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Approval failed');
          }
        },
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          try {
            const resp = await api.post('/api/pi/payments/complete', { paymentId, txid });
            if (resp.data?.status === 200) toast.success('Payment completed. See you there!');
            else toast.error(resp.data?.message || 'Completion failed');
          } catch (e: any) {
            toast.error(e?.response?.data?.message || 'Completion failed');
          }
        },
        onCancel: () => toast('Cancelled'),
        onError: (err: any) => toast.error(err?.message || 'Payment error'),
      };

      await window.Pi.createPayment(paymentData as any, callbacks as any);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <RandomBg />
      <Header isSignedIn={true} />
      <Toaster position="top-center" />
      <main className="pt-20 px-6 max-w-3xl mx-auto">
        {!event ? (
          <p className="dark:text-zinc-300 text-zinc-700">Loading...</p>
        ) : (
          <>
            {event.coverImageUrl ? (
              <div
                className="h-56 rounded-2xl bg-cover bg-center border dark:border-zinc-700 border-zinc-300"
                style={{ backgroundImage: `url(${event.coverImageUrl})` }}
              />
            ) : null}

            <h1 className="mt-4 text-3xl font-bold dark:text-zinc-50 text-zinc-950">{event.title}</h1>
            <p className="mt-2 text-sm dark:text-zinc-300 text-zinc-700">
              {new Date(event.startAt).toLocaleString()} – {new Date(event.endAt).toLocaleString()}
              {event.location ? ` • ${event.location}` : ''}
            </p>

            {event.description ? (
              <p className="mt-4 whitespace-pre-wrap dark:text-zinc-200 text-zinc-800">{event.description}</p>
            ) : null}

            <div className="mt-6 p-4 rounded-xl border dark:border-zinc-700 border-zinc-300">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold dark:text-zinc-50 text-zinc-950">{primaryTicket?.name || 'Ticket'}</div>
                  <div className="text-sm dark:text-zinc-300 text-zinc-700">
                    {isPaid ? `${primaryTicket?.pricePi} Pi` : 'Free'}
                  </div>
                </div>
                {isPaid ? (
                  <button
                    onClick={buyTicket}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg font-semibold dark:bg-zinc-50 dark:text-zinc-900 bg-zinc-950 text-zinc-100"
                  >
                    {loading ? 'Processing...' : 'Buy with Pi'}
                  </button>
                ) : (
                  <button
                    onClick={rsvpFree}
                    disabled={loading}
                    className="px-4 py-2 rounded-lg font-semibold dark:bg-zinc-50 dark:text-zinc-900 bg-zinc-950 text-zinc-100"
                  >
                    {loading ? 'Saving...' : 'RSVP'}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </>
  );
}
