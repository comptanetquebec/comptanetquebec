"use client";
import React from "react";

export type YesNo = "oui" | "non" | "";

export type SelectOption<T extends string> = { value: T; label: string };

export function Field({
  label,
  value,
  onChange,
  required = false,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  formatter,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  formatter?: (v: string) => string;
  autoComplete?: string;
}) {
  return (
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        className="ff-input"
        value={value}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          onChange(formatter ? formatter(raw) : raw);
        }}
        placeholder={placeholder}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export function YesNoField({
  name,
  label,
  value,
  onChange,
}: {
  name: string;
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="ff-field">
      <div className="ff-label">{label}</div>
      <div className="ff-yn">
        <label className="ff-yn-option">
          <input type="radio" name={name} checked={value === "oui"} onChange={() => onChange("oui")} />
          <span>Oui</span>
        </label>
        <label className="ff-yn-option">
          <input type="radio" name={name} checked={value === "non"} onChange={() => onChange("non")} />
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
  options: Array<SelectOption<T>>;
  required?: boolean;
}) {
  return (
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>
      <select className="ff-input" value={value} onChange={(e) => onChange(e.currentTarget.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
