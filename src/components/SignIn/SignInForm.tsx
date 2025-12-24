"use client";

import { useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { api } from "@/lib/utils";
import { useRouter } from "next/navigation";

export function SignInForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const incompleteRef = useRef<any>(null);

  useEffect(() => {
    const check = async () => {
      const token = window.localStorage.getItem("token");
      if (!token) return;
      try {
        const resp = await api.get("/api/auth/validate-token");
        if (resp.data?.status === 200) {
          router.push("/home");
        }
      } catch {}
    };
    check();
  }, [router]);

  const connectPi = async () => {
    try {
      setLoading(true);
      if (!window.Pi) {
        toast.error("Pi SDK not loaded. Please open in Pi Browser.");
        return;
      }

      await window.Pi.init({ version: "2.0" });

      const auth = await window.Pi.authenticate(["username", "payments"], (payment) => {
        if (payment) incompleteRef.current = payment;
      });

      const accessToken = auth?.accessToken;
      if (!accessToken) {
        toast.error("Missing Pi access token");
        return;
      }

      const resp = await api.post("/api/auth/pi-login", { accessToken });
      if (resp.data?.status !== 200) {
        toast.error(resp.data?.message || "Pi login failed");
        return;
      }

      const token = resp.data?.token;
      const user = resp.data?.user;
      const needsOnboarding = Boolean(resp.data?.needsOnboarding);

      window.localStorage.setItem("token", token);
      window.localStorage.setItem("userId", user?.id || "");
      // For UI: prefer app username, else Pi username
      window.localStorage.setItem("username", user?.username || user?.piUsername || "");
      // Legacy UI expects an email string; use Pi username for display.
      window.localStorage.setItem("email", user?.piUsername ? `${user.piUsername}@pi` : "");
      if (user?.imageUrl) window.localStorage.setItem("userImage", user.imageUrl);

      // Try to recover an incomplete payment (best effort).
      const inc = incompleteRef.current;
      if (inc?.identifier && inc?.transaction?.txid) {
        try {
          await api.post("/api/pi/payments/complete", { paymentId: inc.identifier, txid: inc.transaction.txid });
        } catch {}
      }

      if (needsOnboarding) router.push("/finish-signup");
      else router.push("/home");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Pi sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-2">
      <Toaster position="top-center" />
      <button
        onClick={connectPi}
        disabled={loading}
        className="mt-2 p-2 rounded-lg transition font-medium text-center w-full
          dark:bg-zinc-50 dark:text-zinc-800 dark:hover:bg-zinc-300
          bg-zinc-950 text-zinc-200 hover:bg-zinc-700"
      >
        {loading ? "Connecting..." : "Continue with Pi"}
      </button>
      <p className="text-xs mt-2 dark:text-zinc-400 text-zinc-600">
        Tip: If you don't see the Pi button working, open this site inside the Pi Browser.
      </p>
    </div>
  );
}
