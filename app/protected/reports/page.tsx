import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportsClient } from "@/components/reports-client";
import { getOrderReportData } from "@/lib/db/reports";

export default async function ReportsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const reportData = await getOrderReportData();

  return (
    <div className="flex-1 w-full flex flex-col gap-8 items-center">
      <div className="w-full max-w-6xl px-4 md:px-6">
        <h1 className="text-2xl font-bold mb-6">Operations Reports</h1>
        <ReportsClient initialOrderReportData={reportData} />
      </div>
    </div>
  );
}