import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types";
import ManagerDashboard from "./manager-dashboard";
import AgentDashboard from "./agent-dashboard";
import TeacherDashboard from "./teacher-dashboard";

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login");

  if (profile.role === "manager" || profile.role === "head") {
    return <ManagerDashboard profile={profile} />;
  }

  if (profile.role === "teacher") {
    return <TeacherDashboard profile={profile} />;
  }

  return <AgentDashboard profile={profile} />;
}
