"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Logo } from "@/components/logo";
import { Spinner } from "@/components/spinner";

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
    router.push("/dashboard");
    router.refresh();
  }

  const inputCls =
    "w-full rounded-[7px] border border-edge bg-surface-2 px-[11px] py-[9px] text-[13px] outline-none focus:border-accent";

  return (
    <main className="flex min-h-screen flex-1 items-center justify-center px-5 py-10">
      <div className="w-[360px]">
        <Link href="/" className="mx-auto mb-[22px] flex items-center justify-center gap-2.5 !text-ink">
          <Logo className="h-6 w-6 -mt-0.5" />
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
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={10}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-9`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink-muted transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </label>
            {error && <p className="text-xs text-danger">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent p-[11px] text-sm font-semibold text-accent-ink hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {busy && <Spinner className="h-4 w-4 text-current" />}
              {busy ? "Creating account…" : "Create account"}
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
