import { TopBar } from "@/components/layout/TopBar";
import { LegalTabs } from "@/components/legal/LegalTabs";

export default function LegalPage() {
  return (
    <>
      <TopBar title="Legal" description="Privacy, terms, and cookie information" />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-2xl">
          <LegalTabs />
        </div>
      </div>
    </>
  );
}
