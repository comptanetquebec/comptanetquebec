"use client";

import React, { useId } from "react";

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
  name?: string;
  min?: string | number;
  max?: string | number;
  pattern?: string;
  disabled?: boolean;
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
  name,
  min,
  max,
  pattern,
  disabled = false,
}: FieldProps) {
  const id = useId();

  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>

      <input
        id={id}
        name={name}
        className="ff-input"
        value={value}
        onChange={(e) => {
          const raw = e.currentTarget.value;
          onChange(formatter ? formatter(raw) : raw);
        }}
        placeholder={placeholder}
        required={required}
        aria-required={required || undefined}
        type={type}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        min={min}
        max={max}
        pattern={pattern}
        disabled={disabled}
      />
    </div>
  );
}

/* ===========================
   CheckboxField
=========================== */

export type CheckboxFieldProps = {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
};

export function CheckboxField({ label, checked, onChange, disabled = false }: CheckboxFieldProps) {
  const id = useId();

  return (
    <div className="ff-check">
      <input
        id={id}
        type="checkbox"
        className="ff-checkbox"
        checked={checked}
        onChange={(e) => onChange(e.currentTarget.checked)}
        disabled={disabled}
      />
      <label htmlFor={id}>{label}</label>
    </div>
  );
}

/* ===========================
   YesNoField (SANS “EFFACER”)
=========================== */

export type YesNoFieldProps = {
  label: string;
  value: YesNo;
  onChange: (v: YesNo) => void;
  name: string; // stable
  required?: boolean;
  disabled?: boolean;
  labels?: { yes: string; no: string }; // si un jour tu veux i18n
};

export function YesNoField({
  label,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  labels = { yes: "Oui", no: "Non" },
}: YesNoFieldProps) {
  return (
    <div className="ff-yn">
      <div className="ff-label">
        {label}
        {required ? " *" : ""}
      </div>

      <div className="ff-yn-row">
        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="oui"
            checked={value === "oui"}
            onChange={() => onChange("oui")}
            required={required}
            disabled={disabled}
          />
          <span>{labels.yes}</span>
        </label>

        <label className="ff-radio">
          <input
            type="radio"
            name={name}
            value="non"
            checked={value === "non"}
            onChange={() => onChange("non")}
            required={required}
            disabled={disabled}
          />
          <span>{labels.no}</span>
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
  disabled?: boolean;
  name?: string;
  autoComplete?: string;
};

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
  required = false,
  placeholderText,
  disabled = false,
  name,
  autoComplete,
}: SelectFieldProps<T>) {
  const id = useId();

  return (
    <div className="ff-field">
      <label className="ff-label" htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </label>

      <select
        id={id}
        name={name}
        className="ff-select"
        value={value}
        onChange={(e) => onChange(e.currentTarget.value as T)}
        required={required}
        aria-required={required || undefined}
        disabled={disabled}
        autoComplete={autoComplete}
      >
        <option value="">{placeholderText ?? (required ? "Choisir…" : "—")}</option>

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

