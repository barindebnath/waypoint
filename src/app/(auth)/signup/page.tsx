"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Data minimization: display name is derived from the email prefix — never collected.
    const { error } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0] || "user",
    });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign-up failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-[7px] border border-edge bg-surface-2 px-[11px] py-[9px] text-[13px] outline-none focus:border-accent";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-5 py-10">
      <div className="w-[360px]">
        <Link href="/" className="mx-auto mb-[22px] flex items-baseline justify-center gap-2 !text-ink">
          <span className="text-[15px] !text-accent">●</span>
          <span className="font-serif text-[22px] font-semibold">Waypoint</span>
        </Link>
        <div className="rounded-[14px] border border-edge bg-surface p-[26px] shadow-card">
          <h1 className="mb-1 text-center font-serif text-[26px] font-medium">Create your ledger</h1>
          <p className="mb-5 text-center font-serif text-[13.5px] italic text-ink-faint">
            Email, password, timezone — nothing else.
          </p>
          <form onSubmit={submit} className="flex flex-col gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs text-ink-muted">Password (10+ characters)</span>
              <input
                type="password"
                required
                minLength={10}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputCls}
              />
            </label>
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 rounded-lg bg-accent p-[11px] text-sm font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Creating…" : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-[12.5px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Sign in
          </Link>
          <span className="mx-2 text-ink-faint">·</span>
          <Link href="/privacy" className="!text-ink-muted hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
