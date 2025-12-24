'use client'

import { RandomBg } from "@/components/Background/RandomBg";
import { Header } from "@/components/Header";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <RandomBg />
      <Header isSignedIn={true} />
      <main className="pt-20 px-6">
        <h1 className="text-2xl font-bold dark:text-zinc-50 text-zinc-950">Home</h1>
        <p className="mt-2 text-sm dark:text-zinc-300 text-zinc-700">
          Welcome to Summit. Use <b>Create</b> to publish an event and share its link.
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/create"
            className="px-4 py-2 rounded-lg font-semibold dark:bg-zinc-50 dark:text-zinc-900 bg-zinc-950 text-zinc-100"
          >
            Create event
          </Link>
          <Link
            href="/discover"
            className="px-4 py-2 rounded-lg font-semibold border dark:border-zinc-700 dark:text-zinc-200 border-zinc-300 text-zinc-800"
          >
            Discover
          </Link>
        </div>
      </main>
    </>
  );
}
