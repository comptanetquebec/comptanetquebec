"use client";

import React from "react";

export type YesNo = "oui" | "non" | "";
export type ProvinceCode =
  | "QC"
  | "ON"
  | "NB"
  | "NS"
  | "PE"
  | "NL"
  | "MB"
  | "SK"
  | "AB"
  | "BC"
  | "YT"
  | "NT"
  | "NU";

export type FieldProps = {
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
};

export function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  formatter,
  autoComplete,
}: FieldProps) {
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
        required={required}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="ff-check">
      <input
        type="checkbox"
        className="ff-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
      />
      <span>{label}</span>
    </label>
  );
}

export function YesNoField({
  label,
  value,
  onChange,
  name,
}: {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string;
}) {
  return (
    <div className="ff-yn">
      <div className="ff-label">{label}</div>

      <div className="ff-yn-row">
        <label className="ff-radio">
          <input type="radio" name={name} value="oui" checked={value === "oui"} onChange={() => onChange("oui")} />
          <span>Oui</span>
        </label>

        <label className="ff-radio">
          <input type="radio" name={name} value="non" checked={value === "non"} onChange={() => onChange("non")} />
          <span>Non</span>
        </label>
      </div>

      {value !== "" && (
        <button type="button" className="ff-btn ff-btn-link" onClick={() => onChange("")}>
          Effacer
        </button>
      )}
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required,
  placeholderText,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: Exclude<T, "">; label: string }[];
  required?: boolean;
  placeholderText?: string;
}) {
  return (
    <label className="ff-field">
      <span className="ff-label">
        {label}
        {required ? " *" : ""}
      </span>

      <select className="ff-select" value={value} onChange={(e) => onChange(e.currentTarget.value as T)} required={required}>
        <option value="">{placeholderText ?? (required ? "Choisir…" : "—")}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
