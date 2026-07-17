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

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          <span className="text-live">◆</span> Waypoint
        </h1>
        <p className="mb-6 text-sm text-ink-muted">
          Create an account. Only your email, a password hash, and a timezone are stored —{" "}
          <Link href="/privacy" className="underline">
            see privacy
          </Link>
          .
        </p>
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-edge bg-surface p-4">
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-edge bg-surface-2 px-3 py-2 text-ink outline-none focus:border-live"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-ink-muted">Password (10+ characters)</span>
            <input
              type="password"
              required
              minLength={10}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-edge bg-surface-2 px-3 py-2 text-ink outline-none focus:border-live"
            />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded bg-live/90 px-3 py-2 text-sm font-medium text-bg hover:bg-live disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create account"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Have an account?{" "}
          <Link href="/login" className="text-live hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
