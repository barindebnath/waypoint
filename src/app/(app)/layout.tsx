import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppNav } from "@/components/app-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Server-side session guard: unauthenticated visitors never see app pages.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav email={session.user.email} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
