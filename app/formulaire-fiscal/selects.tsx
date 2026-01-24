"use client";

import React from "react";

type YesNo = "oui" | "non" | "";

export function YesNoField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  const name = `yn_${label.replace(/\W+/g, "_").toLowerCase()}`;

  return (
    <div className="ff-yn">
      <div className="ff-label">{label}</div>

      <div className="ff-yn-row">
        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="oui"
            checked={value === "oui"}
            onChange={(e) => onChange(e.currentTarget.value as YesNo)}
          />
          <span>Oui</span>
        </label>

        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="non"
            checked={value === "non"}
            onChange={(e) => onChange(e.currentTarget.value as YesNo)}
          />
          <span>Non</span>
        </label>
      </div>
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: Exclude<T, "">; label: string }[];
  required?: boolean;
}) {
  return (
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>

      <select
        className="ff-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as T)}
        required={required}
      >
        <option value="">Choisir…</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
