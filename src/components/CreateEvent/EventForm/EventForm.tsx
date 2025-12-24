"use client";

import React, { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/lib/utils";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";

const FormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startAt: z.string().min(1, "Start time is required"),
  endAt: z.string().min(1, "End time is required"),
  timezone: z.string().min(1, "Timezone is required"),
  location: z.string().optional(),
  capacity: z.coerce.number().int().min(0).optional(),
  requireApproval: z.boolean().default(false),
  isPaid: z.boolean().default(false),
  pricePi: z.coerce.number().min(0).optional(),
  ticketName: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default function EventForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const defaultTimezone = useMemo(() => {
    if (typeof Intl !== "undefined") {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    }
    return "UTC";
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      timezone: defaultTimezone,
      requireApproval: false,
      isPaid: false,
      ticketName: "General Admission",
      capacity: 0,
    },
  });

  const isPaid = watch("isPaid");

  const onSubmit = async (values: FormValues) => {
    try {
      setSubmitting(true);

      const startAt = new Date(values.startAt);
      const endAt = new Date(values.endAt);
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        toast.error("Invalid date/time");
        return;
      }

      // cover image from ImageSelection (Unsplash) stored in localStorage
      let coverImageUrl: string | undefined;
      try {
        const raw = window.localStorage.getItem("eventImage");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.image && String(parsed.image).startsWith("http")) {
            coverImageUrl = parsed.image;
          }
        }
      } catch {}

      const resp = await api.post("/api/events", {
        title: values.title,
        description: values.description,
        coverImageUrl,
        timezone: values.timezone,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        location: values.location,
        capacity: values.capacity,
        requireApproval: values.requireApproval,
        isPaid: values.isPaid,
        pricePi: values.isPaid ? values.pricePi : 0,
        ticketName: values.ticketName || "General Admission",
      });

      if (resp.data?.status !== 200) {
        toast.error(resp.data?.message || "Failed to create event");
        return;
      }

      const slug = resp.data?.event?.slug;
      toast.success("Event created");
      if (slug) {
        router.push(`/e/${slug}`);
      } else {
        router.push("/home");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.message || "Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-[28rem] p-4">
      <Toaster position="top-center" />
      <h2 className="text-xl font-semibold dark:text-zinc-50 text-zinc-900 mb-3">Create event</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
        <div>
          <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Title</label>
          <input
            {...register("title")}
            className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            placeholder="My awesome event"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Description</label>
          <textarea
            {...register("description")}
            className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            placeholder="What is this event about?"
            rows={4}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Start</label>
            <input
              type="datetime-local"
              {...register("startAt")}
              className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            />
            {errors.startAt && <p className="text-xs text-red-500 mt-1">{errors.startAt.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">End</label>
            <input
              type="datetime-local"
              {...register("endAt")}
              className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            />
            {errors.endAt && <p className="text-xs text-red-500 mt-1">{errors.endAt.message}</p>}
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Timezone</label>
          <input
            {...register("timezone")}
            className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            placeholder="UTC"
          />
          {errors.timezone && <p className="text-xs text-red-500 mt-1">{errors.timezone.message}</p>}
        </div>

        <div>
          <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Location</label>
          <input
            {...register("location")}
            className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
            placeholder="Online / City / Address"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Capacity</label>
            <input
              type="number"
              {...register("capacity")}
              className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
              min={0}
            />
          </div>
          <div className="flex items-center gap-2 mt-6">
            <input type="checkbox" {...register("requireApproval")} className="h-4 w-4" />
            <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Require approval</span>
          </div>
        </div>

        <div className="border rounded-xl p-3 dark:border-zinc-700 border-zinc-300">
          <div className="flex items-center gap-2">
            <input type="checkbox" {...register("isPaid")} className="h-4 w-4" />
            <span className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Paid ticket (Pi)</span>
          </div>

          {isPaid ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
              <div>
                <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Ticket name</label>
                <input
                  {...register("ticketName")}
                  className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
                />
              </div>
              <div>
                <label className="text-sm font-semibold dark:text-zinc-200 text-zinc-700">Price (Pi)</label>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  {...register("pricePi")}
                  className="mt-1 w-full p-2 rounded-lg border dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100 bg-zinc-100 border-zinc-300"
                />
                {errors.pricePi && <p className="text-xs text-red-500 mt-1">{errors.pricePi.message}</p>}
              </div>
            </div>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 w-full p-2 rounded-lg font-semibold dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 bg-zinc-950 text-zinc-100 hover:bg-zinc-700 transition"
        >
          {submitting ? "Creating..." : "Create event"}
        </button>
      </form>
    </div>
  );
}
