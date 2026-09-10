"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Card } from "@/components/ui/Card";
import { LEGAL_DOCUMENTS } from "@/lib/legalContent";

export function LegalTabs() {
  const [active, setActive] = useState<(typeof LEGAL_DOCUMENTS)[number]["id"]>("privacy");
  const doc = LEGAL_DOCUMENTS.find((d) => d.id === active)!;

  return (
    <div className="flex flex-col gap-5">
      <SegmentedControl
        value={active}
        onChange={setActive}
        options={LEGAL_DOCUMENTS.map((d) => ({ value: d.id, label: d.title }))}
      />
      <motion.div key={doc.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-md-text-primary">{doc.title}</h2>
          <p className="mt-1 text-xs text-md-text-tertiary">{doc.updated}</p>
          <div className="mt-5 flex flex-col gap-5">
            {doc.sections.map((section) => (
              <div key={section.heading}>
                <h3 className="text-sm font-semibold text-md-text-primary">{section.heading}</h3>
                <div className="mt-1.5 flex flex-col gap-2">
                  {section.body.map((p, idx) => (
                    <p key={idx} className="text-[13px] leading-relaxed text-md-text-secondary">
                      {p}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
