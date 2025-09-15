"use client";

import { Suspense } from "react";
import EspaceClientInner from "./EspaceClientInner";

export default function EspaceClientPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading…</div>}>
      <EspaceClientInner />
    </Suspense>
  );
}
