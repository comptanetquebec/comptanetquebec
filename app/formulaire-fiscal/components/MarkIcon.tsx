"use client";
import React from "react";

export default function MarkIcon({ mark }: { mark?: boolean }) {
  if (!mark) return null;

  return (
    <span className="mark-icon" aria-hidden>
      ✓
    </span>
  );
}
