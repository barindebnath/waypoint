"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) {
      setError(error.message ?? "Sign-in failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-xl font-semibold tracking-tight">
          <span className="text-live">◆</span> Waypoint
        </h1>
        <p className="mb-6 text-sm text-ink-muted">External memory for your work.</p>
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
            <span className="mb-1 block text-ink-muted">Password</span>
            <input
              type="password"
              required
              autoComplete="current-password"
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
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          No account?{" "}
          <Link href="/signup" className="text-live hover:underline">
            Sign up
          </Link>
          <span className="mx-2 text-ink-faint">·</span>
          <Link href="/privacy" className="text-ink-muted hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
