"use client";

import React from "react";

export type YesNo = "oui" | "non" | "";

/* ===========================
   Field
=========================== */

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
  required = false,
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

/* ===========================
   CheckboxField
=========================== */

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
};

export function CheckboxField({ label, checked, onChange }: CheckboxFieldProps) {
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

/* ===========================
   YesNoField (sans effacer)
=========================== */

export type YesNoFieldProps = {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string; // stable pour chaque question
};

export function YesNoField({ label, value, onChange, name }: YesNoFieldProps) {
  // ✅ nom unique pour éviter que 2 questions partagent la même “radio group”
  const groupName = `ff-yn-${name}`;

  return (
    <div className="ff-yn">
      <div className="ff-label">{label}</div>

      <div className="ff-yn-row">
        <label className="ff-radio">
          <input
            type="radio"
            name={groupName}
            value="oui"
            checked={value === "oui"}
            onChange={() => onChange("oui")}
          />
          <span>Oui</span>
        </label>

        <label className="ff-radio">
          <input
            type="radio"
            name={groupName}
            value="non"
            checked={value === "non"}
            onChange={() => onChange("non")}
          />
          <span>Non</span>
        </label>
      </div>
    </div>
  );
}

/* ===========================
   SelectField
=========================== */

export type SelectOption<T extends string> = {
  value: Exclude<T, "">;
  label: string;
};

export type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: Array<SelectOption<T>>;
  required?: boolean;
  placeholderText?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholderText,
}: SelectFieldProps<T>) {
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
        <option value="">
          {placeholderText ?? (required ? "Choisir…" : "—")}
        </option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

