import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side session guard: unauthenticated visitors never see app pages.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return <AppShell email={session.user.email}>{children}</AppShell>;
}
