// app/protected/clients/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ClientsClient } from "@/components/clients-client";

export default async function ClientsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("lastName", { ascending: true })
    .order("firstName", { ascending: true });

  if (error) {
    console.error("Error fetching clients:", error);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-4xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Manage Clients</h1>
        <ClientsClient clients={clients || []} />
      </div>
    </div>
  );
}
