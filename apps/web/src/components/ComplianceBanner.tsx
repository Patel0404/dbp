import { fetchComplianceMode } from "@/lib/api";

export async function ComplianceBanner() {
  let notice: string | undefined;
  try {
    const mode = await fetchComplianceMode();
    notice = mode.notice;
  } catch {
    notice = "Advisory mode: recommendations only. Model probabilities are estimates, not guarantees.";
  }
  return (
    <div className="px-4 py-2 bg-[#111a36] text-[11px] secondary border-b border-[#1c2540]">
      {notice}
    </div>
  );
}
