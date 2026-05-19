import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar, MobileHeader, MobileNav } from "@/components/sidebar";
import { Profile } from "@/lib/types";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const typedProfile = profile as Profile;

  return (
    <div className="min-h-screen flex">
      <Sidebar profile={typedProfile} />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader profile={typedProfile} />
        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">{children}</main>
        <MobileNav profile={typedProfile} />
      </div>
    </div>
  );
}
