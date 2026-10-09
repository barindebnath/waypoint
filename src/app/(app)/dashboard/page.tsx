import { redirect } from "next/navigation";

/** The v1 dashboard is decommissioned. The Board replaced it, so old links go there. */
export default function DashboardPage() {
  redirect("/board");
}
