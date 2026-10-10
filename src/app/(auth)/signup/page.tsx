"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { AlertIcon, EyeIcon, EyeOffIcon } from "@/components/icons";
import { LogoTile } from "@/components/logo";
import { Spinner } from "@/components/spinner";
import { btnPrimary, inputClass } from "@/components/ui";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    // Data minimization: display name is derived from the email prefix — never collected.
    const { error: err } = await authClient.signUp.email({
      email,
      password,
      name: email.split("@")[0] || "user",
    });
    setBusy(false);
    if (err) {
      setError(err.message ?? "Registration failed");
      return;
    }
    router.push("/board");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-desk px-4 py-10">
      <div className="w-full max-w-[420px]">
        <div className="rounded-panel bg-bg p-7 sm:p-8">
          <Link href="/" className="inline-flex items-center gap-3 text-ink">
            <LogoTile className="h-11 w-11" />
            <span className="font-serif text-[20px] font-semibold tracking-tight">Waypoint</span>
          </Link>
          <h1 className="mt-8 font-serif text-[26px] font-semibold leading-tight tracking-tight">Create your ledger</h1>
          <p className="mt-1.5 text-[13.5px] text-ink-muted">Email, password, timezone — nothing else.</p>
          <form onSubmit={submit} className="mt-7 flex flex-col gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-ink-muted">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-ink-muted">Password (10+ characters)</span>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-12`}
                />
                {/* The toggle is outside the tab order, so Tab goes from the field to the submit button. */}
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-ink-faint transition-colors hover:bg-surface-3 hover:text-ink"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon className="h-[18px] w-[18px]" /> : <EyeIcon className="h-[18px] w-[18px]" />}
                </button>
              </div>
            </label>
            {error && (
              <p role="alert" className="flex items-start gap-2 rounded-xl bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
                <AlertIcon className="mt-px h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
            )}
            <button type="submit" disabled={busy} className={`${btnPrimary} mt-1 h-11! w-full`}>
              {busy && <Spinner className="h-4 w-4 text-current" />}
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>
        <p className="mt-5 text-center text-[12.5px] text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-ink underline underline-offset-4 hover:text-accent-fg">
            Sign in
          </Link>
          <span className="mx-2 text-ink-faint">·</span>
          <Link href="/privacy" className="text-ink-muted hover:text-ink hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </main>
  );
}
