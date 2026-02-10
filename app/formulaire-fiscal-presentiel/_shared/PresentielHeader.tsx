"use client";

import React from "react";
import Image from "next/image";

export default function PresentielHeader({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <header className="ff-header">
      <div className="ff-brand">
        <Image
          src="/logo-cq.png"
          alt="ComptaNet Québec"
          width={120}
          height={40}
          priority
          style={{ height: 40, width: "auto" }}
        />
        <div className="ff-brand-text">
          <strong>ComptaNet Québec</strong>
          <span>Présentiel</span>
        </div>
      </div>

      {right ? right : null}
    </header>
  );
}
