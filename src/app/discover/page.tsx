'use client'

import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import { api } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  slug: string;
  title: string;
  coverImageUrl?: string | null;
  startAt: string;
  location?: string | null;
  tickets?: { pricePi: number }[];
};

export default function Page() {
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await api.get('/api/events');
        if (resp.data?.status === 200) {
          setEvents(resp.data.events || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  return (
    <>
      <RandomBg />
      <Header isSignedIn={true} />
      <main className="pt-20 px-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold dark:text-zinc-50 text-zinc-950">Discover</h1>
        <p className="mt-2 text-sm dark:text-zinc-300 text-zinc-700">Browse public events.</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((e) => {
            const price = e.tickets?.[0]?.pricePi ?? 0;
            return (
              <Link
                key={e.id}
                href={`/e/${e.slug}`}
                className="border rounded-xl overflow-hidden dark:border-zinc-700 border-zinc-300 hover:brightness-110 transition"
              >
                {e.coverImageUrl ? (
                  <div
                    className="h-40 bg-cover bg-center"
                    style={{ backgroundImage: `url(${e.coverImageUrl})` }}
                  />
                ) : (
                  <div className="h-40 bg-zinc-200 dark:bg-zinc-800" />
                )}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-semibold dark:text-zinc-50 text-zinc-950 truncate">{e.title}</h2>
                    <span className="text-xs px-2 py-1 rounded-full border dark:border-zinc-700 border-zinc-300 dark:text-zinc-200 text-zinc-700">
                      {price > 0 ? `${price} Pi` : 'Free'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs dark:text-zinc-300 text-zinc-600">
                    {new Date(e.startAt).toLocaleString()} {e.location ? `• ${e.location}` : ''}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
