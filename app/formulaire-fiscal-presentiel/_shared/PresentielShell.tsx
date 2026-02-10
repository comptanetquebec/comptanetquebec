"use client";

import React from "react";
import PresentielHeader from "./PresentielHeader";

export default function PresentielShell({
  children,
  title,
  subtitle,
  right,
}: {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <main className="ff-bg">
      <div className="ff-container">
        <PresentielHeader right={right} />
        <div className="ff-title">
          <h1>{title}</h1>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        {children}
      </div>
    </main>
  );
}
